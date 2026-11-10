import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { apiErrorMessage, apiUrl, extractEntityId, isDeniedAccess, parseAuthBody, unwrapList } from '../api/api.util';
import type { ApiCartItem } from '../api/api.models';

export interface ShippingFeeRow {
  governorate: string;
  fee: number;
}

export interface WheelPrizeRow {
  id: number;
  labelAr: string;
  labelEn: string;
  detailAr?: string | null;
  detailEn?: string | null;
  kind: string;
  percent?: number | null;
}

export interface WheelSpinRow extends WheelPrizeRow {
  prizeId: number;
  index: number;
  token?: string | null;
}

export interface RemoteLine {
  productId: string;
  qty: number;
}

function asLines(body: unknown): RemoteLine[] {
  if (!body) return [];
  const rows = unwrapList(body);
  const list = rows.length ? rows : Array.isArray(body) ? body : [];
  return list
    .map((row) => {
      const item = row as ApiCartItem;
      const id = item.productId ?? item.product?.id;
      const qty = item.quantity ?? item.qty ?? 0;
      if (id == null || qty <= 0) return null;
      return { productId: String(id), qty };
    })
    .filter((x): x is RemoteLine => !!x);
}

function asIds(body: unknown): string[] {
  if (!body) return [];
  const rows = unwrapList(body);
  return rows
    .map((row) => {
      if (typeof row === 'number' || typeof row === 'string') return String(row);
      const rec = row as { productId?: number; id?: number; product?: { id?: number } };
      const id = rec.productId ?? rec.product?.id ?? rec.id;
      return id == null ? null : String(id);
    })
    .filter((x): x is string => !!x);
}

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  constructor(private http: HttpClient) {}

  getCart(): Observable<RemoteLine[]> {
    return this.http.get(apiUrl('/api/Cart'), { responseType: 'text' }).pipe(
      map((body) => asLines(parseAuthBody(body))),
      catchError((err) => (isDeniedAccess(err) ? throwError(() => err) : of([])))
    );
  }

  addToCart(productId: string, quantity: number): Observable<unknown> {
    const id = Number(productId);
    if (!Number.isFinite(id) || id <= 0 || quantity <= 0) {
      return throwError(() => new Error('CART'));
    }
    return this.http.post(apiUrl('/api/Cart/items/AddToCart'), {
      productId: id,
      quantity,
    });
  }

  updateItem(productId: string, quantity: number): Observable<unknown> {
    const id = Number(productId);
    if (!Number.isFinite(id) || id <= 0) {
      return throwError(() => new Error('CART'));
    }
    return this.http.put(apiUrl('/api/Cart/items/UpdateItem'), {
      productId: id,
      quantity,
    });
  }

  removeItem(productId: string): Observable<unknown> {
    return this.http.delete(apiUrl('/api/Cart/items/RemoveItem'), { params: { productId } });
  }

  getShippingFees(): Observable<ShippingFeeRow[]> {
    return this.http.get(apiUrl('/api/Shipping/GetAll'), { responseType: 'text' }).pipe(
      map((body) =>
        (unwrapList(body) as Record<string, unknown>[]).map((row) => ({
          governorate: String(row['governorate'] ?? row['Governorate'] ?? ''),
          fee: Number(row['price'] ?? row['Price']) || 0,
        }))
      ),
      catchError(() => of([]))
    );
  }

  getWheelPrizes(): Observable<WheelPrizeRow[]> {
    return this.http.get<WheelPrizeRow[]>(apiUrl('/api/Wheel/GetPrizes'), { params: { activeOnly: 'true' } });
  }

  spinWheel(): Observable<WheelSpinRow> {
    return this.http.post<WheelSpinRow>(apiUrl('/api/Wheel/Spin'), {});
  }

  checkout(dto: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
    paymentMethod: 'cash' | 'visa';
    notes?: string;
    spinToken?: string;
    items: { productId: number; quantity: number }[];
  }): Observable<{ id: string }> {
    if (!dto.items.length) {
      return throwError(() => new Error('CART_EMPTY'));
    }
    return this.http
      .post(apiUrl('/api/Orders/Checkout'), dto, { observe: 'response', responseType: 'text' })
      .pipe(
        map((res) => ({ id: extractEntityId(parseAuthBody(res.body)) })),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'CHECKOUT'))))
      );
  }

  syncCart(lines: RemoteLine[]): Observable<unknown> {
    if (!lines.length) return of(null);
    return this.getCart().pipe(
      switchMap((remote) => {
        const ops = lines.map((line) => {
          const existing = remote.find((row) => row.productId === line.productId);
          if (existing) {
            return existing.qty === line.qty ? of(null) : this.updateItem(line.productId, line.qty);
          }
          return this.addToCart(line.productId, line.qty);
        });
        return forkJoin(ops);
      })
    );
  }

  getWishlist(): Observable<string[]> {
    return this.http.get(apiUrl('/api/Wishlist/GetWishlist'), { responseType: 'text' }).pipe(
      map((body) => asIds(parseAuthBody(body))),
      catchError(() => of([]))
    );
  }

  addWishlist(productId: string): Observable<unknown> {
    return this.http.post(apiUrl(`/api/Wishlist/items/AddItem/${productId}`), {}).pipe(catchError(() => of(null)));
  }

  removeWishlist(productId: string): Observable<unknown> {
    return this.http
      .delete(apiUrl(`/api/Wishlist/items/RemoveItem/${productId}`))
      .pipe(catchError(() => of(null)));
  }
}
