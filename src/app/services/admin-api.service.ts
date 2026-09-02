import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import type { ApiCategory, ApiProduct } from '../api/api.models';
import { apiErrorMessage, apiUrl, parseAuthBody, unwrapList } from '../api/api.util';
import type { Order } from '../types';
import { mapOrder } from './account-api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<ApiProduct[]> {
    return this.http.get(apiUrl('/api/Products/GetAllProducts')).pipe(
      map((body) => unwrapList(body) as ApiProduct[]),
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<ApiCategory[]> {
    return this.http.get(apiUrl('/api/Categories/GetAllCategories')).pipe(
      map((body) => unwrapList(body) as ApiCategory[]),
      catchError(() => of([]))
    );
  }

  addProduct(dto: Partial<ApiProduct>, images?: File | File[] | null): Observable<unknown> {
    return this.http
      .post(apiUrl('/api/Products/AddProduct'), toProductFormData(dto, images))
      .pipe(this.fail('ADD_PRODUCT'));
  }

  updateProduct(dto: Partial<ApiProduct>, images?: File | File[] | null): Observable<unknown> {
    const id = dto.id;
    if (id == null) {
      return throwError(() => new Error('UPDATE_PRODUCT'));
    }
    return this.http
      .put(apiUrl(`/api/Products/UpdateProduct/${id}`), toProductFormData(dto, images))
      .pipe(this.fail('UPDATE_PRODUCT'));
  }

  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Products/DeleteProduct/${id}`)).pipe(this.fail('DELETE_PRODUCT'));
  }

  addCategory(dto: Partial<ApiCategory>): Observable<unknown> {
    return this.http.post(apiUrl('/api/Categories/AddCategory'), dto).pipe(this.fail('ADD_CATEGORY'));
  }

  updateCategory(dto: Partial<ApiCategory>): Observable<unknown> {
    const id = dto.id;
    if (id == null) {
      return throwError(() => new Error('UPDATE_CATEGORY'));
    }
    return this.http.put(apiUrl(`/api/Categories/UpdateCategory/${id}`), dto).pipe(this.fail('UPDATE_CATEGORY'));
  }

  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Categories/DeleteCategory/${id}`)).pipe(this.fail('DELETE_CATEGORY'));
  }

  getOrders(): Observable<Order[]> {
    return this.http.get(apiUrl('/api/Orders/admin/GetAllOrders'), { responseType: 'text' }).pipe(
      map((body): Order[] => unwrapList(parseAuthBody(body)).map(mapOrder).filter((row): row is Order => !!row)),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'ORDERS'))))
    );
  }

  getOrder(id: string): Observable<Order | null> {
    return this.http.get(apiUrl(`/api/Orders/admin/GetOrder/${id}`), { responseType: 'text' }).pipe(
      map((body) => mapOrder(parseAuthBody(body))),
      catchError(() => of(null))
    );
  }

  enrichOrders(orders: Order[]): Observable<Order[]> {
    if (!orders.length) return of([]);
    const jobs = orders.map((order) => {
      if (order.customerName && order.customerPhone && order.itemIds.length) return of(order);
      return this.getOrder(order.id).pipe(map((detail) => mergeOrderContact(order, detail)));
    });
    return forkJoin(jobs);
  }

  updateOrderStatus(id: string, status: string): Observable<unknown> {
    return this.http
      .put(apiUrl(`/api/Orders/admin/UpdateStatus/${id}`), { status })
      .pipe(this.fail('ORDER_STATUS'));
  }

  private fail(code: string) {
    return catchError((err) => throwError(() => new Error(apiErrorMessage(err, code))));
  }
}

function mergeOrderContact(base: Order, detail: Order | null): Order {
  if (!detail) return base;
  return {
    ...base,
    customerName: base.customerName || detail.customerName,
    customerPhone: base.customerPhone || detail.customerPhone,
    customerAddress: base.customerAddress || detail.customerAddress,
    orderNotes: base.orderNotes || detail.orderNotes,
    paymentMethod: base.paymentMethod || detail.paymentMethod,
    total: base.total || detail.total,
    itemIds: base.itemIds.length ? base.itemIds : detail.itemIds,
    snapshots: mergeSnapshots(detail.snapshots, base.snapshots),
    apiStatus: detail.apiStatus || base.apiStatus,
  };
}

