import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { addresses, orders } from '../data/content';
import { productById, products } from '../data/products';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import type { Address, Locale, Order, Product } from '../types';
import { CountPipe, SarPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { ReviewFormComponent, type ReviewDraft } from '../ui/review-form.component';
import { ProductCardComponent, ProductRailComponent, SectionHeaderComponent } from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, CrumbsComponent, SarPipe, ReviewFormComponent],
  templateUrl: './account.page.html',
})
export class AccountPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navList') navList?: ElementRef<HTMLElement>;
  @ViewChild('navSentinel') navSentinel?: ElementRef<HTMLElement>;
  @ViewChild('accountNav') accountNav?: ElementRef<HTMLElement>;
  navPinned = false;
  navHeight = 56;
  tab = 'overview';
  private navPinObs?: IntersectionObserver;
  orders = orders;
  addressList: Address[] = addresses.map((a) => ({ ...a }));
  reorderIds = ['oil-reserve', 'pkl-cucumber'];
  firstName = 'فهد';
  lastName = 'العتيبي';
  email = 'fahd@example.com';
  phone = '+966 55 014 2288';
  currentPassword = '';
  nextPassword = '';
  confirmPassword = '';
  orderFilter: 'all' | Order['status'] = 'all';
  addressFormOpen = false;
  editingAddressId: string | null = null;
  addrDraft = { label: '', line: '', city: '', phone: '' };
  cardFormOpen = false;
  cardDraft = { brand: 'mada', last4: '', exp: '' };
  returnPicker = false;
  reviewOpen = false;
  reviewOrderId = '';
  reviewProduct: Product | null = null;
  ratings: Record<string, number> = {};
  cards = [
    { brand: 'mada', last4: '4417', exp: '09/28', primary: true },
    { brand: 'VISA', last4: '8802', exp: '02/27', primary: false },
  ];
  notifRows = [
    { labelAr: 'تحديثات الطلب والتوصيل', labelEn: 'Order and delivery updates', hintAr: 'رسائل نصية وبريد', hintEn: 'SMS and email', on: true },
    { labelAr: 'انخفاض سعر منتج في المفضلة', labelEn: 'Price drops on wishlist items', hintAr: 'بريد إلكتروني', hintEn: 'Email', on: true },
    { labelAr: 'عروض المنبت الأسبوعية', labelEn: 'Weekly Almanbat offers', hintAr: 'مرة واحدة أسبوعياً', hintEn: 'Once a week', on: false },
  ];
  trackSteps = [
    { ar: 'التجهيز', en: 'Prepared' },
    { ar: 'في الطريق', en: 'On the way' },
    { ar: 'التسليم', en: 'Delivered' },
  ];
  orderFilters: Array<{ id: 'all' | Order['status']; ar: string; en: string }> = [
    { id: 'all', ar: 'الكل', en: 'All' },
    { id: 'in_transit', ar: 'في الطريق', en: 'In transit' },
    { id: 'delivered', ar: 'تم التسليم', en: 'Delivered' },
    { id: 'cancelled', ar: 'ملغي', en: 'Cancelled' },
  ];

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      this.tab = p.get('tab') || 'overview';
      this.scrollActiveNav();
    });
  }

  ngAfterViewInit(): void {
    this.bindNavPin();
  }

  ngOnDestroy(): void {
    this.navPinObs?.disconnect();
  }

  private bindNavPin(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const sentinel = this.navSentinel?.nativeElement;
    if (!sentinel) return;
    this.navPinObs?.disconnect();
    this.navPinObs = new IntersectionObserver(
      ([entry]) => {
        this.zone.run(() => {
          if (window.matchMedia('(min-width: 1024px)').matches) {
            this.navPinned = false;
            return;
          }
          const pin = !entry.isIntersecting;
          if (pin && this.accountNav) {
            this.navHeight = Math.round(this.accountNav.nativeElement.getBoundingClientRect().height);
          }
          this.navPinned = pin;
        });
      },
      { root: null, threshold: 0, rootMargin: '-7rem 0px 0px 0px' }
    );
    this.navPinObs.observe(sentinel);
  }

  private scrollActiveNav(): void {
    setTimeout(() => {
      if (typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches) return;
      this.navList?.nativeElement.querySelector<HTMLElement>('.is-active')?.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }, 40);
  }

  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('account') }];
  }

  get nav() {
    return [
      { id: 'overview', label: this.locale.ui('dashboard'), icon: 'grid' },
      { id: 'orders', label: this.locale.ui('orders'), icon: 'package' },
      { id: 'addresses', label: this.locale.ui('addresses'), icon: 'pin' },
      { id: 'payments', label: this.locale.ui('payments'), icon: 'card' },
      { id: 'profile', label: this.locale.ui('profile'), icon: 'user' },
      { id: 'notifications', label: this.locale.ui('notifications'), icon: 'bell' },
      { id: 'returns', label: this.locale.ui('returns'), icon: 'rotate' },
    ];
  }

  get greeting(): string {
    return this.locale.isAr() ? `أهلاً ${this.firstName}` : `Welcome back, ${this.firstName}`;
  }

  get initial(): string {
    const name = this.firstName.trim();
    return name ? name.charAt(0) : 'ن';
  }

  get active() {
    return this.orders.find((o) => o.status === 'in_transit') ?? this.orders[0];
  }

  get stats() {
    return [
      { labelAr: 'طلبات هذا العام', labelEn: 'Orders this year', value: String(this.orders.length), icon: 'package' },
      { labelAr: 'نقاط الولاء', labelEn: 'Loyalty points', value: '2,480', icon: 'star' },
      { labelAr: 'المحفوظة', labelEn: 'Saved items', value: String(this.store.wishlist().length), icon: 'heart' },
    ];
  }

  get filteredOrders(): Order[] {
    if (this.orderFilter === 'all') return this.orders;
    return this.orders.filter((o) => o.status === this.orderFilter);
  }

  get deliveredOrders(): Order[] {
    return this.orders.filter((o) => o.status === 'delivered');
  }

  isTab(id: string): boolean {
    return this.tab === id || (id === 'overview' && !this.tab);
  }

  navClass(id: string): string {
    return this.isTab(id) ? 'account-nav-link is-active' : 'account-nav-link';
  }

  item(id: string) {
    return productById(id);
  }

  formatDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(this.locale.isAr() ? 'ar-SA' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  statCardClass(i: number): string {
    return i === 0 ? 'border-gold-400/40 bg-gold-50' : 'border-olive-800/10 bg-white';
  }

  addressCardClass(isDefault: boolean): string {
    return isDefault ? 'border-gold-400/50 bg-gold-50' : 'border-olive-800/10 bg-white';
  }

  stepClass(i: number): string {
    return i <= 1 ? 'text-olive-800 font-medium' : 'text-ink-muted';
  }

  stepDotClass(i: number): string {
    if (i < 1) return 'bg-olive-600 text-sand-50';
    if (i === 1) return 'bg-gold-400 text-olive-900';
    return 'bg-white text-ink-muted ring-1 ring-olive-800/15';
  }

  statusTone(status: string): string {
    const map: Record<string, string> = {
      delivered: 'bg-state-success/12 text-state-success',
      in_transit: 'bg-gold-400 text-olive-900',
      processing: 'bg-sand-100 text-olive-800',
      cancelled: 'bg-state-danger/12 text-state-danger',
    };
    return map[status] ?? map['processing'];
  }

  statusLabel(status: string): string {
    const map: Record<string, { ar: string; en: string }> = {
      delivered: { ar: 'تم التسليم', en: 'Delivered' },
      in_transit: { ar: 'في الطريق', en: 'In transit' },
      processing: { ar: 'قيد التجهيز', en: 'Processing' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    const row = map[status];
    return row ? this.locale.tr(row) : status;
  }

  reorder(ids: string[]): void {
    ids.forEach((id) => this.store.addToCart(id));
  }

  get reviewerName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  rateKey(orderId: string, productId: string): string {
    return orderId + ':' + productId;
  }

  ratingOf(orderId: string, productId: string): number {
    return this.ratings[this.rateKey(orderId, productId)] || 0;
  }

  hasUnrated(order: Order): boolean {
    return order.itemIds.some((id) => !this.ratingOf(order.id, id));
  }

  openItemReview(orderId: string, productId: string): void {
    const product = productById(productId);
    if (!product) return;
    this.reviewOrderId = orderId;
    this.reviewProduct = product;
    this.reviewOpen = true;
  }

  rateOrder(order: Order): void {
    const next = order.itemIds.find((id) => !this.ratingOf(order.id, id));
    if (!next) {
      this.store.pushToast({ title: this.locale.ui('allItemsRated'), tone: 'success' });
      return;
    }
    this.openItemReview(order.id, next);
  }

  closeReview(): void {
    this.reviewOpen = false;
    this.reviewProduct = null;
    this.reviewOrderId = '';
  }

  submitReview(draft: ReviewDraft): void {
    if (this.reviewOrderId && this.reviewProduct) {
      this.ratings = {
        ...this.ratings,
        [this.rateKey(this.reviewOrderId, this.reviewProduct.id)]: draft.rating,
      };
    }
    this.closeReview();
    this.store.pushToast({ tone: 'success', title: this.locale.ui('reviewThanks') });
  }

  startAddress(): void {
    this.editingAddressId = null;
    this.addrDraft = { label: '', line: '', city: this.locale.isAr() ? 'الرياض' : 'Riyadh', phone: this.phone };
    this.addressFormOpen = true;
  }

  editAddress(a: Address): void {
    this.editingAddressId = a.id;
    this.addrDraft = {
      label: this.locale.tr(a.label),
      line: this.locale.tr(a.line),
      city: this.locale.tr(a.city),
      phone: a.phone,
    };
    this.addressFormOpen = true;
  }

  cancelAddress(): void {
    this.addressFormOpen = false;
    this.editingAddressId = null;
  }

  saveAddress(ev: Event): void {
    ev.preventDefault();
    if (!this.addrDraft.label.trim() || !this.addrDraft.line.trim()) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'أكمل وصف العنوان والسطر' : 'Add a label and street address',
        tone: 'warning',
      });
      return;
    }
    const bilingual = (value: string) => ({ ar: value, en: value });
    if (this.editingAddressId) {
      this.addressList = this.addressList.map((a) =>
        a.id === this.editingAddressId
          ? {
              ...a,
              label: bilingual(this.addrDraft.label),
              line: bilingual(this.addrDraft.line),
              city: bilingual(this.addrDraft.city),
              phone: this.addrDraft.phone,
            }
          : a
      );
    } else {
      this.addressList = [
        ...this.addressList,
        {
          id: 'a' + Date.now(),
          label: bilingual(this.addrDraft.label),
          line: bilingual(this.addrDraft.line),
          city: bilingual(this.addrDraft.city),
          phone: this.addrDraft.phone,
          isDefault: this.addressList.length === 0,
        },
      ];
    }
    this.addressFormOpen = false;
    this.editingAddressId = null;
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم حفظ العنوان' : 'Address saved',
      tone: 'success',
    });
  }

  setDefaultAddress(id: string): void {
    this.addressList = this.addressList.map((a) => ({ ...a, isDefault: a.id === id }));
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم تعيين العنوان الافتراضي' : 'Default address updated',
      tone: 'success',
    });
  }

  removeAddress(id: string): void {
    this.addressList = this.addressList.filter((a) => a.id !== id);
    if (this.addressList.length && !this.addressList.some((a) => a.isDefault)) {
      this.addressList = this.addressList.map((a, i) => ({ ...a, isDefault: i === 0 }));
    }
  }

  addCard(ev: Event): void {
    ev.preventDefault();
    if (!/^\d{4}$/.test(this.cardDraft.last4) || !this.cardDraft.exp.trim()) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'أدخل آخر ٤ أرقام وتاريخ الانتهاء' : 'Enter the last 4 digits and expiry',
        tone: 'warning',
      });
      return;
    }
    this.cards = [
      ...this.cards,
      { brand: this.cardDraft.brand, last4: this.cardDraft.last4, exp: this.cardDraft.exp, primary: this.cards.length === 0 },
    ];
    this.cardDraft = { brand: 'mada', last4: '', exp: '' };
    this.cardFormOpen = false;
    this.store.pushToast({
      title: this.locale.isAr() ? 'أُضيفت البطاقة' : 'Card added',
      tone: 'success',
    });
  }

  setPrimaryCard(last4: string): void {
    this.cards = this.cards.map((c) => ({ ...c, primary: c.last4 === last4 }));
  }

  removeCard(last4: string): void {
    this.cards = this.cards.filter((c) => c.last4 !== last4);
    if (this.cards.length && !this.cards.some((c) => c.primary)) {
      this.cards = this.cards.map((c, i) => ({ ...c, primary: i === 0 }));
    }
  }

  saveProfile(ev: Event): void {
    ev.preventDefault();
    if (!this.email.includes('@') || !this.firstName.trim()) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'تحقق من الاسم والبريد' : 'Check name and email',
        tone: 'warning',
      });
      return;
    }
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم حفظ الملف الشخصي' : 'Profile saved',
      tone: 'success',
    });
  }

  savePassword(ev: Event): void {
    ev.preventDefault();
    if (this.nextPassword.length < 4 || this.nextPassword !== this.confirmPassword) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'كلمة المرور الجديدة غير متطابقة أو قصيرة' : 'New password is too short or does not match',
        tone: 'warning',
      });
      return;
    }
    this.currentPassword = '';
    this.nextPassword = '';
    this.confirmPassword = '';
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم تحديث كلمة المرور' : 'Password updated',
      tone: 'success',
    });
  }

  setLang(next: Locale): void {
    if ((next === 'ar') !== this.locale.isAr()) this.locale.toggle();
  }

  toastPrefs(): void {
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم تحديث الإشعارات' : 'Notification preferences saved',
      tone: 'success',
    });
  }

  startReturn(id: string): void {
    this.returnPicker = false;
    this.store.pushToast({
      title: this.locale.isAr() ? `بدأنا إرجاع ${id}` : `Return started for ${id}`,
      tone: 'success',
    });
  }

  signOut(): void {
    this.store.pushToast({
      title: this.locale.isAr() ? 'تم تسجيل الخروج' : 'Signed out',
      tone: 'success',
    });
    this.router.navigateByUrl('/login');
  }
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, ProductRailComponent, SectionHeaderComponent, CrumbsComponent, CountPipe, SarPipe, IconComponent],
  template: `
    <div class="wishlist-page mx-auto max-w-shell px-4 pb-4 pt-2 md:py-7 lg:px-10" [class.has-dock]="items().length > 0">
      <app-crumbs [trail]="trail"></app-crumbs>
      <div class="mt-2.5 flex items-end justify-between gap-4 md:mt-5">
        <div>
          <h1 class="font-displayAr text-[28px] leading-tight text-olive-800 md:text-4xl lg:text-[46px]">{{ locale.ui('wishlist') }}</h1>
          <p class="mt-1 text-sm text-ink-muted">{{ items().length | countLoc }} {{ savedLabel }}</p>
        </div>
        <button
          *ngIf="items().length"
          type="button"
          class="hidden h-11 shrink-0 items-center justify-center rounded-md border border-olive-800/15 bg-white px-4 text-sm font-medium text-olive-800 transition-colors duration-200 ease-premium hover:border-olive-800/40 md:inline-flex"
          (click)="addAll()"
        >
          {{ locale.isAr() ? 'أضف الكل إلى السلة' : 'Add all to cart' }}
        </button>
      </div>

      <ul *ngIf="items().length" class="wishlist-list">
        <li *ngFor="let p of items(); trackBy: trackId" class="wishlist-row">
          <a [routerLink]="['/product', p.slug]" class="wishlist-row__img">
            <img [src]="p.image" alt="" />
          </a>
          <div class="wishlist-row__body">
            <p class="wishlist-row__brand">{{ locale.tr(p.brand) }}</p>
            <a [routerLink]="['/product', p.slug]" class="wishlist-row__name">{{ locale.tr(p.name) }}</a>
            <div class="wishlist-row__meta">
              <span class="wishlist-row__price">{{ p.price | sar }}</span>
              <span *ngIf="p.compareAt" class="wishlist-row__was">{{ p.compareAt | sar }}</span>
            </div>
            <div class="wishlist-row__actions">
              <button type="button" class="wishlist-row__cart" [disabled]="p.stock === 0" (click)="addOne(p)">
                <app-icon [name]="addedId === p.id ? 'check' : 'cart'" [size]="16"></app-icon>
                {{ cartLabel(p) }}
              </button>
              <button type="button" class="wishlist-row__remove" (click)="remove(p)" [attr.aria-label]="locale.ui('remove')">
                <app-icon name="heart" [size]="16" [filled]="true"></app-icon>
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div *ngIf="items().length" class="mt-8 hidden grid-cols-2 gap-x-5 gap-y-9 md:grid md:grid-cols-3 xl:grid-cols-4">
        <app-product-card *ngFor="let p of items(); trackBy: trackId" [product]="p"></app-product-card>
      </div>

      <div *ngIf="!items().length" class="mt-10 text-center">
        <p class="font-medium text-olive-800">{{ locale.isAr() ? 'مفضلتك فارغة' : 'Nothing saved yet' }}</p>
        <p class="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{{ locale.isAr() ? 'اضغط على القلب في أي منتج لحفظه، ونخبرك إذا انخفض سعره.' : 'Tap the heart on any product to save it. We will tell you if the price drops.' }}</p>
        <a routerLink="/" class="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-olive-800 px-5 text-sm font-medium text-sand-50">{{ locale.ui('continueShopping') }}</a>
        <div class="mt-10 text-start"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
      </div>

      <div *ngIf="items().length" class="wishlist-dock">
        <button type="button" class="wishlist-dock__btn" (click)="addAll()">
          {{ locale.isAr() ? 'أضف الكل إلى السلة' : 'Add all to cart' }}
        </button>
      </div>
    </div>
  `,
})
export class WishlistPageComponent {
  more = products.slice(0, 6);
  addedId: string | null = null;
  private addedTimer?: number;
  constructor(public locale: LocaleService, public store: StoreService) {}
  items() {
    return this.store.wishlist().map(productById).filter(Boolean) as NonNullable<ReturnType<typeof productById>>[];
  }
  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('wishlist') }];
  }
  get savedLabel(): string {
    if (this.locale.isAr()) return 'منتج محفوظ';
    return this.items().length === 1 ? 'saved item' : 'saved items';
  }
  trackId(_i: number, p: Product): string {
    return p.id;
  }
  cartLabel(p: Product): string {
    if (p.stock === 0) return this.locale.ui('outOfStock');
    if (this.addedId === p.id) return this.locale.ui('addedToCart');
    return this.locale.ui('addToCart');
  }
  addOne(p: Product): void {
    if (p.stock === 0) return;
    this.store.addToCart(p.id, 1, false);
    this.addedId = p.id;
    this.store.pushToast({ tone: 'success', title: this.locale.ui('addedToCart'), description: this.locale.tr(p.name) });
    window.clearTimeout(this.addedTimer);
    this.addedTimer = window.setTimeout(() => {
      if (this.addedId === p.id) this.addedId = null;
    }, 1600);
  }
  remove(p: Product): void {
    this.store.toggleWishlist(p.id);
    this.store.pushToast({
      tone: 'success',
      title: this.locale.isAr() ? 'أُزيل من المفضلة' : 'Removed from wishlist',
      description: this.locale.tr(p.name),
    });
  }
  addAll(): void {
    const list = this.items().filter((p) => p.stock > 0);
    list.forEach((p) => this.store.addToCart(p.id, 1, false));
    if (list.length) this.store.cartOpen.set(true);
  }
}
