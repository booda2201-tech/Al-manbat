import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import type { ApiAdvertisement, ApiAnnouncement, ApiCategory, ApiProduct, ApiVideo } from '../api/api.models';
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

  getOffers(): Observable<ApiProduct[]> {
    return this.http.get(apiUrl('/api/Products/GetOffers')).pipe(
      map((body) => unwrapList(body) as ApiProduct[])
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

  deleteProductImage(productId: number, imageId: number): Observable<unknown> {
    return this.http
      .delete(apiUrl(`/api/Products/DeleteProductImage/${productId}/${imageId}`))
      .pipe(this.fail('DELETE_IMAGE'));
  }

  deleteProductImageByUrl(productId: number, url: string): Observable<unknown> {
    return this.http
      .delete(apiUrl(`/api/Products/DeleteProductImageByUrl/${productId}`), { params: { url } })
      .pipe(this.fail('DELETE_IMAGE'));
  }

  addCategory(dto: Partial<ApiCategory>, image?: File | null): Observable<unknown> {
    return this.http.post(apiUrl('/api/Categories/AddCategory'), toCategoryFormData(dto, image)).pipe(this.fail('ADD_CATEGORY'));
  }

  updateCategory(dto: Partial<ApiCategory>, image?: File | null): Observable<unknown> {
    const id = dto.id;
    if (id == null) {
      return throwError(() => new Error('UPDATE_CATEGORY'));
    }
    return this.http.put(apiUrl(`/api/Categories/UpdateCategory/${id}`), toCategoryFormData(dto, image)).pipe(this.fail('UPDATE_CATEGORY'));
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

  getAnnouncements(): Observable<ApiAnnouncement[]> {
    return this.http.get(apiUrl('/api/Announcements/GetAll'), { responseType: 'text' }).pipe(
      map((body) => unwrapList(body) as ApiAnnouncement[]),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'ANNOUNCEMENTS'))))
    );
  }

  addAnnouncement(dto: Partial<ApiAnnouncement>): Observable<unknown> {
    return this.http.post(apiUrl('/api/Announcements/Add'), announcementBody(dto)).pipe(this.fail('ADD_ANNOUNCEMENT'));
  }

  updateAnnouncement(dto: Partial<ApiAnnouncement>): Observable<unknown> {
    if (dto.id == null) return throwError(() => new Error('UPDATE_ANNOUNCEMENT'));
    return this.http
      .put(apiUrl(`/api/Announcements/Update/${dto.id}`), announcementBody(dto))
      .pipe(this.fail('UPDATE_ANNOUNCEMENT'));
  }

  deleteAnnouncement(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Announcements/Delete/${id}`)).pipe(this.fail('DELETE_ANNOUNCEMENT'));
  }

  getAdvertisements(): Observable<ApiAdvertisement[]> {
    return this.http.get(apiUrl('/api/Advertisements/GetAll')).pipe(
      map((body) => unwrapList(body) as ApiAdvertisement[]),
      catchError(() => of([]))
    );
  }

  addAdvertisement(dto: Partial<ApiAdvertisement>, image: File): Observable<unknown> {
    return this.http
      .post(apiUrl('/api/Advertisements/Add'), advertisementForm(dto, image))
      .pipe(this.fail('ADD_ADVERTISEMENT'));
  }

  updateAdvertisement(dto: Partial<ApiAdvertisement>, image?: File | null): Observable<unknown> {
    if (dto.id == null) return throwError(() => new Error('UPDATE_ADVERTISEMENT'));
    return this.http
      .put(apiUrl(`/api/Advertisements/Update/${dto.id}`), advertisementForm(dto, image))
      .pipe(this.fail('UPDATE_ADVERTISEMENT'));
  }

  deleteAdvertisement(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Advertisements/Delete/${id}`)).pipe(this.fail('DELETE_ADVERTISEMENT'));
  }

  getVideos(): Observable<ApiVideo[]> {
    return this.http.get(apiUrl('/api/Videos/GetAll')).pipe(
      map((body) => unwrapList(body) as ApiVideo[]),
      catchError(() => of([]))
    );
  }

  addVideo(dto: Partial<ApiVideo>, video?: File | null, thumbnail?: File | null): Observable<unknown> {
    return this.http
      .post(apiUrl('/api/Videos/Add'), videoForm(dto, video, thumbnail, false))
      .pipe(this.fail('ADD_VIDEO'));
  }

  updateVideo(
    dto: Partial<ApiVideo>,
    video?: File | null,
    thumbnail?: File | null,
    removeThumbnail = false
  ): Observable<unknown> {
    if (dto.id == null) return throwError(() => new Error('UPDATE_VIDEO'));
    return this.http
      .put(apiUrl(`/api/Videos/Update/${dto.id}`), videoForm(dto, video, thumbnail, removeThumbnail))
      .pipe(this.fail('UPDATE_VIDEO'));
  }

  getShippingFees(): Observable<{ governorate: string; price: number }[]> {
    return this.http.get(apiUrl('/api/Shipping/GetAll'), { responseType: 'text' }).pipe(
      map((body) =>
        (unwrapList(body) as Record<string, unknown>[]).map((row) => ({
          governorate: String(row['governorate'] ?? row['Governorate'] ?? ''),
          price: Number(row['price'] ?? row['Price']) || 0,
        }))
      ),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'SHIPPING'))))
    );
  }

  updateShippingFees(rows: { governorate: string; price: number }[]): Observable<unknown> {
    return this.http
      .put(apiUrl('/api/Shipping/Save'), {
        rates: rows.map((row) => ({
          governorate: row.governorate,
          price: Number(row.price) || 0,
        })),
      })
      .pipe(this.fail('UPDATE_SHIPPING'));
  }

  deleteVideo(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Videos/Delete/${id}`)).pipe(this.fail('DELETE_VIDEO'));
  }

  getWheelPrizes(): Observable<ApiWheelPrize[]> {
    return this.http.get(apiUrl('/api/Wheel/GetPrizes'), { responseType: 'text' }).pipe(
      map((body) => (unwrapList(body) as Record<string, unknown>[]).map(mapWheelPrize)),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'WHEEL'))))
    );
  }

  addWheelPrize(dto: WheelPrizeDraft): Observable<unknown> {
    return this.http.post(apiUrl('/api/Wheel/Add'), wheelPrizeBody(dto)).pipe(this.fail('ADD_WHEEL'));
  }

  updateWheelPrize(dto: WheelPrizeDraft): Observable<unknown> {
    if (!dto.id) return throwError(() => new Error('UPDATE_WHEEL'));
    return this.http.put(apiUrl(`/api/Wheel/Update/${dto.id}`), wheelPrizeBody(dto)).pipe(this.fail('UPDATE_WHEEL'));
  }

  deleteWheelPrize(id: number): Observable<unknown> {
    return this.http.delete(apiUrl(`/api/Wheel/Delete/${id}`)).pipe(this.fail('DELETE_WHEEL'));
  }

  private fail(code: string) {
    return catchError((err) => throwError(() => new Error(apiErrorMessage(err, code))));
  }
}

export interface ApiWheelPrize {
  id: number;
  labelAr: string;
  labelEn: string;
  detailAr: string;
  detailEn: string;
  kind: string;
  percent: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface WheelPrizeDraft {
  id: number;
  labelAr: string;
  labelEn: string;
  detailAr: string;
  detailEn: string;
  kind: string;
  percent: number | null;
  sortOrder: number;
  isActive: boolean;
}

function mapWheelPrize(row: Record<string, unknown>): ApiWheelPrize {
  const kind = String(row['kind'] ?? row['Kind'] ?? 'Gift');
  const percent = Number(row['percent'] ?? row['Percent']);
  return {
    id: Number(row['id'] ?? row['Id']) || 0,
    labelAr: String(row['labelAr'] ?? row['LabelAr'] ?? ''),
    labelEn: String(row['labelEn'] ?? row['LabelEn'] ?? ''),
    detailAr: String(row['detailAr'] ?? row['DetailAr'] ?? ''),
    detailEn: String(row['detailEn'] ?? row['DetailEn'] ?? ''),
    kind,
    percent: Number.isFinite(percent) ? percent : null,
    sortOrder: Number(row['sortOrder'] ?? row['SortOrder']) || 0,
    isActive: row['isActive'] !== false && row['IsActive'] !== false,
  };
}

function wheelPrizeBody(dto: WheelPrizeDraft) {
  return {
    labelAr: dto.labelAr.trim(),
    labelEn: dto.labelEn.trim(),
    detailAr: dto.detailAr.trim(),
    detailEn: dto.detailEn.trim(),
    kind: dto.kind,
    percent: dto.kind === 'Percent' ? Number(dto.percent) || 0 : 0,
    sortOrder: Number(dto.sortOrder) || 0,
    isActive: dto.isActive !== false,
  };
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

function appendList(form: FormData, key: string, rows: string[]): void {
  if (!rows.length) {
    form.append(key, '');
    return;
  }
  for (const row of rows) form.append(key, row);
}

function productWriteBody(dto: Partial<ApiProduct>): Record<string, unknown> {
  const nameAr = text(dto.nameAr, dto.name);
  const nameEn = text(dto.nameEn, dto.name);
  const descriptionAr = text(dto.descriptionAr, dto.description);
  const descriptionEn = text(dto.descriptionEn, dto.description);
  const newPrice = Number(dto.newPrice ?? dto.finalPrice ?? dto.price) || 0;
  const listed = Number(dto.price) || 0;
  const oldRaw = dto.oldPrice == null ? (listed > newPrice ? listed : null) : Number(dto.oldPrice);
  const oldPrice = oldRaw != null && Number.isFinite(oldRaw) && oldRaw > newPrice ? oldRaw : null;
  const discountDays = oldPrice != null ? offerDays(dto.discountDays) : null;
  const acidity = dto.acidity == null ? null : Number(dto.acidity);
  const body: Record<string, unknown> = {
    name: nameEn || nameAr,
    nameAr,
    nameEn,
    categoryId: Number(dto.categoryId) || 0,
    description: descriptionEn || descriptionAr,
    descriptionAr,
    descriptionEn,
    price: newPrice,
    oldPrice,
    newPrice,
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
    isExclusive: typeof dto.isExclusive === 'boolean' ? dto.isExclusive : null,
  };
  if (discountDays != null) body['discountDays'] = discountDays;
  return body;
}

function offerDays(value: unknown): number | null {
  if (value == null || value === '') return null;
  const days = Math.round(Number(value));
  if (!Number.isFinite(days) || days < 1 || days > 365) return null;
  return days;
}

function appendValue(form: FormData, key: string, value: unknown): void {
  if (value == null || value === '') return;
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
  const body = productWriteBody(dto);
  for (const [key, value] of Object.entries(body)) {
    appendValue(form, key, value);
  }
  appendValue(form, 'Price', body['price']);
  appendValue(form, 'OldPrice', body['oldPrice']);
  appendValue(form, 'NewPrice', body['newPrice']);
  appendValue(form, 'DiscountDays', body['discountDays']);
  appendList(form, 'highlightsAr', lines(dto.highlightsAr, dto.highlights));
  appendList(form, 'highlightsEn', lines(dto.highlightsEn, dto.highlights));
  const files = asFiles(images);
  for (const file of files) {
    form.append('images', file, file.name);
    form.append('Images', file, file.name);
  }
  if (files.length === 1) {
    form.append('Image', files[0], files[0].name);
  }
  return form;
}

function announcementBody(dto: Partial<ApiAnnouncement>): Record<string, unknown> {
  return {
    textAr: text(dto.textAr, dto.text),
    textEn: text(dto.textEn, dto.text),
    link: text(dto.link) || null,
    sortOrder: Number(dto.sortOrder) || 0,
    isActive: dto.isActive !== false,
  };
}

function advertisementForm(dto: Partial<ApiAdvertisement>, image?: File | null): FormData {
  const form = new FormData();
  appendValue(form, 'badgeAr', text(dto.badgeAr, dto.badge));
  appendValue(form, 'badgeEn', text(dto.badgeEn, dto.badge));
  appendValue(form, 'eyebrowAr', text(dto.eyebrowAr, dto.eyebrow));
  appendValue(form, 'eyebrowEn', text(dto.eyebrowEn, dto.eyebrow));
  appendValue(form, 'headingAr', text(dto.headingAr, dto.heading));
  appendValue(form, 'headingEn', text(dto.headingEn, dto.heading));
  appendValue(form, 'bodyAr', text(dto.bodyAr, dto.body));
  appendValue(form, 'bodyEn', text(dto.bodyEn, dto.body));
  appendValue(form, 'primaryLabelAr', text(dto.primaryLabelAr, dto.primaryLabel));
  appendValue(form, 'primaryLabelEn', text(dto.primaryLabelEn, dto.primaryLabel));
  appendValue(form, 'primaryLink', text(dto.primaryLink));
  appendValue(form, 'secondaryLabelAr', text(dto.secondaryLabelAr, dto.secondaryLabel));
  appendValue(form, 'secondaryLabelEn', text(dto.secondaryLabelEn, dto.secondaryLabel));
  appendValue(form, 'secondaryLink', text(dto.secondaryLink));
  appendValue(form, 'sortOrder', Number(dto.sortOrder) || 0);
  appendValue(form, 'isActive', dto.isActive !== false);
  if (image) form.append('image', image, image.name);
  return form;
}

function videoForm(dto: Partial<ApiVideo>, video?: File | null, thumbnail?: File | null, removeThumbnail = false): FormData {
  const form = new FormData();
  appendValue(form, 'titleAr', text(dto.titleAr, dto.title));
  appendValue(form, 'titleEn', text(dto.titleEn, dto.title));
  appendValue(form, 'descriptionAr', text(dto.descriptionAr, dto.description));
  appendValue(form, 'descriptionEn', text(dto.descriptionEn, dto.description));
  appendValue(form, 'videoUrl', text(dto.videoUrl));
  appendValue(form, 'sortOrder', Number(dto.sortOrder) || 0);
  appendValue(form, 'isActive', dto.isActive !== false);
  if (removeThumbnail) appendValue(form, 'removeThumbnail', true);
  if (video) form.append('video', video, video.name);
  if (thumbnail) form.append('thumbnail', thumbnail, thumbnail.name);
  return form;
}

function toCategoryFormData(dto: Partial<ApiCategory>, image?: File | null): FormData {
  const form = new FormData();
  const nameAr = (dto.nameAr || dto.name || '').trim();
  const nameEn = (dto.nameEn || '').trim();
  const descriptionAr = (dto.descriptionAr || dto.description || '').trim();
  const descriptionEn = (dto.descriptionEn || '').trim();
  appendValue(form, 'nameAr', nameAr);
  appendValue(form, 'nameEn', nameEn);
  appendValue(form, 'name', nameAr);
  appendValue(form, 'descriptionAr', descriptionAr);
  appendValue(form, 'descriptionEn', descriptionEn);
  appendValue(form, 'description', descriptionAr || descriptionEn);
  if (image) {
    form.append('image', image, image.name);
    form.append('Image', image, image.name);
  }
  return form;
}
