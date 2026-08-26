export type Locale = 'ar' | 'en';

export type Bilingual = {
  ar: string;
  en: string;
};

export type CategorySlug =
  | 'olive-oil'
  | 'table-olives'
  | 'pickles'
  | 'stuffed'
  | 'gifts';

export interface Subcategory {
  slug: string;
  name: Bilingual;
  count: number;
}

export interface Category {
  slug: CategorySlug;
  name: Bilingual;
  tagline: Bilingual;
  story: Bilingual;
  image: string;
  accent: 'olive' | 'gold' | 'clay' | 'dark';
  subcategories: Subcategory[];
}

export interface Product {
  id: string;
  slug: string;
  name: Bilingual;
  brand: Bilingual;
  category: CategorySlug;
  subcategory: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  gallery: string[];
  badges: Array<'new' | 'bestseller' | 'deal' | 'organic' | 'exclusive'>;
  deliveryDays: number;
  freeShipping: boolean;
  highlights: Bilingual[];
  specs: Array<{label: Bilingual;value: Bilingual;}>;
  description: Bilingual;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Review {
  id: string;
  author: Bilingual;
  rating: number;
  date: string;
  title: Bilingual;
  body: Bilingual;
  verified: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'delivered' | 'in_transit' | 'processing' | 'cancelled';
  total: number;
  itemIds: string[];
  eta?: Bilingual;
}

export interface Address {
  id: string;
  label: Bilingual;
  line: Bilingual;
  city: Bilingual;
  phone: string;
  isDefault: boolean;
}

export interface HeroAd {
  id: string;
  image: string;
  eyebrow: Bilingual;
  heading: Bilingual;
  body: Bilingual;
  badge?: Bilingual;
  primary: { label: Bilingual; to: string };
  secondary?: { label: Bilingual; to: string };
}