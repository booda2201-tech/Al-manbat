export type CategoryId =
  | 'groceries'
  | 'beauty'
  | 'appliances'
  | 'electronics';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type SortOption =
  | 'relevance'
  | 'newest'
  | 'rating'
  | 'price-asc'
  | 'price-desc';

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentKind = 'cod' | 'card' | 'wallet';

export interface Category {
  id: CategoryId;
  slug: string;
  nameAr: string;
  description: string;
  image: string;
  productCount: number;
}

export interface Brand {
  id: string;
  nameAr: string;
  nameEn?: string;
}

export interface GroceryDetails {
  weight: string;
  ingredients: string;
  origin: string;
  storage: string;
  expiryPlaceholder: string;
  nutritionPlaceholder: string;
}

export interface BeautyDetails {
  skinHairType: string;
  ingredients: string;
  usage: string;
  precautions: string;
  size: string;
}

export interface ApplianceDetails {
  power: string;
  capacity: string;
  dimensions: string;
  warranty: string;
  includedItems: string;
}

export interface ElectronicsDetails {
  compatibility: string;
  connectivity: string;
  battery: string;
  warranty: string;
  dimensions: string;
  includedItems: string;
}

export interface Product {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string;
  category: CategoryId;
  brandId: string;
  description: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  stockStatus: StockStatus;
  stockQuantity: number;
  images: string[];
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  recentlyAdded: boolean;
  deliveryEstimate: string;
  warrantyOrStorage?: string;
  specifications: { label: string; value: string }[];
  grocery?: GroceryDetails;
  beauty?: BeautyDetails;
  appliance?: ApplianceDetails;
  electronics?: ElectronicsDetails;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  label: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal: number;
}

export interface Address {
  id: string;
  fullName: string;
  mobile: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  building: string;
  apartment: string;
  notes?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  addresses: Address[];
}

export interface DeliveryMethod {
  id: string;
  nameAr: string;
  estimate: string;
  cost: number;
  description: string;
}

export interface PaymentMethod {
  id: PaymentKind;
  nameAr: string;
  description: string;
  configured: boolean;
}

export interface OrderItem {
  productId: string;
  nameAr: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  number: string;
  customerId?: string;
  guestEmail?: string;
  guestMobile: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  address: Address;
  deliveryMethodId: string;
  paymentMethodId: PaymentKind;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface CatalogQuery {
  category?: CategoryId | 'offers' | 'best-sellers';
  search?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: 'all' | 'in_stock' | 'offer';
  offerOnly?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface CatalogResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  minPrice: number;
  maxPrice: number;
}

export interface CheckoutDraft {
  step: number;
  guest: boolean;
  customerName: string;
  email: string;
  mobile: string;
  address: Omit<Address, 'id' | 'isDefault'>;
  deliveryMethodId: string;
  paymentMethodId: PaymentKind;
  notes: string;
  cardPlaceholder?: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
  walletPlaceholder?: string;
}
