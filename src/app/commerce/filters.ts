import type { Product } from '../types';

export interface FilterState {
  brands: string[];
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  newOnly: boolean;
  sub: string | null;
}

export const emptyFilters = (maxPrice: number): FilterState => ({
  brands: [],
  maxPrice,
  minRating: 0,
  inStockOnly: false,
  onSaleOnly: false,
  newOnly: false,
  sub: null,
});

export function applyFilters(list: Product[], f: FilterState): Product[] {
  return list.filter((p) => {
    if (f.brands.length && !f.brands.includes(p.brand.en)) return false;
    if (p.price > f.maxPrice) return false;
    if (p.rating < f.minRating) return false;
    if (f.inStockOnly && p.stock === 0) return false;
    if (f.onSaleOnly && !p.compareAt) return false;
    if (f.newOnly && !p.badges.includes('new')) return false;
    if (f.sub && p.subcategory !== f.sub) return false;
    return true;
  });
}

export function sortProducts(list: Product[], sort: string): Product[] {
  const next = [...list];
  switch (sort) {
    case 'price-asc':
      return next.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return next.sort((a, b) => b.price - a.price);
    case 'rating':
      return next.sort((a, b) => b.rating - a.rating);
    case 'newest':
      return next.sort((a, b) => Number(b.badges.includes('new')) - Number(a.badges.includes('new')));
    default:
      return next.sort((a, b) => b.reviews - a.reviews);
  }
}