function mergeSnapshots(
  primary?: Order['snapshots'],
  overlay?: Order['snapshots']
): Order['snapshots'] {
  const next = { ...(primary || {}) };
  for (const [id, row] of Object.entries(overlay || {})) {
    const current = next[id];
    next[id] = {
      name: row.name || current?.name || id,
      image: row.image || current?.image || '',
      price: row.price || current?.price,
      qty: row.qty || current?.qty,
    };
  }
  return next;
}

function text(primary?: string | null, fallback?: string | null): string {
  return (primary || fallback || '').trim();
}

function lines(value?: string[] | null, fallback?: string[] | null): string[] {
  const rows = (value ?? fallback ?? []).filter((item) => typeof item === 'string' && item.trim());
  return rows.map((item) => item.trim());
}

function csv(value?: string[] | null, fallback?: string[] | null): string | null {
  const rows = lines(value, fallback);
  return rows.length ? rows.join(',') : null;
}

function productWriteBody(dto: Partial<ApiProduct>): Record<string, unknown> {
  const nameAr = text(dto.nameAr, dto.name);
  const nameEn = text(dto.nameEn, dto.name);
  const descriptionAr = text(dto.descriptionAr, dto.description);
  const descriptionEn = text(dto.descriptionEn, dto.description);
  const percent = Number(dto.discountPercent);
  const days = Number(dto.discountDays ?? dto.discountDaysRemaining);
  const acidity = dto.acidity == null ? null : Number(dto.acidity);
  return {
    name: nameEn || nameAr,
    nameAr,
    nameEn,
    categoryId: Number(dto.categoryId) || 0,
    description: descriptionEn || descriptionAr,
    descriptionAr,
    descriptionEn,
    price: Number(dto.price) || 0,
    discountPercent: Number.isFinite(percent) && percent > 0 ? Math.min(100, percent) : null,
    discountDays: Number.isFinite(days) && days > 0 ? days : null,
    isNew: !!dto.isNew,
    isAvailable: dto.isAvailable !== false,
    delivery: text(dto.deliveryEn, dto.deliveryAr || dto.delivery) || null,
    deliveryAr: text(dto.deliveryAr, dto.delivery) || null,
    deliveryEn: text(dto.deliveryEn, dto.delivery) || null,
    size: text(dto.sizeEn, dto.sizeAr || dto.size) || null,
    sizeAr: text(dto.sizeAr, dto.size) || null,
    sizeEn: text(dto.sizeEn, dto.size) || null,
    origin: text(dto.originEn, dto.originAr || dto.origin) || null,
    originAr: text(dto.originAr, dto.origin) || null,
    originEn: text(dto.originEn, dto.origin) || null,
    variety: text(dto.varietyEn, dto.varietyAr || dto.variety) || null,
    varietyAr: text(dto.varietyAr, dto.variety) || null,
    varietyEn: text(dto.varietyEn, dto.variety) || null,
    harvest: text(dto.harvestEn, dto.harvestAr || dto.harvest) || null,
    harvestAr: text(dto.harvestAr, dto.harvest) || null,
    harvestEn: text(dto.harvestEn, dto.harvest) || null,
    acidity: acidity != null && Number.isFinite(acidity) ? acidity : null,
    highlights: csv(dto.highlights) || csv(dto.highlightsEn, dto.highlightsAr),
    highlightsAr: csv(dto.highlightsAr, dto.highlights),
    highlightsEn: csv(dto.highlightsEn, dto.highlights),
  };
}

function appendValue(form: FormData, key: string, value: unknown): void {
  if (value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item == null || item === '') continue;
        form.append(key, String(item));
      }
      return;
    }
  if (typeof value === 'boolean') {
    form.append(key, value ? 'true' : 'false');
    return;
  }
  form.append(key, String(value));
}

function asFiles(images?: File | File[] | null): File[] {
  if (!images) return [];
  return (Array.isArray(images) ? images : [images]).filter(Boolean);
}

function toProductFormData(dto: Partial<ApiProduct>, images?: File | File[] | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(productWriteBody(dto))) {
    appendValue(form, key, value);
  }
  const files = asFiles(images);
  for (const file of files) {
    form.append('Images', file, file.name);
  }
  if (files.length === 1) {
    form.append('Image', files[0], files[0].name);
  }
  return form;
}
