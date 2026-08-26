import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { productById, products } from '../data/products';
import { orders } from '../data/content';
import { LocaleService } from '../services/locale.service';
import { FREE_SHIPPING_THRESHOLD, StoreService } from '../services/store.service';
import { formatPrice } from '../utils/format';
import { SarPipe } from '../utils/sar.pipe';
import { LogoComponent } from '../ui/logo.component';
import { IconComponent } from '../ui/icon.component';
import {
  PriceBlockComponent,
  ProductRailComponent,
  QtyComponent,
  SectionHeaderComponent,
  StockComponent,
} from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    SarPipe,
    PriceBlockComponent,
    QtyComponent,
    StockComponent,
    ProductRailComponent,
    SectionHeaderComponent,
  ],
  template: `
    <div class="mx-auto max-w-shell px-4 py-10 lg:px-10" *ngIf="store.lines().length || store.savedForLater().length; else empty">
      <h1 class="font-displayAr text-4xl text-olive-800 lg:text-[46px]">{{ locale.ui('cartTitle') }}</h1>
      <p class="mt-2 text-sm text-ink-muted">{{ shipHint() }}</p>
      <div class="mt-9 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <ul class="divide-y divide-olive-800/10 border-y border-olive-800/10">
              <li *ngFor="let row of rows()" class="flex gap-4 py-6">
              <a [routerLink]="['/product', row.product.slug]" class="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                <img [src]="row.product.image" [alt]="locale.tr(row.product.name)" draggable="false" class="h-full w-full object-cover" />
              </a>
              <div class="flex min-w-0 flex-1 flex-col">
                <p class="text-2xs uppercase tracking-[0.16em] text-gold-400">{{ locale.tr(row.product.brand) }}</p>
                <a [routerLink]="['/product', row.product.slug]" class="mt-1 text-[15px] font-medium text-olive-800">{{ locale.tr(row.product.name) }}</a>
                <app-stock [stock]="row.product.stock"></app-stock>
                <div class="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                  <app-qty [value]="row.qty" [max]="row.product.stock || 1" (valueChange)="store.setQty(row.productId, $event)"></app-qty>
                  <app-price-block [price]="row.product.price * row.qty" [compareAt]="row.product.compareAt ? row.product.compareAt * row.qty : undefined"></app-price-block>
                </div>
              </div>
              <div class="flex shrink-0 items-start gap-2">
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-olive-800/12 bg-white text-olive-700 transition-colors duration-150 ease-premium hover:border-olive-800/25 hover:bg-olive-50" (click)="store.saveForLater(row.productId)" [attr.aria-label]="locale.ui('saveForLater')" [attr.title]="locale.ui('saveForLater')">
                  <app-icon name="bookmark" [size]="18"></app-icon>
                </button>
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-olive-800/12 bg-white text-olive-700 transition-colors duration-150 ease-premium hover:border-state-danger/30 hover:bg-[#f4e4de] hover:text-state-danger" (click)="store.removeLine(row.productId)" [attr.aria-label]="locale.ui('remove')" [attr.title]="locale.ui('remove')">
                  <app-icon name="trash" [size]="18"></app-icon>
                </button>
              </div>
            </li>
          </ul>
          <div *ngIf="saved().length" class="mt-10">
            <h2 class="text-sm font-semibold uppercase tracking-[0.14em]">{{ locale.ui('savedForLater') }}</h2>
            <ul class="mt-4 space-y-3">
              <li *ngFor="let p of saved()" class="flex items-center gap-4 rounded-lg border border-olive-800/10 bg-white p-3">
                <img [src]="p.image" class="h-20 w-20 rounded object-cover" alt="" draggable="false" />
                <div class="flex-1"><p class="text-sm font-medium">{{ locale.tr(p.name) }}</p><p class="price text-sm font-bold">{{ p.price | sar }}</p></div>
                <button type="button" class="h-9 rounded-md border px-3 text-sm" (click)="store.moveToCart(p.id)">{{ locale.ui('moveToCart') }}</button>
              </li>
            </ul>
          </div>
        </div>
        <aside class="summary-card lg:sticky lg:top-32 lg:self-start">
          <h2 class="text-sm font-semibold uppercase tracking-[0.14em] text-olive-800">{{ locale.ui('orderSummary') }}</h2>
          <dl class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-soft">{{ locale.ui('subtotal') }}</dt>
              <dd class="text-olive-800">{{ store.subtotal() | sar }}</dd>
            </div>
            <div *ngIf="store.savings() > 0" class="flex justify-between text-clay-400">
              <dt>{{ locale.ui('save') }}</dt>
              <dd>− {{ store.savings() | sar }}</dd>
            </div>
            <div *ngIf="store.promoDiscount() > 0" class="flex justify-between">
              <dt class="text-ink-soft">{{ locale.ui('discount') }} · {{ store.promo() }}</dt>
              <dd class="text-state-success">− {{ store.promoDiscount() | sar }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-soft">{{ locale.ui('shipping') }}</dt>
              <dd [ngClass]="store.shipping() === 0 ? 'text-state-success' : 'text-olive-800'">{{ store.shipping() === 0 ? locale.ui('freeShipping') : (store.shipping() | sar) }}</dd>
            </div>
            <div class="flex items-baseline justify-between border-t border-olive-800/10 pt-4">
              <dt class="font-medium text-olive-800">{{ locale.ui('total') }}</dt>
              <dd class="price text-[28px] font-bold leading-none">{{ store.total() | sar }}</dd>
            </div>
          </dl>
          <form class="mt-5 flex gap-2" (submit)="apply($event)">
            <input class="field-input !mt-0 flex-1" [(ngModel)]="code" name="promo" [placeholder]="locale.ui('promoCode')" />
            <button type="submit" class="h-12 shrink-0 rounded-md border border-olive-800/15 bg-white px-4 text-sm text-olive-800 transition-colors duration-200 ease-premium hover:border-olive-800/30 hover:bg-olive-50">{{ locale.ui('apply') }}</button>
          </form>
          <p *ngIf="promoError" class="mt-2 text-xs text-state-danger">{{ locale.ui('promoInvalid') }}</p>
          <a routerLink="/checkout" class="mt-6 flex h-14 items-center justify-center rounded-md bg-gold-400 text-[15px] font-medium text-olive-900 shadow-sm transition-[background-color,box-shadow,transform] duration-200 ease-premium hover:bg-gold-300 hover:shadow-gold active:scale-[0.985]">{{ locale.ui('checkout') }}</a>
          <ul class="mt-5 space-y-2 text-xs text-ink-muted">
            <li class="flex items-center gap-2">
              <app-icon name="rotate" class="text-gold-400" [size]="14"></app-icon>
              {{ locale.ui('returnPolicy') }}
            </li>
            <li class="flex items-center gap-2">
              <app-icon name="shield" class="text-gold-400" [size]="14"></app-icon>
              {{ locale.ui('authenticGuarantee') }}
            </li>
          </ul>
        </aside>
      </div>
      <div class="mt-16">
        <app-section-header [title]="locale.isAr() ? 'أضف إلى طلبك' : 'Add to your order'"></app-section-header>
        <app-product-rail [products]="more"></app-product-rail>
      </div>
    </div>
    <ng-template #empty>
      <div class="mx-auto max-w-shell px-4 py-16 lg:px-10 text-center">
        <h1 class="font-displayAr text-3xl text-olive-800">{{ locale.ui('emptyCart') }}</h1>
        <p class="mt-2 text-ink-muted">{{ locale.ui('emptyCartHint') }}</p>
        <a routerLink="/" class="mt-6 inline-flex h-12 items-center rounded-md bg-olive-600 px-6 text-sand-50">{{ locale.ui('continueShopping') }}</a>
        <div class="mt-14 text-start"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
      </div>
    </ng-template>
  `,
})
export class CartPageComponent {
  code = '';
  promoError = false;
  more = products.slice(4, 10);
  constructor(public locale: LocaleService, public store: StoreService) {}
  rows() {
    return this.store
      .lines()
      .map((l) => ({ ...l, product: productById(l.productId)! }))
      .filter((l) => l.product);
  }
  saved() {
    return this.store.savedForLater().map(productById).filter(Boolean) as NonNullable<ReturnType<typeof productById>>[];
  }
  shipHint(): string {
    const rem = Math.max(0, FREE_SHIPPING_THRESHOLD - this.store.subtotal());
    if (!rem) return this.locale.ui('freeShippingUnlocked');
    return this.locale.ui('freeShippingProgress').replace('{x}', formatPrice(rem, this.locale.locale()));
  }
  apply(ev: Event): void {
    ev.preventDefault();
    this.promoError = !this.store.applyPromo(this.code);
    if (!this.promoError) this.code = '';
  }
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, SarPipe, LogoComponent],
  templateUrl: './checkout.page.html',
})
export class CheckoutPageComponent implements OnDestroy {
  step = 0;
  summaryOpen = false;
  guest = true;
  email = '';
  emailError = '';
  firstName = '';
  lastName = '';
  phone = '+966 55 014 2288';
  city = '';
  address = '';
  saveAddress = true;
  ship = 'sameday';
  pay = 'mada';
  placing = false;
  shippingOptions = [
    { id: 'sameday', title: { ar: 'توصيل في نفس اليوم', en: 'Same-day delivery' }, detail: { ar: 'قبل ١١ مساءً · الرياض فقط', en: 'Before 11pm · Riyadh only' }, price: 35 },
    { id: 'standard', title: { ar: 'التوصيل القياسي', en: 'Standard delivery' }, detail: { ar: 'من يومين إلى ٤ أيام عمل', en: '2 – 4 working days' }, price: 0 },
    { id: 'pickup', title: { ar: 'الاستلام من المعرض', en: 'Collect in store' }, detail: { ar: 'جاهز خلال ساعتين · حي الياسمين', en: 'Ready in 2 hours · Al Yasmin' }, price: 0 },
  ];
  payOptions = [
    { id: 'mada', label: { ar: 'مدى · بطاقة بنكية', en: 'Mada · bank card' } },
    { id: 'card', label: { ar: 'فيزا / ماستركارد', en: 'Visa / Mastercard' } },
    { id: 'apple', label: { ar: 'أبل باي', en: 'Apple Pay' } },
    { id: 'tabby', label: { ar: 'تابي · ٤ أقساط بدون فوائد', en: 'Tabby · 4 interest-free payments' } },
    { id: 'cod', label: { ar: 'الدفع عند الاستلام', en: 'Cash on delivery' } },
  ];
  constructor(public locale: LocaleService, public store: StoreService, private router: Router) {
    this.firstName = this.locale.isAr() ? 'نورة' : 'Noura';
    this.lastName = this.locale.isAr() ? 'العتيبي' : 'Al-Otaibi';
    this.city = this.locale.isAr() ? 'الرياض' : 'Riyadh';
    this.address = this.locale.isAr() ? 'حي الياسمين، شارع الأمير سلطان' : 'Al Yasmin, Prince Sultan St';
  }
  get steps() {
    return [this.locale.ui('stepAddress'), this.locale.ui('stepShipping'), this.locale.ui('stepPayment'), this.locale.ui('stepReview')];
  }
  get currentStepName(): string {
    return this.steps[this.step];
  }
  get previewRows() {
    return this.rows().slice(0, 3);
  }
  get itemsCountLabel(): string {
    const n = this.rows().length;
    if (this.locale.isAr()) return n === 1 ? 'منتج واحد' : n + ' منتجات';
    return n === 1 ? '1 item' : n + ' items';
  }
  payIcon(id: string): string {
    if (id === 'apple' || id === 'tabby') return 'phone';
    if (id === 'cod') return 'truck';
    return 'card';
  }
  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  toggleSummary(): void {
    this.summaryOpen = !this.summaryOpen;
    document.body.style.overflow = this.summaryOpen ? 'hidden' : '';
  }
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
  back(): void {
    this.step = Math.max(0, this.step - 1);
    this.scrollTop();
  }
  get cities() {
    return this.locale.isAr() ? ['الرياض', 'جدة', 'الدمام'] : ['Riyadh', 'Jeddah', 'Dammam'];
  }
  get shipIndex() {
    return Math.max(0, this.shippingOptions.findIndex((o) => o.id === this.ship));
  }
  get payIndex() {
    return Math.max(0, this.payOptions.findIndex((o) => o.id === this.pay));
  }
  rows() {
    return this.store
      .lines()
      .map((l) => ({ ...l, product: productById(l.productId)! }))
      .filter((l) => l.product);
  }
  checkoutShipping(): number {
    return this.shippingOptions[this.shipIndex].price;
  }
  checkoutTotal(): number {
    return Math.max(0, this.store.subtotal() - this.store.promoDiscount()) + this.checkoutShipping();
  }
  stepCircleClass(i: number): string {
    if (i < this.step) return 'bg-olive-600 text-sand-50';
    if (i === this.step) return 'bg-gold-400 text-olive-900';
    return 'bg-sand-200 text-ink-muted';
  }
  stepLabelClass(i: number): string {
    return i === this.step ? 'text-olive-800' : 'text-ink-muted';
  }
  stepLineClass(i: number): string {
    return i < this.step ? 'bg-olive-600' : 'bg-olive-800/15';
  }
  optionClass(active: boolean): string {
    return active
      ? 'border-gold-400 bg-gold-50'
      : 'border-olive-800/15 bg-white hover:border-olive-800/30';
  }
  emailInputClass(): string {
    return this.emailError
      ? 'border-state-danger focus:border-state-danger focus:ring-state-danger'
      : 'border-olive-800/15 hover:border-olive-800/30 focus:border-gold-400 focus:ring-gold-400';
  }
  advance(): void {
    if (this.step === 0 && this.guest && !/^\S+@\S+\.\S+$/.test(this.email)) {
      this.emailError = this.locale.isAr() ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address';
      return;
    }
    this.emailError = '';
    this.step = Math.min(3, this.step + 1);
    this.summaryOpen = false;
    document.body.style.overflow = '';
    this.scrollTop();
  }
  goStep(i: number): void {
    if (i < this.step) {
      this.step = i;
      this.scrollTop();
    }
  }
  place(): void {
    this.placing = true;
    window.setTimeout(() => {
      this.store.clearCart();
      this.router.navigateByUrl('/order/confirmed');
    }, 1100);
  }
}

