import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap, throwError } from 'rxjs';
import { apiErrorMessage, apiUrl, unwrapList, unwrapPayload } from '../api/api.util';
import type { ApiCategory, ApiProduct } from '../api/api.models';
import { hydrateCatalog, mapReview } from '../api/mappers';
import type { Category, Product, Review } from '../types';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productList = signal<Product[]>([]);
  private readonly categoryList = signal<Category[]>([]);
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);

  readonly products = computed(() => this.productList());
  readonly categories = computed(() => this.categoryList());

  constructor(private http: HttpClient) {}

  load(): Observable<void> {
    return forkJoin({
      products: this.http.get<ApiProduct[]>(apiUrl('/api/Products/GetAllProducts')),
      categories: this.http.get<ApiCategory[]>(apiUrl('/api/Categories/GetAllCategories')),
      best: this.http.get<ApiProduct[]>(apiUrl('/api/Products/GetBestSellers')).pipe(catchError(() => of([] as ApiProduct[]))),
    }).pipe(
      tap(({ products, categories, best }) => {
        const hydrated = hydrateCatalog(products ?? [], categories ?? [], best ?? []);
        this.productList.set(hydrated.products);
        this.categoryList.set(hydrated.categories);
        this.error.set(null);
        this.ready.set(true);
      }),
      map(() => undefined),
      catchError((err) => {
        this.error.set('catalog');
        this.ready.set(true);
        console.error('Failed to load catalog', err);
        return of(undefined);
      })
    );
  }

  all(): Product[] {
    return this.productList();
  }

  byId(id: string): Product | undefined {
    return this.productList().find((p) => p.id === id);
  }

  bySlug(slug: string): Product | undefined {
    return this.productList().find((p) => p.slug === slug);
  }

  byCategory(slug: string): Product[] {
    return this.productList().filter((p) => p.category === slug);
  }

  withBadge(badge: Product['badges'][number]): Product[] {
    return this.productList().filter((p) => p.badges.includes(badge));
  }

  categoryBySlug(slug: string): Category | undefined {
    return this.categoryList().find((c) => c.slug === slug);
  }

  search(query: string, limit?: number): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return limit ? this.productList().slice(0, limit) : [];
    const hits = this.productList().filter((p) => {
      const hay = `${p.name.ar} ${p.name.en} ${p.brand.ar} ${p.brand.en} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
    return limit ? hits.slice(0, limit) : hits;
  }

  reviews(productId: string): Observable<Review[]> {
    return this.http.get(apiUrl(`/api/Products/GetReviews/${productId}`)).pipe(
      map((body) => unwrapList(body).map(mapReview).filter((row): row is Review => !!row)),
      tap((rows) => this.patchReviewStats(productId, rows)),
      catchError(() => of([]))
    );
  }

  addReview(productId: string, rating: number, comment: string): Observable<Review | null> {
    return this.http
      .post(apiUrl(`/api/Products/AddReview/${productId}`), {
        rating,
        comment: comment.trim() || null,
      })
      .pipe(
        map((body) => mapReview(unwrapPayload(body))),
        tap(() => this.bumpReviewStats(productId, rating)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'REVIEW'))))
      );
  }

  private patchReviewStats(productId: string, rows: Review[]): void {
    if (!rows.length) return;
    const avg = rows.reduce((sum, row) => sum + row.rating, 0) / rows.length;
    this.updateProduct(productId, { rating: avg, reviews: rows.length });
  }

  private bumpReviewStats(productId: string, rating: number): void {
    const product = this.byId(productId);
    if (!product) return;
    const count = product.reviews + 1;
    const avg = (product.rating * product.reviews + rating) / count;
    this.updateProduct(productId, { rating: avg, reviews: count });
  }

  private updateProduct(productId: string, patch: Partial<Product>): void {
    const list = this.productList();
    const index = list.findIndex((row) => row.id === productId);
    if (index < 0) return;
    const next = list.slice();
    next[index] = { ...next[index], ...patch };
    this.productList.set(next);
  }
}
