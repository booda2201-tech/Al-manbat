import { Injectable, computed, signal } from '@angular/core';
import { Cart, CartItem, Coupon } from '../models/commerce.models';
import { COUPONS } from '../data/catalog.seed';
import { CatalogService } from './catalog.service';
import { STORAGE_KEYS, storageGet, storageSet } from '../utils/helpers';

/** MOCK BOUNDARY: persist cart via backend session / customer API later. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<Cart>(
    storageGet<Cart>(STORAGE_KEYS.cart, { items: [], updatedAt: new Date().toISOString() })
  );

  readonly items = computed(() => this.state().items);
  readonly count = computed(() => this.state().items.reduce((s, i) => s + i.quantity, 0));
  readonly couponCode = computed(() => this.state().couponCode);

  constructor(private catalog: CatalogService) {}

  snapshot(): Cart {
    return this.state();
  }

  add(productId: string, quantity = 1): { ok: boolean; message: string } {
    const product = this.catalog.getById(productId);
    if (!product) return { ok: false, message: 'المنتج غير موجود.' };
    if (product.stockStatus === 'out_of_stock' || product.stockQuantity <= 0) {
      return { ok: false, message: 'هذا المنتج غير متوفر حالياً.' };
    }
    const items = [...this.state().items];
    const existing = items.find((i) => i.productId === productId);
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stockQuantity) {
      return { ok: false, message: `الكمية المتاحة ${product.stockQuantity} فقط.` };
    }
    if (existing) existing.quantity = nextQty;
    else items.push({ productId, quantity });
    this.commit({ items, couponCode: this.state().couponCode });
    return { ok: true, message: `تمت إضافة ${product.nameAr} إلى السلة.` };
  }

  setQuantity(productId: string, quantity: number): { ok: boolean; message: string } {
    const product = this.catalog.getById(productId);
    if (!product) return { ok: false, message: 'المنتج غير موجود.' };
    if (quantity < 1) {
      this.remove(productId);
      return { ok: true, message: 'تم حذف المنتج من السلة.' };
    }
    if (quantity > product.stockQuantity) {
      return { ok: false, message: `لا يمكن تجاوز الكمية المتاحة (${product.stockQuantity}).` };
    }
    const items = this.state().items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    this.commit({ items, couponCode: this.state().couponCode });
    return { ok: true, message: 'تم تحديث الكمية.' };
  }

  remove(productId: string): void {
    this.commit({
      items: this.state().items.filter((i) => i.productId !== productId),
      couponCode: this.state().couponCode,
    });
  }

  clear(): void {
    this.commit({ items: [] });
  }

  applyCoupon(code: string): { ok: boolean; message: string; coupon?: Coupon } {
    const coupon = COUPONS.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!coupon) return { ok: false, message: 'كود الخصم غير صالح.' };
    const subtotal = this.subtotal();
    if (subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        message: `الحد الأدنى لاستخدام الكود ${coupon.minSubtotal} ج.م.`,
      };
    }
    this.commit({ items: this.state().items, couponCode: coupon.code });
    return { ok: true, message: 'تم تطبيق الخصم.', coupon };
  }

  removeCoupon(): void {
    this.commit({ items: this.state().items });
  }

  coupon(): Coupon | undefined {
    const code = this.state().couponCode;
    return COUPONS.find((c) => c.code === code);
  }

  lineItems(): { item: CartItem; name: string; image: string; price: number; stock: number; slug: string }[] {
    return this.state().items.map((item) => {
      const p = this.catalog.getById(item.productId)!;
      return {
        item,
        name: p.nameAr,
        image: p.images[0],
        price: p.price,
        stock: p.stockQuantity,
        slug: p.slug,
      };
    });
  }

  subtotal(): number {
    return this.lineItems().reduce((s, l) => s + l.price * l.item.quantity, 0);
  }

  discount(): number {
    const coupon = this.coupon();
    const sub = this.subtotal();
    if (!coupon) return 0;
    return coupon.type === 'percent' ? Math.round((sub * coupon.value) / 100) : coupon.value;
  }

  private commit(partial: Partial<Cart>): void {
    const next: Cart = {
      items: partial.items ?? this.state().items,
      couponCode: partial.couponCode,
      updatedAt: new Date().toISOString(),
    };
    this.state.set(next);
    storageSet(STORAGE_KEYS.cart, next);
  }
}
