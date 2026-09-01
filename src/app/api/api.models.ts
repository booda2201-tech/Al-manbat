export interface ApiProduct {
  id: number;
  name?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  price: number;
  discountPercent?: number | null;
  discountDays?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  discountDaysRemaining?: number | null;
  finalPrice?: number | null;
  hasOffer?: boolean;
  isNew?: boolean;
  createdAt?: string | null;
  isAvailable?: boolean;
  delivery?: string | null;
  deliveryAr?: string | null;
  deliveryEn?: string | null;
  size?: string | null;
  sizeAr?: string | null;
  sizeEn?: string | null;
  origin?: string | null;
  originAr?: string | null;
  originEn?: string | null;
  variety?: string | null;
  varietyAr?: string | null;
  varietyEn?: string | null;
  acidity?: number | null;
  harvest?: string | null;
  harvestAr?: string | null;
  harvestEn?: string | null;
  highlights?: string[] | null;
  highlightsAr?: string[] | null;
  highlightsEn?: string[] | null;
  categoryId: number;
  categoryName?: string | null;
  categoryNameAr?: string | null;
  categoryNameEn?: string | null;
  imageUrls?: string[] | null;
  averageRating?: number | null;
  reviewsCount?: number | null;
}

export interface ApiCategory {
  id: number;
  name?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  productsCount?: number;
  products?: ApiProduct[] | null;
}

export interface ApiReview {
  id: number;
  productId: number;
  userId?: string | null;
  userName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
}

export interface ApiSearchResult {
  products?: ApiProduct[];
}

export interface ApiCartItem {
  productId?: number;
  product?: { id?: number };
  quantity?: number;
  qty?: number;
}

export interface ApiCart {
  items?: ApiCartItem[];
  cartItems?: ApiCartItem[];
}
