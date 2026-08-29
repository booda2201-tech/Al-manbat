import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { productById, products } from '../data/products';
import { orders } from '../data/content';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { SarPipe } from '../utils/sar.pipe';
import { LogoComponent } from '../ui/logo.component';
import { IconComponent } from '../ui/icon.component';
import { ProductRailComponent, SectionHeaderComponent } from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

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
  backToCart(): void {
    this.store.requestCartOpen();
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
