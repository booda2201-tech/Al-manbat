import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { apiUrl, extractEntityId } from '../api/api.util';
import type { ApiCart, ApiCartItem } from '../api/api.models';

export interface RemoteLine {
  productId: string;
  qty: number;
}

function asLines(body: unknown): RemoteLine[] {
  if (!body) return [];
  const record = body as ApiCart & { items?: ApiCartItem[] };
  const rows = record.items || record.cartItems || (Array.isArray(body) ? (body as ApiCartItem[]) : []);
  return rows
    .map((row) => {
      const id = row.productId ?? row.product?.id;
      const qty = row.quantity ?? row.qty ?? 0;
      if (id == null || qty <= 0) return null;
      return { productId: String(id), qty };
    })
    .filter((x): x is RemoteLine => !!x);
}

function asIds(body: unknown): string[] {
  if (!body) return [];
  const rows = Array.isArray(body)
    ? body
    : ((body as { items?: unknown[]; products?: unknown[] }).items ||
        (body as { products?: unknown[] }).products ||
        []);
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
    return this.http.get(apiUrl('/api/Cart')).pipe(
      map(asLines),
      catchError(() => of([]))
    );
  }

  addToCart(productId: string, quantity: number): Observable<unknown> {
    return this.http
      .post(apiUrl('/api/Cart/items/AddToCart'), { productId: Number(productId), quantity })
      .pipe(catchError(() => of(null)));
  }

  updateItem(productId: string, quantity: number): Observable<unknown> {
    return this.http
      .put(apiUrl('/api/Cart/items/UpdateItem'), { productId: Number(productId), quantity })
      .pipe(catchError(() => of(null)));
  }

  removeItem(productId: string): Observable<unknown> {
    return this.http
      .delete(apiUrl('/api/Cart/items/RemoveItem'), { params: { productId } })
      .pipe(catchError(() => of(null)));
  }

  checkout(dto: { addressId: number; paymentMethod: 'Cash' | 'Visa'; notes?: string }): Observable<{ id: string }> {
    return this.http.post(apiUrl('/api/Orders/Checkout'), dto).pipe(
      map((body) => ({ id: extractEntityId(body) }))
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
    return this.http.get(apiUrl('/api/Wishlist/GetWishlist')).pipe(
      map(asIds),
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
