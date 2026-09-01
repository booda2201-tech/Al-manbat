import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, interval, of, Subscription, switchMap } from 'rxjs';
import { apiErrorMessage, pickDisplayName } from '../api/api.util';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { StoreService } from '../services/store.service';
import { SessionService } from '../services/session.service';
import { AccountApiService, orderTrackStep, resolveApiStatus } from '../services/account-api.service';
import { ShopApiService } from '../services/shop-api.service';
import type { Address, Order } from '../types';
import { SarPipe } from '../utils/sar.pipe';
import { LogoComponent } from '../ui/logo.component';
import { IconComponent } from '../ui/icon.component';
import { ProductRailComponent, SectionHeaderComponent } from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

const DRAFT_KEY = 'almanbat.checkoutDraft';
const LAST_ORDER_KEY = 'almanbat.lastOrderId';

interface CheckoutDraft {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  address: string;
  saveAddress: boolean;
  ship: string;
  pay: string;
  notes: string;
  selectedAddressId: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, SarPipe, LogoComponent],
  templateUrl: './checkout.page.html',
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  step = 0;
  summaryOpen = false;
  guest = true;
  email = '';
  emailError = '';
  firstName = '';
  lastName = '';
  phone = '';
  city = '';
  address = '';
  notes = '';
  saveAddress = true;
  selectedAddressId = '';
  savedAddresses: Address[] = [];
  addingNew = false;
  savingAddress = false;
  addressLabel = '';
  ship = 'standard';
  pay = 'cod';
  placing = false;
  shippingOptions = [
    { id: 'sameday', title: { ar: 'توصيل في نفس اليوم', en: 'Same-day delivery' }, detail: { ar: 'قبل ١١ مساءً · الرياض فقط', en: 'Before 11pm · Riyadh only' }, price: 35 },
    { id: 'standard', title: { ar: 'التوصيل القياسي', en: 'Standard delivery' }, detail: { ar: 'من يومين إلى ٤ أيام عمل', en: '2 – 4 working days' }, price: 0 },
    { id: 'pickup', title: { ar: 'الاستلام من المعرض', en: 'Collect in store' }, detail: { ar: 'جاهز خلال ساعتين · حي الياسمين', en: 'Ready in 2 hours · Al Yasmin' }, price: 0 },
  ];
  payOptions = [
    { id: 'cod', label: { ar: 'الدفع عند الاستلام', en: 'Cash on delivery' } },
    { id: 'card', label: { ar: 'فيزا / مدى', en: 'Visa / Mada' } },
  ];

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    public catalog: CatalogService,
    public session: SessionService,
    private accountApi: AccountApiService,
    private shop: ShopApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.guest = !this.session.isLoggedIn();
    this.city = this.locale.isAr() ? 'الرياض' : 'Riyadh';
    this.restoreDraft();
    this.prefillFromSession();
    if (this.session.isLoggedIn()) {
      this.guest = false;
      this.loadAccount();
    }
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
  get selectedAddress(): Address | undefined {
    return this.savedAddresses.find((a) => a.id === this.selectedAddressId);
  }
  payIcon(id: string): string {
    if (id === 'cod') return 'truck';
    return 'card';
  }
  shipIcon(id: string): string {
    if (id === 'sameday') return 'zap';
    if (id === 'pickup') return 'home';
    return 'truck';
  }
  get reviewName(): string {
    const fromForm = `${this.firstName} ${this.lastName}`.trim();
    if (fromForm) return fromForm;
    return pickDisplayName(this.session.userName()) || '';
  }
  get reviewLabel(): string {
    if (this.addressLabel.trim()) return this.addressLabel.trim();
    const saved = this.selectedAddress;
    if (saved) return this.locale.tr(saved.label);
    return '';
  }
  get reviewPhone(): string {
    return this.phone.trim() || this.selectedAddress?.phone || '';
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
      .map((l) => ({ ...l, product: this.catalog.byId(l.productId)! }))
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

  applySavedAddress(a: Address): void {
    this.addingNew = false;
    this.selectedAddressId = a.id;
    this.address = this.locale.tr(a.line);
    this.city = this.locale.tr(a.city) || this.city;
    if (a.phone) this.phone = a.phone;
  }

  useNewAddress(): void {
    this.addingNew = true;
    this.selectedAddressId = '';
    this.addressLabel = '';
    this.address = '';
  }

  cancelNewAddress(): void {
    this.addingNew = false;
    const preferred = this.savedAddresses.find((a) => a.isDefault) || this.savedAddresses[0];
    if (preferred) this.applySavedAddress(preferred);
  }

  saveNewAddress(thenAdvance = false): void {
    if (this.savingAddress) return;
    if (!this.session.isLoggedIn()) {
      this.saveDraft();
      this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
      return;
    }
    if (!this.address.trim() || !this.city.trim()) {
      this.store.pushToast({
        tone: 'warning',
        title: this.locale.isAr() ? 'أدخل المدينة والعنوان' : 'Enter the city and street address',
      });
      return;
    }
    this.savingAddress = true;
    this.accountApi.addAddress(this.addressPayload()).subscribe({
      next: (created) => {
        this.accountApi.getAddresses().subscribe({
          next: (rows) => this.afterAddressSaved(created, rows, thenAdvance),
          error: () => this.afterAddressSaved(created, [], thenAdvance),
        });
      },
      error: (err) => {
        this.savingAddress = false;
        this.store.pushToast({
          tone: 'warning',
          title: this.locale.isAr() ? 'تعذر حفظ العنوان' : 'Could not save the address',
          description: err instanceof Error ? err.message : undefined,
        });
      },
    });
  }

  advance(): void {
    if (this.step === 0 && !this.validAddress()) return;
    if (this.step === 0 && this.session.isLoggedIn() && this.addingNew && !this.selectedAddressId) {
      this.saveNewAddress(true);
      return;
    }
    this.goNextStep();
  }

  goStep(i: number): void {
    if (i < this.step) {
      this.step = i;
      this.scrollTop();
    }
  }

  place(): void {
    if (this.placing) return;
    if (!this.rows().length) {
      this.store.pushToast({
        tone: 'warning',
        title: this.locale.isAr() ? 'السلة فارغة' : 'Your cart is empty',
      });
      return;
    }
    if (!this.validAddress()) {
      this.step = 0;
      this.scrollTop();
      return;
    }
    if (!this.session.isLoggedIn()) {
      this.saveDraft();
      this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
      return;
    }
    this.placing = true;
    this.saveDraft();
    this.ensureAddress()
      .pipe(
        switchMap((addressId) => this.store.syncCartToServer().pipe(switchMap(() => of(addressId)))),
        switchMap((addressId) =>
          this.shop.checkout({
            addressId,
            paymentMethod: this.pay === 'cod' ? 'Cash' : 'Visa',
            notes: this.composeCheckoutNotes(),
          })
        )
      )
      .subscribe({
        next: (result) => {
          this.placing = false;
          this.store.clearCart(true);
          try {
            sessionStorage.removeItem(DRAFT_KEY);
            if (result.id) sessionStorage.setItem(LAST_ORDER_KEY, result.id);
          } catch {
            /* ignore */
          }
          this.router.navigate(['/order/confirmed'], {
            queryParams: result.id ? { id: result.id } : {},
          });
        },
        error: (err) => {
          this.placing = false;
          this.store.pushToast({
            tone: 'warning',
            title: this.locale.isAr() ? 'تعذر إتمام الطلب' : 'Could not place the order',
            description: apiErrorMessage(err, this.locale.isAr() ? 'حاول مرة أخرى.' : 'Please try again.'),
          });
        },
      });
  }

  private validAddress(): boolean {
    if (this.guest && !this.session.isLoggedIn() && !/^\S+@\S+\.\S+$/.test(this.email)) {
      this.emailError = this.locale.isAr() ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address';
      return false;
    }
    if (this.selectedAddressId && !this.addingNew) return true;
    if (this.session.isLoggedIn()) {
      if (!this.address.trim() || !this.city.trim()) {
        this.store.pushToast({
          tone: 'warning',
          title: this.locale.isAr() ? 'أدخل المدينة والعنوان' : 'Enter the city and street address',
        });
        return false;
      }
      return true;
    }
    if (!this.firstName.trim() || !this.address.trim() || !this.city.trim()) {
      this.store.pushToast({
        tone: 'warning',
        title: this.locale.isAr() ? 'أكمل الاسم والعنوان' : 'Add your name and street address',
      });
      return false;
    }
    return true;
  }

  private composeCheckoutNotes(): string | undefined {
    const name =
      `${this.firstName} ${this.lastName}`.trim() || pickDisplayName(this.session.userName()) || '';
    const phone = this.phone.trim();
    const address = [this.address.trim(), this.city.trim()].filter(Boolean).join('، ');
    const snap = ['ALM', name.replace(/\|/g, ' '), phone.replace(/\|/g, ''), address.replace(/\|/g, '، ')].join('|');
    const extra = this.notes.trim();
    return extra ? `${snap}\n${extra}` : snap;
  }

  private addressPayload(): { label: string; street: string; city: string; governorate: string; notes?: string } {
    const label =
      this.addressLabel.trim() ||
      `${this.firstName} ${this.lastName}`.trim() ||
      (this.locale.isAr() ? 'المنزل' : 'Home');
    return {
      label,
      street: this.address.trim(),
      city: this.city.trim(),
      governorate: this.city.trim(),
      notes: this.phone.trim() || undefined,
    };
  }

  private afterAddressSaved(created: Address, rows: Address[], thenAdvance: boolean): void {
    this.savingAddress = false;
    this.addingNew = false;
    this.saveAddress = true;
    this.savedAddresses = rows.length
      ? rows
      : [created, ...this.savedAddresses.filter((a) => a.id !== created.id)];
    const match =
      this.savedAddresses.find((a) => a.id === created.id) ||
      this.savedAddresses.find((a) => this.locale.tr(a.line) === this.address.trim()) ||
      this.savedAddresses[0] ||
      created;
    this.applySavedAddress(match);
    this.saveDraft();
    this.store.pushToast({
      tone: 'success',
      title: this.locale.isAr() ? 'تم حفظ العنوان على حسابك' : 'Address saved to your profile',
    });
    if (thenAdvance) this.goNextStep();
  }

  private goNextStep(): void {
    this.emailError = '';
    this.saveDraft();
    this.step = Math.min(3, this.step + 1);
    this.summaryOpen = false;
    document.body.style.overflow = '';
    this.scrollTop();
  }

  private ensureAddress(): Observable<number> {
    if (this.selectedAddressId && /^\d+$/.test(this.selectedAddressId)) {
      return of(Number(this.selectedAddressId));
    }
    return this.accountApi.addAddress(this.addressPayload()).pipe(
      switchMap((created) => {
        if (!created.id || !/^\d+$/.test(created.id)) {
          throw new Error(this.locale.isAr() ? 'تعذر حفظ العنوان' : 'Could not save the address');
        }
        this.selectedAddressId = created.id;
        this.savedAddresses = [created, ...this.savedAddresses.filter((a) => a.id !== created.id)];
        return of(Number(created.id));
      })
    );
  }

  private loadAccount(): void {
    this.accountApi.getProfile().subscribe((profile) => {
      if (!profile) return;
      if (!this.firstName) this.firstName = profile.firstName;
      if (!this.lastName) this.lastName = profile.lastName;
      if (!this.email) this.email = profile.email;
      if (!this.phone) this.phone = profile.phone || this.session.phone() || '';
    });
    this.accountApi.getAddresses().subscribe((rows) => {
      this.savedAddresses = rows;
      if (this.addingNew) return;
      if (!rows.length) {
        this.addingNew = true;
        return;
      }
      if (!this.selectedAddressId) {
        const preferred = rows.find((a) => a.isDefault) || rows[0];
        if (preferred) this.applySavedAddress(preferred);
      }
    });
  }

  private prefillFromSession(): void {
    if (this.phone) return;
    this.phone = this.session.phone() || '';
    const name = pickDisplayName(this.session.userName());
    const parts = name.split(/\s+/).filter(Boolean);
    if (!this.firstName) this.firstName = parts[0] || '';
    if (!this.lastName) this.lastName = parts.slice(1).join(' ');
    if (!this.email) this.email = this.session.email() || '';
  }

  private saveDraft(): void {
    const draft: CheckoutDraft = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      city: this.city,
      address: this.address,
      saveAddress: this.saveAddress,
      ship: this.ship,
      pay: this.pay,
      notes: this.notes,
      selectedAddressId: this.selectedAddressId,
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }

  private restoreDraft(): void {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as CheckoutDraft;
      this.email = draft.email || this.email;
      this.firstName = draft.firstName || this.firstName;
      this.lastName = draft.lastName || this.lastName;
      this.phone = draft.phone || this.phone;
      this.city = draft.city || this.city;
      this.address = draft.address || this.address;
      this.saveAddress = draft.saveAddress !== false;
      this.ship = draft.ship || this.ship;
      this.pay = draft.pay || this.pay;
      this.notes = draft.notes || '';
      this.selectedAddressId = draft.selectedAddressId || '';
    } catch {
      /* ignore */
    }
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
        <p class="mt-3 text-ink-muted">
          {{ locale.isAr() ? 'رقم الطلب' : 'Order' }}
          <strong dir="ltr">{{ orderId || '—' }}</strong>
          · {{ locale.isAr() ? 'تقدر تتابع حالته من حسابك.' : 'You can track it from your account.' }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a [routerLink]="orderId ? '/track' : '/account/orders'" [queryParams]="orderId ? { id: orderId } : {}" class="h-12 inline-flex items-center rounded-md bg-gold-400 px-6 text-olive-900">{{ locale.ui('trackOrder') }}</a>
          <a routerLink="/" class="h-12 inline-flex items-center rounded-md border px-6">{{ locale.ui('continueShopping') }}</a>
        </div>
      </div>
      <div class="mt-16"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
    </div>
  `,
})
export class OrderConfirmedComponent implements OnInit {
  orderId = '';
  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParamMap.get('id') || readLastOrderId();
  }
  get more() {
    return this.catalog.all().slice(0, 6);
  }
}

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, CrumbsComponent, SarPipe],
  template: `
    <div class="track-page">
      <div class="hidden lg:block">
        <app-crumbs [trail]="trail"></app-crumbs>
      </div>

      <header class="track-head">
        <div class="min-w-0">
          <p class="track-head__kicker">{{ locale.ui('trackOrder') }}</p>
          <h1>{{ order?.id || (locale.isAr() ? 'لا يوجد طلب' : 'No order') }}</h1>
          <p *ngIf="order" class="track-head__meta">
            {{ formatDate(order.date) }}
            <span aria-hidden="true"> · </span>
            {{ order.total | sar }}
          </p>
        </div>
      </header>

      <p *ngIf="!order" class="track-empty">
        {{ locale.isAr() ? 'لا يوجد طلب للتتبع. أكمل الشراء من السلة أولاً.' : 'No order to track yet. Place an order from checkout first.' }}
        <a routerLink="/listing/all">{{ locale.ui('shopAll') }}</a>
      </p>

      <ng-container *ngIf="order">
        <p *ngIf="cancelled" class="track-void">
          {{ locale.isAr() ? 'هذا الطلب ملغي.' : 'This order was cancelled.' }}
        </p>

        <div class="track-board">
          <ol class="track-rail">
            <li *ngFor="let e of timeline" [class.is-on]="e.current" [class.is-done]="e.done && !e.current" [class.is-wait]="!e.done">
              <span class="track-rail__dot" aria-hidden="true">
                <app-icon *ngIf="e.done" name="check" [size]="13"></app-icon>
              </span>
              <div class="min-w-0">
                <p>{{ locale.tr(e.title) }}</p>
                <span *ngIf="locale.tr(e.hint)" class="track-rail__hint">{{ locale.tr(e.hint) }}</span>
              </div>
            </li>
          </ol>

          <div class="track-side">
            <ul *ngIf="order.itemIds.length" class="track-lines">
              <li *ngFor="let id of order.itemIds">
                <ng-container *ngIf="lineOf(id) as line">
                  <a *ngIf="line.slug" [routerLink]="['/product', line.slug]" class="track-line">
                    <img *ngIf="line.image" [src]="line.image" alt="" />
                    <span *ngIf="!line.image" class="track-line__ph"><app-icon name="package" [size]="16"></app-icon></span>
                    <span class="track-line__copy">
                      <b>{{ line.name }}</b>
                      <i>{{ line.price ? (line.price | sar) : '' }}</i>
                    </span>
                  </a>
                  <div *ngIf="!line.slug" class="track-line">
                    <img *ngIf="line.image" [src]="line.image" alt="" />
                    <span *ngIf="!line.image" class="track-line__ph"><app-icon name="package" [size]="16"></app-icon></span>
                    <span class="track-line__copy">
                      <b>{{ line.name }}</b>
                      <i>{{ line.price ? (line.price | sar) : '' }}</i>
                    </span>
                  </div>
                </ng-container>
              </li>
            </ul>
            <p *ngIf="order.customerAddress" class="track-note">
              <app-icon name="pin" [size]="14"></app-icon>
              {{ order.customerAddress }}
            </p>
            <a routerLink="/account/orders" class="track-back">{{ locale.isAr() ? 'كل الطلبات' : 'All orders' }}</a>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class TrackPageComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  private pollSub?: Subscription;
  constructor(
    public locale: LocaleService,
    private route: ActivatedRoute,
    private accountApi: AccountApiService,
    private catalog: CatalogService
  ) {}
  ngOnInit(): void {
    this.reload();
    this.pollSub = interval(12000).subscribe(() => {
      if (!document.hidden) this.reload();
    });
  }
  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
  @HostListener('document:visibilitychange')
  onVisible(): void {
    if (document.visibilityState === 'visible') this.reload();
  }
  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('trackOrder') }];
  }
  get cancelled(): boolean {
    return resolveApiStatus(this.order) === 'Cancelled';
  }
  formatDate(iso: string): string {
    const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(this.locale.isAr() ? 'ar-SA' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  lineOf(id: string): { name: string; image: string; slug: string; price?: number; qty?: number } | null {
    const product = this.catalog.byId(id);
    if (product) {
      return { name: this.locale.tr(product.name), image: product.image, slug: product.slug, price: product.price };
    }
    const snap = this.order?.snapshots?.[id];
    if (!snap) return { name: id, image: '', slug: '', price: undefined };
    return { name: snap.name, image: snap.image, slug: '', price: snap.price, qty: snap.qty };
  }
  get timeline() {
    const step = orderTrackStep(this.order);
    const dateHint = { ar: this.formatDate(this.order?.date || ''), en: this.formatDate(this.order?.date || '') };
    if (this.cancelled) {
      return [
        { title: { ar: 'استلمنا طلبك', en: 'Order received' }, hint: dateHint, done: true, current: false },
        { title: { ar: 'الطلب ملغي', en: 'Order cancelled' }, hint: { ar: '', en: '' }, done: true, current: true },
      ];
    }
    return [
      { title: { ar: 'استلمنا طلبك', en: 'Order received' }, hint: dateHint, done: true, current: step === 0 },
      { title: { ar: 'تم تأكيد الطلب', en: 'Order confirmed' }, hint: { ar: '', en: '' }, done: step >= 1, current: step === 1 },
      { title: { ar: 'في الطريق إليك', en: 'Out for delivery' }, hint: { ar: '', en: '' }, done: step >= 2, current: step === 2 },
      { title: { ar: 'تم التسليم', en: 'Delivered' }, hint: { ar: '', en: '' }, done: step >= 3, current: step === 3 },
    ];
  }
  private reload(): void {
    const id = this.route.snapshot.queryParamMap.get('id') || readLastOrderId();
    if (id) {
      this.accountApi.getOrder(id).subscribe((order) => {
        this.order = order;
        if (!order) this.loadLatest();
      });
    } else {
      this.loadLatest();
    }
  }
  private loadLatest(): void {
    this.accountApi.getMyOrders().subscribe((orders) => {
      this.order = orders[0] || null;
    });
  }
}

function readLastOrderId(): string {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY) || '';
  } catch {
    return '';
  }
}
