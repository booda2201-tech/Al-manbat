import { Injectable, computed, signal } from '@angular/core';
import type { CartLine, Product } from '../types';
import { productById, products } from '../data/products';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning';
}

export const FREE_SHIPPING_THRESHOLD = 250;
export const SHIPPING_FEE = 25;
const PROMO_CODES: Record<string, number> = { ALMANBAT10: 0.1, HARVEST15: 0.15 };

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly lines = signal<CartLine[]>([
    { productId: 'oil-reserve', qty: 2 },
    { productId: 'pkl-cucumber', qty: 1 },
  ]);
  readonly savedForLater = signal<string[]>(['olv-green']);
  readonly wishlist = signal<string[]>(['oil-tin', 'stf-makdous']);
  readonly compare = signal<string[]>(['oil-reserve', 'oil-jouf']);
  readonly cartOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly promo = signal<string | null>(null);
  readonly toasts = signal<Toast[]>([]);
  readonly lastAdded = signal<Product | null>(null);

  readonly cartCount = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  readonly subtotal = computed(() =>
    this.lines().reduce((s, l) => s + (productById(l.productId)?.price ?? 0) * l.qty, 0)
  );
  readonly savings = computed(() =>
    this.lines().reduce((s, l) => {
      const p = productById(l.productId);
      return p?.compareAt ? s + (p.compareAt - p.price) * l.qty : s;
    }, 0)
  );
  readonly promoDiscount = computed(() => {
    const code = this.promo();
    return code ? Math.round(this.subtotal() * PROMO_CODES[code] * 100) / 100 : 0;
  });
  readonly shipping = computed(() =>
    this.subtotal() === 0 || this.subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  );
  readonly total = computed(() => Math.max(0, this.subtotal() - this.promoDiscount()) + this.shipping());

  addToCart(productId: string, qty = 1, openCart = true): void {
    this.lines.update((lines) => {
      const i = lines.findIndex((l) => l.productId === productId);
      if (i === -1) return [...lines, { productId, qty }];
      return lines.map((l, idx) => (idx === i ? { ...l, qty: l.qty + qty } : l));
    });
    this.lastAdded.set(productById(productId) ?? null);
    if (openCart) this.cartOpen.set(true);
  }

  setQty(productId: string, qty: number): void {
    this.lines.update((lines) =>
      qty <= 0
        ? lines.filter((l) => l.productId !== productId)
        : lines.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }

  removeLine(productId: string): void {
    this.lines.update((lines) => lines.filter((l) => l.productId !== productId));
  }

  clearCart(): void {
    this.lines.set([]);
  }

  applyPromo(code: string): boolean {
    const key = code.trim().toUpperCase();
    if (!PROMO_CODES[key]) return false;
    this.promo.set(key);
    return true;
  }

  saveForLater(productId: string): void {
    this.removeLine(productId);
    if (!this.savedForLater().includes(productId)) {
      this.savedForLater.set([...this.savedForLater(), productId]);
    }
  }

  moveToCart(productId: string): void {
    this.savedForLater.set(this.savedForLater().filter((id) => id !== productId));
    this.addToCart(productId, 1);
    this.cartOpen.set(false);
  }

  toggleWishlist(productId: string): void {
    const list = this.wishlist();
    this.wishlist.set(list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId]);
  }

  toggleCompare(productId: string): void {
    const list = this.compare();
    if (list.includes(productId)) this.compare.set(list.filter((id) => id !== productId));
    else if (list.length < 4) this.compare.set([...list, productId]);
  }

  clearCompare(): void {
    this.compare.set([]);
  }

  pushToast(t: Omit<Toast, 'id'>): void {
    const id = Date.now() + Math.random();
    this.toasts.update((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => this.dismissToast(id), 3600);
  }

  dismissToast(id: number): void {
    this.toasts.update((prev) => prev.filter((x) => x.id !== id));
  }

  product(id: string): Product | undefined {
    return productById(id);
  }

  all(): Product[] {
    return products;
  }
}
