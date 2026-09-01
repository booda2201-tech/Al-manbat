import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    <span class="inline-flex max-w-full flex-nowrap items-center gap-1">
      <span class="text-[11px] font-medium tabular-nums text-ink-soft">{{ rating.toFixed(1) }}</span>
      <span class="inline-flex shrink-0" aria-hidden="true">
        <app-icon *ngFor="let i of stars" name="star" [size]="starPx" [filled]="i <= rounded" [ngClass]="starTone(i)"></app-icon>
      </span>
      <span *ngIf="reviews !== undefined" class="product-card__reviews text-[11px] text-ink-muted">({{ reviews | countLoc }} {{ locale.ui('reviews') }})</span>
    </span>
  `,
})
export class RatingComponent {
  @Input() rating = 0;
  @Input() reviews?: number;
  @Input() size: 'xs' | 'sm' | 'md' = 'sm';
  stars = [1, 2, 3, 4, 5];
  constructor(public locale: LocaleService) {}
  get rounded(): number {
    return Math.round(this.rating);
  }
  get starPx(): number {
    if (this.size === 'xs') return 11;
    if (this.size === 'md') return 16;
    return 13;
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
    <article
      class="product-card group relative flex h-full flex-col overflow-hidden rounded-xl border border-olive-800/10 bg-white"
      [ngClass]="layout === 'rail' ? 'product-card--rail' : 'product-card--grid'"
      *ngIf="product"
      (click)="openProduct($event)"
    >
      <div class="relative overflow-hidden bg-sand-100">
        <a [routerLink]="['/product', product.slug]" class="block" tabindex="-1" aria-hidden="true">
          <div class="product-card__media overflow-hidden">
            <img [src]="product.image" alt="" draggable="false" loading="lazy" decoding="async" class="h-full w-full bg-sand-50 object-contain transition-transform duration-[600ms] ease-premium group-hover:scale-[1.06]" [class.opacity-60]="soldOut" />
          </div>
        </a>
        <div class="product-card__badges absolute start-3 top-3 flex flex-col gap-1">
          <span *ngFor="let b of product.badges.slice(0,2)" class="product-card__badge inline-flex items-center rounded-xs px-1.5 py-0.5 text-[10px] font-semibold" [ngClass]="badgeTone(b)">
            {{ badgeLabel(b) }}
          </span>
        </div>
        <div class="product-card__actions absolute end-2 top-2 flex flex-col gap-1">
          <button type="button" class="product-card__icon flex items-center justify-center rounded-full" [ngClass]="wishBtnClass()" (click)="toggleWish($event)" [attr.aria-label]="locale.ui('wishlist')" [attr.aria-pressed]="wished">
            <app-icon name="heart" [size]="14" [filled]="wished" [class.wish-heart-on]="wished"></app-icon>
          </button>
          <button type="button" class="product-card__icon product-card__compare flex items-center justify-center rounded-full" [ngClass]="compareBtnClass()" (click)="toggleCompare($event)" [attr.aria-label]="locale.ui('compare')" [attr.aria-pressed]="comparing">
            <app-icon name="scale" [size]="14"></app-icon>
          </button>
        </div>
        <div *ngIf="soldOut" class="absolute inset-x-3 bottom-3 rounded bg-olive-800/90 py-2.5 text-center text-xs font-medium text-sand-100">{{ locale.ui('outOfStock') }}</div>
        <div *ngIf="!soldOut" class="quick-add absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-premium">
          <button type="button" (click)="add($event)" class="relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded bg-olive-800 text-[13px] font-medium text-sand-50 shadow-lg transition-colors duration-200 ease-premium hover:bg-olive-900">
            <app-icon [name]="justAdded ? 'check' : 'cart'" [size]="16"></app-icon>
            {{ justAdded ? locale.ui('addedToCart') : locale.ui('quickAdd') }}
          </button>
        </div>
      </div>
      <div class="product-card__body">
        <div class="product-card__head">
          <p class="product-card__brand">{{ locale.tr(product.brand) }}</p>
          <app-rating class="product-card__rating" [rating]="product.rating" size="xs"></app-rating>
        </div>
        <h3 class="product-card__name">
          <a [routerLink]="['/product', product.slug]">{{ locale.tr(product.name) }}</a>
        </h3>
        <div class="product-card__foot">
          <app-price-block [price]="product.price" [compareAt]="product.compareAt" size="sm"></app-price-block>
          <p class="product-card__meta">
            <span class="product-card__stock" [ngClass]="stockTextClass">
              <span class="product-card__dot" [ngClass]="stockDotClass"></span>
              {{ stockLabel }}
            </span>
            <span class="product-card__ship">
              <app-icon name="truck" [size]="12"></app-icon>
              {{ product.freeShipping ? locale.ui('freeShipping') : locale.ui('shipping') }}
              ·
              {{ product.deliveryDays | countLoc }}
              {{ locale.ui('daysDelivery') }}
            </span>
          </p>
        </div>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() layout: 'grid' | 'rail' = 'grid';
  justAdded = false;
  private addedTimer?: number;
  constructor(public locale: LocaleService, public store: StoreService, private router: Router) {}
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
      ? 'is-on bg-white/90 text-clay-400'
      : 'bg-white/90 text-olive-700 hover:bg-white';
  }
  compareBtnClass(): string {
    return this.comparing
      ? 'is-on bg-olive-700 text-sand-50'
      : 'bg-white/90 text-olive-700 hover:bg-white';
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
  openProduct(ev: Event): void {
    const node = ev.target as HTMLElement | null;
    if (node?.closest('button, a')) return;
    this.router.navigate(['/product', this.product.slug]);
  }
  toggleWish(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const on = !this.wished;
    this.store.toggleWishlist(this.product.id);
    this.store.pushToast({
      tone: 'success',
      title: on ? (this.locale.isAr() ? 'أُضيف إلى المفضلة' : 'Saved to wishlist') : this.locale.isAr() ? 'أُزيل من المفضلة' : 'Removed from wishlist',
      description: this.locale.tr(this.product.name),
    });
  }
  toggleCompare(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const wasOn = this.comparing;
    if (!wasOn && this.store.compare().length >= 4) {
      this.store.pushToast({
        tone: 'warning',
        title: this.locale.isAr() ? 'المقارنة ممتلئة' : 'Compare is full',
        description: this.locale.isAr() ? 'يمكن مقارنة ٤ منتجات فقط' : 'You can compare up to 4 products',
      });
      return;
    }
    this.store.toggleCompare(this.product.id);
    this.store.pushToast({
      tone: 'success',
      title: !wasOn ? (this.locale.isAr() ? 'أُضيف للمقارنة' : 'Added to compare') : this.locale.isAr() ? 'أُزيل من المقارنة' : 'Removed from compare',
      description: this.locale.tr(this.product.name),
    });
  }
  add(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.store.addToCart(this.product.id)) return;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'product-rail-host' },
  template: `
    <div class="product-rail-wrap" [class.product-rail-wrap--on-dark]="onDark">
      <div
        #rail
        class="rail product-rail"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
        (lostpointercapture)="onPointerUp($event)"
      >
        <div *ngFor="let p of visible; trackBy: trackId" class="product-rail__item">
          <app-product-card [product]="p" layout="rail"></app-product-card>
        </div>
      </div>
      <div *ngIf="visible.length > 1 && visible.length <= 12" class="product-rail__dots">
        <button
          *ngFor="let p of visible; let i = index; trackBy: trackId"
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
          <div #bar class="h-full rounded-full bg-olive-700 transition-[width] duration-200 ease-premium" style="width: 0%"></div>
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
  @Input() onDark = false;
  @Input() cap = 12;
  @ViewChild('rail') rail?: ElementRef<HTMLElement>;
  @ViewChild('bar') bar?: ElementRef<HTMLElement>;
  visible: Product[] = [];
  active = 0;
  private raw: Product[] = [];
  private timers: number[] = [];
  private raf = 0;
  private clickBound?: (ev: MouseEvent) => void;
  private scrollBound?: () => void;
  private resizeBound?: () => void;
  private dragging = false;
  private dragged = false;
  private startX = 0;
  private startScroll = 0;

  @Input() set products(value: Product[]) {
    this.raw = value ?? [];
    this.visible = this.raw.slice(0, this.cap);
    this.queueSync();
  }
  get products(): Product[] {
    return this.raw;
  }

  constructor(
    public locale: LocaleService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  trackId(_i: number, p: Product): string {
    return p.id;
  }

  ngAfterViewInit(): void {
    const el = this.rail?.nativeElement;
    if (!el) return;
    this.clickBound = (ev: MouseEvent) => this.onRailClick(ev);
    el.addEventListener('click', this.clickBound, true);
    this.zone.runOutsideAngular(() => {
      this.scrollBound = () => this.queueSync();
      this.resizeBound = () => this.queueSync();
      el.addEventListener('scroll', this.scrollBound, { passive: true });
      window.addEventListener('resize', this.resizeBound, { passive: true });
      this.queueSync();
      this.timers.push(window.setTimeout(() => this.syncMetrics(), 400));
      this.timers.push(window.setTimeout(() => this.syncMetrics(), 1200));
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    if (this.raf) cancelAnimationFrame(this.raf);
    const el = this.rail?.nativeElement;
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound);
    if (!el) return;
    if (this.scrollBound) el.removeEventListener('scroll', this.scrollBound);
    if (this.clickBound) el.removeEventListener('click', this.clickBound, true);
  }

  slideLabel(i: number): string {
    const n = i + 1;
    return this.locale.isAr() ? `المنتج ${n}` : `Product ${n}`;
  }

  onPointerDown(ev: PointerEvent): void {
    if (ev.pointerType === 'touch' || ev.button !== 0) return;
    if (this.isControl(ev.target)) return;
    const el = this.rail?.nativeElement;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    this.dragging = true;
    this.dragged = false;
    this.startX = ev.clientX;
    this.startScroll = el.scrollLeft;
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging) return;
    const el = this.rail?.nativeElement;
    if (!el) return;
    const dx = ev.clientX - this.startX;
    if (Math.abs(dx) <= 16) return;
    if (!this.dragged) {
      this.dragged = true;
      el.classList.add('is-drag');
      try {
        el.setPointerCapture(ev.pointerId);
      } catch {
        /* capture not available */
      }
    }
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
      this.syncMetrics();
      const card = el.children.item(this.active) as HTMLElement | null;
      if (card) this.alignCard(el, card, true);
    }
    window.setTimeout(() => {
      this.dragged = false;
    }, 0);
  }

  private queueSync(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.syncMetrics();
    });
  }

  private syncMetrics(): void {
    const el = this.rail?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pct = max <= 0 ? 100 : Math.min(100, (Math.abs(el.scrollLeft) / max) * 100);
    const bar = this.bar?.nativeElement;
    if (bar) bar.style.width = `${pct}%`;
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
    if (best === this.active) return;
    this.active = best;
    this.zone.run(() => this.cdr.markForCheck());
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
      const next = Math.max(0, Math.min(this.visible.length - 1, this.active + dir));
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
  }

  private isControl(target: EventTarget | null): boolean {
    const el = target instanceof Element ? target : null;
    return !!el?.closest('button, a, input, textarea, select, [role="button"]');
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
  selector: 'app-pager',
  standalone: true,
  imports: [CommonModule, IconComponent, CountPipe],
  template: `
    <nav *ngIf="pageCount > 1" class="mt-8 flex justify-center lg:mt-12" [attr.aria-label]="locale.ui('pagination')">
      <div class="inline-flex items-center gap-0.5 rounded-xl border border-olive-800/15 bg-white p-1.5" role="tablist">
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-olive-700 transition-colors duration-200 ease-premium hover:bg-olive-50 disabled:cursor-not-allowed disabled:text-sand-300"
          (click)="go(page - 1)"
          [disabled]="page <= 1"
          [attr.aria-label]="locale.ui('prevPage')"
        >
          <app-icon name="chevron-left" [size]="16" class="rtl:rotate-180"></app-icon>
        </button>
        <ng-container *ngFor="let item of items">
          <span *ngIf="item === 'gap'" class="flex h-10 w-8 items-center justify-center text-[13px] tracking-widest text-ink-muted" aria-hidden="true">…</span>
          <button
            *ngIf="item !== 'gap'"
            type="button"
            role="tab"
            class="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2.5 text-[13px] font-medium tabular-nums transition-colors duration-200 ease-premium"
            [class.bg-olive-800]="item === page"
            [class.text-sand-50]="item === page"
            [class.text-olive-800]="item !== page"
            [class.hover:bg-olive-50]="item !== page"
            [attr.aria-selected]="item === page"
            [attr.aria-current]="item === page ? 'page' : null"
            (click)="go(item)"
          >
            {{ item | countLoc }}
          </button>
        </ng-container>
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-olive-700 transition-colors duration-200 ease-premium hover:bg-olive-50 disabled:cursor-not-allowed disabled:text-sand-300"
          (click)="go(page + 1)"
          [disabled]="page >= pageCount"
          [attr.aria-label]="locale.ui('nextPage')"
        >
          <app-icon name="chevron-right" [size]="16" class="rtl:rotate-180"></app-icon>
        </button>
      </div>
    </nav>
  `,
})
export class PagerComponent {
  @Input() page = 1;
  @Input() pageCount = 1;
  @Output() pageChange = new EventEmitter<number>();
  constructor(public locale: LocaleService) {}

  get items(): Array<number | 'gap'> {
    const total = this.pageCount;
    const current = Math.min(Math.max(this.page, 1), total);
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: Array<number | 'gap'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) items.push('gap');
    for (let n = start; n <= end; n++) items.push(n);
    if (end < total - 1) items.push('gap');
    items.push(total);
    return items;
  }

  go(n: number): void {
    if (n < 1 || n > this.pageCount || n === this.page) return;
    this.pageChange.emit(n);
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
