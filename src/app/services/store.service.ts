import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import type { CartLine, Product } from '../types';
import { CatalogService } from './catalog.service';
import { SessionService } from './session.service';
import { ShopApiService } from './shop-api.service';

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
  readonly lines = signal<CartLine[]>([]);
  readonly savedForLater = signal<string[]>([]);
  readonly wishlist = signal<string[]>([]);
  readonly compare = signal<string[]>([]);
  readonly cartOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly promo = signal<string | null>(null);
  readonly toasts = signal<Toast[]>([]);
  readonly lastAdded = signal<Product | null>(null);
  private cartOpenAfterNav = false;
  private pendingAdd: { productId: string; qty: number } | null = null;
  private wantCartOpen = false;
  private wantCheckout = false;

  readonly cartCount = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  readonly subtotal = computed(() =>
    this.lines().reduce((s, l) => s + (this.catalog.byId(l.productId)?.price ?? 0) * l.qty, 0)
  );
  readonly savings = computed(() =>
    this.lines().reduce((s, l) => {
      const p = this.catalog.byId(l.productId);
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

  constructor(
    private catalog: CatalogService,
    private session: SessionService,
    private shop: ShopApiService,
    private router: Router
  ) {}

  hydrateFromApi(): void {
    if (!this.session.isLoggedIn() || this.session.isAdmin()) {
      this.applyPendingAdd();
      return;
    }
    this.shop.getCart().subscribe({
      next: (lines) => {
        if (lines.length) this.lines.set(lines);
        this.applyPendingAdd();
      },
      error: () => this.applyPendingAdd(),
    });
    this.shop.getWishlist().subscribe((ids) => {
      if (ids.length) this.wishlist.set(ids);
    });
  }

  openCart(): boolean {
    this.cartOpen.set(true);
    return true;
  }

  addToCart(productId: string, qty = 1, openCart = true): boolean {
    if (!this.session.isLoggedIn()) {
      this.pendingAdd = { productId, qty };
      this.wantCartOpen = true;
      this.cartOpen.set(true);
      return false;
    }
    this.lines.update((lines) => {
      const i = lines.findIndex((l) => l.productId === productId);
      if (i === -1) return [...lines, { productId, qty }];
      return lines.map((l, idx) => (idx === i ? { ...l, qty: l.qty + qty } : l));
    });
    this.lastAdded.set(this.catalog.byId(productId) ?? null);
    if (openCart) this.cartOpen.set(true);
    if (!this.session.isAdmin()) this.shop.addToCart(productId, qty).subscribe();
    return true;
  }

  setQty(productId: string, qty: number): void {
    this.lines.update((lines) =>
      qty <= 0
        ? lines.filter((l) => l.productId !== productId)
        : lines.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
    if (!this.session.isLoggedIn() || this.session.isAdmin()) return;
    if (qty <= 0) this.shop.removeItem(productId).subscribe();
    else this.shop.updateItem(productId, qty).subscribe();
  }

  removeLine(productId: string): void {
    this.lines.update((lines) => lines.filter((l) => l.productId !== productId));
    if (this.session.isLoggedIn() && !this.session.isAdmin()) this.shop.removeItem(productId).subscribe();
  }

  clearCart(localOnly = false): void {
    const ids = this.lines().map((l) => l.productId);
    this.lines.set([]);
    if (localOnly || !this.session.isLoggedIn() || this.session.isAdmin()) return;
    ids.forEach((id) => this.shop.removeItem(id).subscribe());
  }

  syncCartToServer(): Observable<unknown> {
    if (!this.session.isLoggedIn() || this.session.isAdmin()) return of(null);
    return this.shop.syncCart(this.lines());
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
    this.addToCart(productId, 1, true);
  }

  requestCartOpen(): void {
    this.cartOpenAfterNav = true;
  }

  requestCheckoutAfterLogin(): void {
    this.wantCheckout = true;
  }

  consumeCartOpenRequest(): boolean {
    const next = this.cartOpenAfterNav;
    this.cartOpenAfterNav = false;
    return next;
  }

  rememberCartAfterLogin(): void {
    this.wantCartOpen = true;
  }

  fulfillCartAfterLogin(): boolean {
    const open = this.wantCartOpen;
    const checkout = this.wantCheckout;
    this.wantCartOpen = false;
    this.wantCheckout = false;
    if (checkout) {
      void this.router.navigateByUrl('/checkout');
      return true;
    }
    if (open) this.requestCartOpen();
    return false;
  }

  private applyPendingAdd(): void {
    const pending = this.pendingAdd;
    if (!pending) return;
    this.pendingAdd = null;
    this.addToCart(pending.productId, pending.qty, false);
  }

  toggleWishlist(productId: string): void {
    const list = this.wishlist();
    const adding = !list.includes(productId);
    this.wishlist.set(adding ? [...list, productId] : list.filter((id) => id !== productId));
    if (!this.session.isLoggedIn() || this.session.isAdmin()) return;
    if (adding) this.shop.addWishlist(productId).subscribe();
    else this.shop.removeWishlist(productId).subscribe();
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
    return this.catalog.byId(id);
  }

  all(): Product[] {
    return this.catalog.all();
  }
}
