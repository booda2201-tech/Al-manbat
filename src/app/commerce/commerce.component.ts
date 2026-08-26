import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Product } from '../types';
import { trustPoints } from '../data/content';
import { discountPercent } from '../utils/format';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { IconComponent } from '../ui/icon.component';
import { SarPipe } from '../utils/sar.pipe';
import { CountPipe } from '../utils/sar.pipe';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, IconComponent, CountPipe],
  template: `
    <span class="inline-flex items-center gap-1.5">
      <span class="inline-flex" aria-hidden="true">
        <app-icon *ngFor="let i of stars" name="star" [size]="size === 'sm' ? 14 : 16"
          [filled]="i <= rounded" [ngClass]="starTone(i)"></app-icon>
      </span>
      <span class="text-xs font-medium text-ink-soft">{{ rating.toFixed(1) }}</span>
      <span *ngIf="reviews !== undefined" class="text-xs text-ink-muted">({{ reviews | countLoc }} {{ locale.ui('reviews') }})</span>
    </span>
  `,
})
export class RatingComponent {
  @Input() rating = 0;
  @Input() reviews?: number;
  @Input() size: 'sm' | 'md' = 'sm';
  stars = [1, 2, 3, 4, 5];
  constructor(public locale: LocaleService) {}
  get rounded(): number {
    return Math.round(this.rating);
  }

  starTone(i: number): string {
    return i <= this.rounded ? 'text-gold-400' : 'text-sand-300';
  }
}

@Component({
  selector: 'app-price-block',
  standalone: true,
  imports: [CommonModule, SarPipe],
  template: `
    <div [ngClass]="stack ? 'flex flex-col items-start gap-1.5' : 'flex flex-wrap items-baseline gap-x-2 gap-y-1.5'">
      <span class="price font-bold tracking-tight" [ngClass]="main">{{ price | sar }}</span>
      <div *ngIf="compareAt || pct" class="flex flex-wrap items-center gap-2">
        <span *ngIf="compareAt" class="text-xs text-ink-muted line-through">{{ compareAt | sar }}</span>
        <span *ngIf="pct" class="inline-flex items-center rounded-full bg-clay-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-clay-400">{{ locale.ui('save') }} {{ pct }}%</span>
      </div>
    </div>
  `,
})
export class PriceBlockComponent {
  @Input() price = 0;
  @Input() compareAt?: number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() stack = false;
  constructor(public locale: LocaleService) {}
  get pct(): number | null {
    return discountPercent(this.price, this.compareAt);
  }
  get main(): string {
    return this.size === 'lg' ? 'text-[32px]' : this.size === 'md' ? 'text-lg' : 'text-[15px]';
  }
}

