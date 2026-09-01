import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../services/locale.service';
import { FREE_SHIPPING_THRESHOLD, StoreService } from '../services/store.service';
import { formatPrice } from '../utils/format';
import { SarPipe } from '../utils/sar.pipe';
import { QtyComponent } from '../commerce/commerce.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, QtyComponent, SarPipe],
  templateUrl: './cart-drawer.component.html',
})
export class CartDrawerComponent {
  rows = computed(() =>
    this.store
      .lines()
      .map((l) => ({ ...l, product: this.store.product(l.productId)! }))
      .filter((l) => l.product)
  );
  saved = computed(() =>
    this.store.savedForLater().map((id) => this.store.product(id)).filter((p): p is NonNullable<typeof p> => !!p)
  );

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      this.store.lines();
      this.store.savedForLater();
      this.cdr.markForCheck();
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.store.cartOpen()) this.close();
  }

  close(): void {
    this.store.cartOpen.set(false);
  }

  setQty(productId: string, qty: number): void {
    this.store.setQty(productId, qty);
  }

  remove(productId: string): void {
    this.store.removeLine(productId);
  }

  save(productId: string): void {
    this.store.saveForLater(productId);
  }

  trackById(_: number, row: { productId: string }): string {
    return row.productId;
  }

  remainingShip(): number {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - this.store.subtotal());
  }

  shipProgress(): number {
    return Math.min(100, (this.store.subtotal() / FREE_SHIPPING_THRESHOLD) * 100);
  }

  shipHint(): string {
    const rem = this.remainingShip();
    if (!rem) return this.locale.ui('freeShippingUnlocked');
    return this.locale.ui('freeShippingProgress').replace('{x}', formatPrice(rem, this.locale.locale()));
  }

  shipValueClass(): string {
    return this.store.shipping() === 0 ? 'font-medium text-state-success' : 'text-olive-800';
  }

  stockMax(stock: number): number {
    return Math.max(1, stock);
  }
}
