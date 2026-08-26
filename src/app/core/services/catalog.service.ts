import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Brand,
  CatalogQuery,
  CatalogResult,
  Category,
  Product,
  Review,
  SortOption,
} from '../models/commerce.models';
import {
  BRANDS,
  CATEGORIES,
  PRODUCTS,
  REVIEWS,
} from '../data/catalog.seed';
import { mockDelay } from '../utils/helpers';

/** MOCK BOUNDARY: swap this service for an HTTP catalog API. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly products = PRODUCTS;
  readonly categories = CATEGORIES;
  readonly brands = BRANDS;

  getCategories(): Category[] {
    return this.categories;
  }

  getBrands(): Brand[] {
    return this.brands;
  }

  brandName(id: string): string {
    return this.brands.find((b) => b.id === id)?.nameAr ?? id;
  }

  getBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  getById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  featured(): Product[] {
    return this.products.filter((p) => p.featured);
  }

  bestSellers(): Product[] {
    return this.products.filter((p) => p.bestSeller);
  }

  recentlyAdded(): Product[] {
    return this.products.filter((p) => p.recentlyAdded);
  }

  offers(): Product[] {
    return this.products.filter((p) => !!p.oldPrice && (p.discountPercent ?? 0) > 0);
  }

  related(product: Product, limit = 4): Product[] {
    return this.products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, limit);
  }

  reviewsFor(productId: string): Review[] {
    return REVIEWS.filter((r) => r.productId === productId);
  }

  searchPreview(query: string, limit = 5): Product[] {
    const q = query.trim();
    if (!q) return [];
    return this.filterList({ search: q }).slice(0, limit);
  }

  query(params: CatalogQuery): Observable<CatalogResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 9;
    const filtered = this.filterList(params);
    const sorted = this.sortList(filtered, params.sort ?? 'relevance');
    const start = (page - 1) * pageSize;
    const prices = this.products.map((p) => p.price);
    return mockDelay({
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    });
  }

  filterList(params: CatalogQuery): Product[] {
    let list = [...this.products];
    if (params.category === 'offers') {
      list = list.filter((p) => !!p.oldPrice);
    } else if (params.category === 'best-sellers') {
      list = list.filter((p) => p.bestSeller);
    } else if (params.category) {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((p) => {
        const brand = this.brandName(p.brandId);
        const hay = `${p.nameAr} ${p.nameEn ?? ''} ${p.description} ${brand} ${p.tags.join(' ')} ${p.slug}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (params.brands?.length) {
      list = list.filter((p) => params.brands!.includes(p.brandId));
    }
    if (params.minPrice != null) {
      list = list.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice != null) {
      list = list.filter((p) => p.price <= params.maxPrice!);
    }
    if (params.minRating) {
      list = list.filter((p) => p.rating >= params.minRating!);
    }
    if (params.availability === 'in_stock') {
      list = list.filter((p) => p.stockStatus !== 'out_of_stock');
    }
    if (params.offerOnly || params.availability === 'offer') {
      list = list.filter((p) => !!p.oldPrice);
    }
    return list;
  }

  private sortList(list: Product[], sort: SortOption): Product[] {
    const copy = [...list];
    switch (sort) {
      case 'newest':
        return copy.sort((a, b) => Number(b.recentlyAdded) - Number(a.recentlyAdded));
      case 'rating':
        return copy.sort((a, b) => b.rating - a.rating);
      case 'price-asc':
        return copy.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return copy.sort((a, b) => b.price - a.price);
      default:
        return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
    }
  }
}

export const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'الأكثر صلة',
  newest: 'الأحدث',
  rating: 'الأعلى تقييماً',
  'price-asc': 'السعر من الأقل للأعلى',
  'price-desc': 'السعر من الأعلى للأقل',
};