@Component({
  selector: 'app-qty',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="inline-flex items-center rounded-md border border-olive-800/15 bg-white" [ngClass]="size === 'sm' ? 'h-8' : 'h-11'" role="group">
      <button type="button" class="flex items-center justify-center text-olive-700 hover:bg-olive-50 disabled:cursor-not-allowed disabled:text-sand-300" [ngClass]="btnBox" (click)="change(-1); $event.stopPropagation()" [disabled]="value <= 1" [attr.aria-label]="'−'">
        <app-icon name="minus" [size]="14" class="pointer-events-none"></app-icon>
      </button>
      <span class="min-w-8 text-center font-medium tabular-nums text-olive-800">{{ value }}</span>
      <button type="button" class="flex items-center justify-center text-olive-700 hover:bg-olive-50 disabled:cursor-not-allowed disabled:text-sand-300" [ngClass]="btnBox" (click)="change(1); $event.stopPropagation()" [disabled]="value >= max" [attr.aria-label]="'+'">
        <app-icon name="plus" [size]="14" class="pointer-events-none"></app-icon>
      </button>
    </div>
  `,
})
export class QtyComponent {
  @Input() value = 1;
  @Input() max = 99;
  @Input() size: 'sm' | 'md' = 'md';
  @Output() valueChange = new EventEmitter<number>();
  get btnBox(): string {
    return this.size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  }
  change(d: number): void {
    const n = this.value + d;
    if (n < 1 || n > this.max) return;
    this.value = n;
    this.valueChange.emit(n);
  }
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, RatingComponent, PriceBlockComponent, CountPipe],
  template: `
    <article class="product-card group relative flex h-full flex-col overflow-hidden rounded-xl border border-olive-800/10 bg-white" *ngIf="product">
      <div class="relative overflow-hidden bg-sand-100">
        <a [routerLink]="['/product', product.slug]" class="block" tabindex="-1" aria-hidden="true">
          <div class="aspect-[4/5] w-full overflow-hidden">
            <img [src]="product.image" alt="" draggable="false" class="h-full w-full object-cover transition-transform duration-[600ms] ease-premium group-hover:scale-[1.06]" [class.opacity-60]="soldOut" />
          </div>
        </a>
        <div class="absolute start-3 top-3 flex flex-col gap-1.5">
          <span *ngFor="let b of product.badges.slice(0,2)" class="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-2xs font-semibold uppercase" [ngClass]="badgeTone(b)">
            {{ badgeLabel(b) }}
          </span>
        </div>
        <div class="absolute end-3 top-3 flex gap-2">
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-[background-color,color,transform] duration-200 ease-premium" [ngClass]="wishBtnClass()" (click)="toggleWish()" [attr.aria-label]="locale.ui('wishlist')" [attr.aria-pressed]="wished">
            <app-icon name="heart" [size]="16" [filled]="wished" [class.wish-heart-on]="wished"></app-icon>
          </button>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-[background-color,color,opacity,transform] duration-200 ease-premium md:opacity-0 md:group-hover:opacity-100" [ngClass]="comparing ? 'bg-olive-700 text-sand-50 md:opacity-100' : 'bg-white/90 text-olive-700 hover:bg-white'" (click)="toggleCompare()" [attr.aria-label]="locale.ui('compare')" [attr.aria-pressed]="comparing">
            <app-icon name="scale" [size]="16"></app-icon>
          </button>
        </div>
        <div *ngIf="soldOut" class="absolute inset-x-3 bottom-3 rounded bg-olive-800/90 py-2.5 text-center text-xs font-medium text-sand-100">{{ locale.ui('outOfStock') }}</div>
        <div *ngIf="!soldOut" class="quick-add absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-premium group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <button type="button" (click)="add()" class="relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded bg-olive-800 text-[13px] font-medium text-sand-50 shadow-lg transition-colors duration-200 ease-premium hover:bg-olive-900">
            <app-icon [name]="justAdded ? 'check' : 'cart'" [size]="16"></app-icon>
            {{ justAdded ? locale.ui('addedToCart') : locale.ui('quickAdd') }}
          </button>
        </div>
      </div>
      <div class="flex flex-1 flex-col px-3.5 pb-4 pt-3">
        <p class="text-2xs uppercase tracking-[0.16em] text-gold-400">{{ locale.tr(product.brand) }}</p>
        <h3 class="mt-1.5 text-sm font-medium leading-snug text-olive-800">
          <a [routerLink]="['/product', product.slug]" class="line-clamp-2 transition-colors duration-200 ease-premium hover:text-olive-600">{{ locale.tr(product.name) }}</a>
        </h3>
        <div class="mt-2"><app-rating [rating]="product.rating" [reviews]="product.reviews"></app-rating></div>
        <div class="mt-auto pt-3">
          <app-price-block [price]="product.price" [compareAt]="product.compareAt"></app-price-block>
          <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium" [ngClass]="stockTextClass">
              <span class="h-1.5 w-1.5 rounded-full" [ngClass]="stockDotClass"></span>
              {{ stockLabel }}
            </span>
            <span class="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <app-icon name="truck" [size]="14"></app-icon>
              {{ product.freeShipping ? locale.ui('freeShipping') : locale.ui('shipping') }} · {{ product.deliveryDays | countLoc }} {{ locale.ui('daysDelivery') }}
            </span>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  @Input() product!: Product;
  justAdded = false;
  private addedTimer?: number;
  constructor(public locale: LocaleService, public store: StoreService) {}
  get soldOut(): boolean {
    return this.product.stock === 0;
  }
  get wished(): boolean {
    return this.store.wishlist().includes(this.product.id);
  }
  get comparing(): boolean {
    return this.store.compare().includes(this.product.id);
  }
  wishBtnClass(): string {
    return this.wished
      ? 'bg-white/90 text-clay-400'
      : 'bg-white/90 text-olive-700 hover:bg-white hover:scale-105';
  }
  get stockTextClass(): string {
    if (this.product.stock === 0) return 'text-ink-muted';
    if (this.product.stock <= 10) return 'text-state-warning';
    return 'text-state-success';
  }
  get stockDotClass(): string {
    if (this.product.stock === 0) return 'bg-ink-muted';
    if (this.product.stock <= 10) return 'bg-state-warning';
    return 'bg-state-success';
  }
  get stockLabel(): string {
    if (this.product.stock === 0) return this.locale.ui('outOfStock');
    if (this.product.stock <= 10) return `${this.locale.ui('lowStock')} · ${this.product.stock}`;
    return this.locale.ui('inStock');
  }
  badgeTone(b: string): string {
    const map: Record<string, string> = {
      new: 'bg-olive-600 text-sand-50',
      bestseller: 'bg-olive-800 text-sand-100',
      deal: 'bg-gold-400 text-olive-900',
      organic: 'bg-olive-600 text-sand-50',
      exclusive: 'bg-clay-400 text-sand-50',
    };
    return map[b] ?? 'bg-olive-600 text-sand-50';
  }
  badgeLabel(b: string): string {
    const map: Record<string, { ar: string; en: string }> = {
      new: { ar: 'جديد', en: 'New' },
      bestseller: { ar: 'الأكثر مبيعاً', en: 'Best seller' },
      deal: { ar: 'عرض', en: 'Deal' },
      organic: { ar: 'عضوي', en: 'Organic' },
      exclusive: { ar: 'حصري', en: 'Exclusive' },
    };
    return map[b]?.[this.locale.locale()] ?? b;
  }
  toggleWish(): void {
    const on = !this.wished;
    this.store.toggleWishlist(this.product.id);
    this.store.pushToast({
      tone: 'success',
      title: on ? (this.locale.isAr() ? 'أُضيف إلى المفضلة' : 'Saved to wishlist') : this.locale.isAr() ? 'أُزيل من المفضلة' : 'Removed from wishlist',
      description: this.locale.tr(this.product.name),
    });
  }
  toggleCompare(): void {
    this.store.toggleCompare(this.product.id);
  }
  add(): void {
    this.store.addToCart(this.product.id);
    this.justAdded = true;
    this.store.pushToast({ tone: 'success', title: this.locale.ui('addedToCart'), description: this.locale.tr(this.product.name) });
    window.clearTimeout(this.addedTimer);
    this.addedTimer = window.setTimeout(() => (this.justAdded = false), 1400);
  }
}

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3 lg:mb-8 lg:gap-4">
      <div class="max-w-xl">
        <h2 class="font-display text-3xl leading-tight text-olive-800 md:text-[40px]">{{ title }}</h2>
        <p *ngIf="subtitle" class="mt-2 text-sm leading-relaxed text-ink-muted md:text-[15px]">{{ subtitle }}</p>
      </div>
      <a *ngIf="linkTo && linkLabel" [routerLink]="linkTo" class="group inline-flex items-center gap-2 border-b border-olive-800/20 pb-1 text-sm font-medium text-olive-700 transition-colors duration-200 ease-premium hover:border-gold-400 hover:text-gold-400">
        {{ linkLabel }}
        <app-icon [name]="locale.isAr() ? 'arrow-left' : 'arrow-right'" [size]="16"></app-icon>
      </a>
    </div>
  `,
})
export class SectionHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() linkTo?: string;
  @Input() linkLabel?: string;
  constructor(public locale: LocaleService) {}
}

@Component({
  selector: 'app-product-rail',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, IconComponent],
  host: { class: 'product-rail-host' },
  template: `
    <div class="product-rail-wrap">
      <div
        #rail
        class="rail product-rail"
        (scroll)="onScroll()"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
        (lostpointercapture)="onPointerUp($event)"
      >
        <div *ngFor="let p of products" class="product-rail__item">
          <app-product-card [product]="p"></app-product-card>
        </div>
      </div>
      <div *ngIf="products.length > 1" class="product-rail__dots">
        <button
          *ngFor="let p of products; let i = index"
          type="button"
          class="product-rail__dot"
          [class.is-on]="i === active"
          (click)="goTo(i)"
          [attr.aria-current]="i === active ? 'true' : null"
          [attr.aria-label]="slideLabel(i)"
        ></button>
      </div>
      <div class="mt-2 hidden items-center gap-3 lg:flex">
        <div class="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-olive-800/10">
          <div class="h-full rounded-full bg-olive-700 transition-[width] duration-200 ease-premium" [style.width.%]="progress"></div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-olive-800/15 bg-white text-olive-700 transition-colors duration-200 ease-premium hover:border-olive-800/40" (click)="move(-1)" [attr.aria-label]="locale.isAr() ? 'السابق' : 'Previous'">
            <app-icon name="chevron-left" [size]="16" class="rtl:rotate-180"></app-icon>
          </button>
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-olive-800/15 bg-white text-olive-700 transition-colors duration-200 ease-premium hover:border-olive-800/40" (click)="move(1)" [attr.aria-label]="locale.isAr() ? 'التالي' : 'Next'">
            <app-icon name="chevron-right" [size]="16" class="rtl:rotate-180"></app-icon>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductRailComponent implements AfterViewInit, OnDestroy {
  @Input() products: Product[] = [];
  @ViewChild('rail') rail?: ElementRef<HTMLElement>;
  progress = 0;
  active = 0;
  private timer?: number;
  private wheelBound?: (ev: WheelEvent) => void;
  private clickBound?: (ev: MouseEvent) => void;
  private dragging = false;
  private dragged = false;
  private startX = 0;
  private startScroll = 0;
  constructor(public locale: LocaleService) {}

  ngAfterViewInit(): void {
    this.onScroll();
    this.timer = window.setTimeout(() => this.onScroll(), 400);
    const el = this.rail?.nativeElement;
    if (!el) return;
    this.clickBound = (ev: MouseEvent) => this.onRailClick(ev);
    el.addEventListener('click', this.clickBound, true);
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.wheelBound = (ev: WheelEvent) => this.onWheel(ev);
      el.addEventListener('wheel', this.wheelBound, { passive: false });
    }
  }

  ngOnDestroy(): void {
    if (this.timer) window.clearTimeout(this.timer);
    const el = this.rail?.nativeElement;
    if (!el) return;
    if (this.wheelBound) el.removeEventListener('wheel', this.wheelBound);
    if (this.clickBound) el.removeEventListener('click', this.clickBound, true);
  }

  slideLabel(i: number): string {
    const n = i + 1;
    return this.locale.isAr() ? `المنتج ${n}` : `Product ${n}`;
  }

  onWheel(ev: WheelEvent): void {
    const el = this.rail?.nativeElement;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    const delta = Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
    if (!delta) return;
    const next = el.scrollLeft + delta * (this.isRtl(el) ? -1 : 1);
    const before = el.scrollLeft;
    this.setScroll(el, next, false);
    if (el.scrollLeft === before) return;
    ev.preventDefault();
  }

  onPointerDown(ev: PointerEvent): void {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    const el = this.rail?.nativeElement;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    this.dragging = true;
    this.dragged = false;
    this.startX = ev.clientX;
    this.startScroll = el.scrollLeft;
    el.classList.add('is-drag');
    el.setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging) return;
    const el = this.rail?.nativeElement;
    if (!el) return;
    const dx = ev.clientX - this.startX;
    if (Math.abs(dx) > 6) this.dragged = true;
    this.setScroll(el, this.startScroll - dx, false);
  }

  onPointerUp(ev: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const el = this.rail?.nativeElement;
    el?.classList.remove('is-drag');
    if (el) {
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
    }
    if (this.dragged && el) {
      this.onScroll();
      const card = el.children.item(this.active) as HTMLElement | null;
      if (card) this.alignCard(el, card, true);
    }
  }

  @HostListener('window:resize')
  onScroll(): void {
    const el = this.rail?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.progress = max <= 0 ? 100 : Math.min(100, (Math.abs(el.scrollLeft) / max) * 100);
    const kids = el.children;
    if (!kids.length) return;
    const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < kids.length; i++) {
      const r = kids.item(i)!.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    this.active = best;
  }

  goTo(index: number): void {
    const el = this.rail?.nativeElement;
    const card = el?.children.item(index) as HTMLElement | null;
    if (!el || !card) return;
    this.active = index;
    this.alignCard(el, card, true);
  }

  move(dir: number): void {
    const el = this.rail?.nativeElement;
    if (!el) return;
    if (window.matchMedia('(max-width: 1023px)').matches) {
      const next = Math.max(0, Math.min(this.products.length - 1, this.active + dir));
      this.goTo(next);
      return;
    }
    const delta = el.clientWidth * 0.8 * dir * (this.isRtl(el) ? -1 : 1);
    this.setScroll(el, el.scrollLeft + delta, true);
  }

  private onRailClick(ev: MouseEvent): void {
    if (!this.dragged) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.dragged = false;
  }

  private isRtl(el: HTMLElement): boolean {
    return getComputedStyle(el).direction === 'rtl';
  }

  private setScroll(el: HTMLElement, next: number, smooth: boolean): void {
    el.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    el.scrollLeft = next;
    if (!smooth) el.style.scrollBehavior = '';
  }

  private alignCard(el: HTMLElement, card: HTMLElement, smooth: boolean): void {
    const box = el.getBoundingClientRect();
    const item = card.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(el).paddingInlineStart) || 0;
    const delta = this.isRtl(el) ? item.right - (box.right - pad) : item.left - (box.left + pad);
    this.setScroll(el, el.scrollLeft + delta, smooth);
  }
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 text-xs font-medium" [ngClass]="textClass">
      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `,
})
export class StockComponent {
  @Input() stock = 0;
  constructor(public locale: LocaleService) {}
  get label(): string {
    if (this.stock === 0) return this.locale.ui('outOfStock');
    if (this.stock <= 10) return `${this.locale.ui('lowStock')} · ${this.stock}`;
    return this.locale.ui('inStock');
  }
  get textClass(): string {
    if (this.stock === 0) return 'text-ink-muted';
    if (this.stock <= 10) return 'text-state-warning';
    return 'text-state-success';
  }
  get dotClass(): string {
    if (this.stock === 0) return 'bg-ink-muted';
    if (this.stock <= 10) return 'bg-state-warning';
    return 'bg-state-success';
  }
}

@Component({
  selector: 'app-trust-strip',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <ul class="trust-strip">
      <li *ngFor="let p of points" class="trust-tile">
        <span class="trust-tile__icon">
          <app-icon [name]="p.icon" [size]="20"></app-icon>
        </span>
        <div class="min-w-0">
          <h3 class="trust-tile__title">{{ locale.tr(p.title) }}</h3>
          <p class="trust-tile__body">{{ locale.tr(p.body) }}</p>
        </div>
      </li>
    </ul>
  `,
})
export class TrustStripComponent {
  constructor(public locale: LocaleService) {}
  points = trustPoints;
}