@Component({
  selector: 'app-order-confirmed',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ProductRailComponent, SectionHeaderComponent],
  template: `
    <div class="mx-auto max-w-shell px-4 py-16 lg:px-10">
      <div class="mx-auto max-w-2xl text-center">
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive-600 text-sand-50"><app-icon name="check" [size]="32"></app-icon></span>
        <h1 class="mt-7 font-displayAr text-4xl text-olive-800">{{ locale.isAr() ? 'استلمنا طلبك، شكراً لك' : 'Your order is confirmed' }}</h1>
        <p class="mt-3 text-ink-muted">{{ locale.isAr() ? 'رقم الطلب ALM-24902 · أرسلنا التفاصيل إلى بريدك.' : 'Order ALM-24902 · we’ve emailed the details to you.' }}</p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a routerLink="/track" class="h-12 inline-flex items-center rounded-md bg-gold-400 px-6 text-olive-900">{{ locale.ui('trackOrder') }}</a>
          <a routerLink="/" class="h-12 inline-flex items-center rounded-md border px-6">{{ locale.ui('continueShopping') }}</a>
        </div>
      </div>
      <div class="mt-16"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
    </div>
  `,
})
export class OrderConfirmedComponent {
  more = products.slice(0, 6);
  constructor(public locale: LocaleService) {}
}

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, CrumbsComponent, SarPipe],
  template: `
    <div class="mx-auto max-w-4xl px-4 py-10">
      <app-crumbs [trail]="trail"></app-crumbs>
      <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-displayAr text-4xl text-olive-800">{{ locale.ui('trackOrder') }}</h1>
          <p class="mt-1.5 text-sm text-ink-muted">{{ order.id }} · {{ order.total | sar }}</p>
        </div>
        <span class="inline-flex items-center gap-2 rounded-full bg-olive-600 px-4 py-2 text-xs text-sand-50"><app-icon name="truck" [size]="14"></app-icon> {{ order.eta ? locale.tr(order.eta) : '' }}</span>
      </div>
      <ol class="relative mt-8 space-y-7 rounded-xl border border-olive-800/10 bg-white p-6 ps-14">
        <li *ngFor="let e of timeline" class="relative">
          <span class="absolute -start-10 flex h-6 w-6 items-center justify-center rounded-full" [class.bg-gold-400]="e.current" [class.bg-olive-600]="e.done && !e.current" [class.bg-sand-200]="!e.done"><app-icon name="check" [size]="14" class="text-sand-50"></app-icon></span>
          <p class="font-medium text-olive-800">{{ locale.tr(e.title) }}</p>
          <p class="text-xs text-ink-muted">{{ locale.tr(e.time) }}</p>
        </li>
      </ol>
    </div>
  `,
})
export class TrackPageComponent {
  order = orders[0];
  timeline = [
    { title: { ar: 'تم تأكيد الطلب', en: 'Order confirmed' }, time: { ar: '٢٢ أغسطس · ١٠:٤٢ ص', en: '22 Aug · 10:42 am' }, done: true, current: false },
    { title: { ar: 'تم التجهيز والتغليف', en: 'Packed and sealed' }, time: { ar: '٢٢ أغسطس · ٤:١٠ م', en: '22 Aug · 4:10 pm' }, done: true, current: false },
    { title: { ar: 'في الطريق إليك', en: 'Out for delivery' }, time: { ar: 'اليوم · ٩:٣٠ ص', en: 'Today · 9:30 am' }, done: true, current: true },
    { title: { ar: 'تم التسليم', en: 'Delivered' }, time: { ar: 'غداً قبل ٦ م', en: 'Tomorrow before 6pm' }, done: false, current: false },
  ];
  constructor(public locale: LocaleService) {}
  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('trackOrder') }];
  }
}
