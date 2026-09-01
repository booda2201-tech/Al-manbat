import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, interval, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { AuthApiService } from '../services/auth-api.service';
import { AccountApiService, orderTrackStep, resolveApiStatus, type AccountProfile } from '../services/account-api.service';
import { SessionService } from '../services/session.service';
import { StoreService } from '../services/store.service';
import { pickDisplayName } from '../api/api.util';
import type { Address, ApiOrderStatus, Locale, Order, Product } from '../types';
import { CountPipe, SarPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { ReviewFormComponent, composeReviewComment, type ReviewDraft } from '../ui/review-form.component';
import { ProductCardComponent, ProductRailComponent, SectionHeaderComponent } from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, CrumbsComponent, SarPipe, ReviewFormComponent],
  templateUrl: './account.page.html',
})
export class AccountPageComponent implements OnInit, OnDestroy {
  @ViewChild('navList') navList?: ElementRef<HTMLElement>;
  tab = 'overview';
  loading = true;
  saving = false;
  private pollSub?: Subscription;
  private sawRoute = false;
  orders: Order[] = [];
  addressList: Address[] = [];
  reorderIds: string[] = [];
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  joinedYear = '';
  currentPassword = '';
  nextPassword = '';
  confirmPassword = '';
  showPassword = false;
  passwordSaving = false;
  orderFilter: 'all' | Order['status'] = 'all';
  addressFormOpen = false;
  editingAddressId: string | null = null;
  addrDraft = { label: '', line: '', city: '', governorate: '', postalCode: '', phone: '' };
  reviewOpen = false;
  reviewSaving = false;
  reviewOrderId = '';
  reviewProduct: Product | null = null;
  ratings: Record<string, number> = {};
  trackSteps = [
    { ar: 'جديد', en: 'Received' },
    { ar: 'مؤكد', en: 'Confirmed' },
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
    public catalog: CatalogService,
    public session: SessionService,
    private auth: AuthApiService,
    private accountApi: AccountApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const next = p.get('tab') || 'overview';
      if (next === 'returns' || next === 'payments' || next === 'notifications') {
        this.router.navigate(['/account', 'overview'], { replaceUrl: true });
        return;
      }
      this.tab = next;
      this.scrollActiveNav();
      if (this.sawRoute) this.refresh(true);
      this.sawRoute = true;
    });
    this.store.hydrateFromApi();
    this.applySessionFallback();
    this.refresh();
    this.pollSub = interval(12000).subscribe(() => {
      if (document.hidden) return;
      if (this.tab === 'overview' || this.tab === 'orders') this.refresh(true);
    });
  }

  @HostListener('document:visibilitychange')
  onVisible(): void {
    if (document.visibilityState === 'visible') this.refresh(true);
  }

  private refresh(silent = false): void {
    if (!silent) this.loading = true;
    forkJoin({
      profile: this.accountApi.getProfile().pipe(catchError(() => of(null))),
      orders: this.accountApi.getMyOrders().pipe(catchError(() => of([] as Order[]))),
      addresses: this.accountApi.getAddresses().pipe(catchError(() => of([] as Address[]))),
    }).subscribe(({ profile, orders, addresses }) => {
      if (profile) this.applyProfile(profile);
      this.addressList = addresses.length ? addresses : this.addressList;
      this.orders = orders;
      const fromOrders = orders.flatMap((o) => o.itemIds);
      this.reorderIds = [...new Set(fromOrders)].slice(0, 2);
      this.loading = false;
    });
  }

  private applyProfile(profile: AccountProfile): void {
    const phone = profile.phone || this.session.phone() || '';
    const shown = pickDisplayName(`${profile.firstName} ${profile.lastName}`.trim(), profile.userName);
    const parts = shown.split(/\s+/).filter(Boolean);
    this.firstName = profile.firstName || parts[0] || '';
    this.lastName = profile.lastName || parts.slice(1).join(' ');
    this.email = profile.email;
    this.phone = phone;
    this.joinedYear = yearOf(profile.createdAt);
    if (profile.addresses.length && !this.addressList.length) this.addressList = profile.addresses;
    this.session.setProfile({
      userName: shown || undefined,
      phone: this.phone,
      email: this.email,
    });
  }

  private applySessionFallback(): void {
    this.phone = this.session.phone() || '';
    this.email = this.session.email() || '';
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
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

  readonly navItems = [
    { id: 'overview', labelKey: 'dashboard' as const, icon: 'grid' },
    { id: 'orders', labelKey: 'orders' as const, icon: 'package' },
    { id: 'addresses', labelKey: 'addresses' as const, icon: 'pin' },
    { id: 'profile', labelKey: 'profile' as const, icon: 'user' },
  ];

  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('account') }];
  }

  trackNav(_: number, item: { id: string }): string {
    return item.id;
  }

  goTab(id: string, ev?: MouseEvent): void {
    if (ev && (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey)) return;
    ev?.preventDefault();
    ev?.stopPropagation();
    if (this.tab === id) return;
    this.tab = id;
    this.scrollActiveNav();
    void this.router.navigate(['/account', id]);
  }

  get greeting(): string {
    if (this.firstName) {
      return this.locale.isAr() ? `أهلاً ${this.firstName}` : `Welcome back, ${this.firstName}`;
    }
    return this.locale.isAr() ? 'أهلاً بك' : 'Welcome back';
  }

  get initial(): string {
    const name = this.firstName.trim() || pickDisplayName(this.session.userName()) || '';
    return name ? name.charAt(0) : 'م';
  }

  get active(): Order | null {
    return this.orders.find((o) => o.status === 'in_transit' || o.status === 'processing') ?? null;
  }

  get activeStep(): number {
    return orderTrackStep(this.active);
  }

  orderApiStatus(order: Order | null | undefined): ApiOrderStatus {
    return resolveApiStatus(order);
  }

  get stats() {
    const year = new Date().getFullYear();
    const thisYear = this.orders.filter((o) => (o.date || '').startsWith(String(year))).length;
    return [
      { labelAr: 'الطلبات', labelEn: 'Orders', value: String(thisYear || this.orders.length), icon: 'package', href: '/account/orders' },
      { labelAr: 'العناوين', labelEn: 'Addresses', value: String(this.addressList.length), icon: 'pin', href: '/account/addresses' },
      { labelAr: 'المحفوظة', labelEn: 'Saved', value: String(this.store.wishlist().length), icon: 'heart', href: '/wishlist' },
    ];
  }

  get filteredOrders(): Order[] {
    if (this.orderFilter === 'all') return this.orders;
    return this.orders.filter((o) => o.status === this.orderFilter);
  }

  isTab(id: string): boolean {
    return this.tab === id || (id === 'overview' && !this.tab);
  }

  navClass(id: string): string {
    return this.isTab(id) ? 'account-nav-link is-active' : 'account-nav-link';
  }

  item(id: string) {
    return this.catalog.byId(id);
  }

  lineOf(order: Order | null | undefined, id: string): { name: string; image: string; slug: string; price?: number } | null {
    const product = this.catalog.byId(id);
    if (product) {
      return { name: this.locale.tr(product.name), image: product.image, slug: product.slug, price: product.price };
    }
    const snap = order?.snapshots?.[id];
    if (!snap) return null;
    return { name: snap.name, image: snap.image, slug: '', price: snap.price };
  }

  formatDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(this.locale.isAr() ? 'ar-SA' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  addressCardClass(isDefault: boolean): string {
    return isDefault ? 'border-gold-400/50 bg-gold-50' : 'border-olive-800/10 bg-white';
  }

  stepClass(i: number): string {
    return i <= this.activeStep ? 'text-olive-800 font-medium' : 'text-ink-muted';
  }

  stepDotClass(i: number): string {
    if (i < this.activeStep) return 'bg-olive-600 text-sand-50';
    if (i === this.activeStep) return 'bg-gold-400 text-olive-900';
    return 'bg-white text-ink-muted ring-1 ring-olive-800/15';
  }

  statusTone(orderOrStatus: Order | string): string {
    const api = typeof orderOrStatus === 'string' ? resolveApiStatus({ status: orderOrStatus as Order['status'] }) : resolveApiStatus(orderOrStatus);
    const map: Record<string, string> = {
      Delivered: 'bg-state-success/12 text-state-success',
      Shipped: 'bg-gold-400 text-olive-900',
      Confirmed: 'bg-olive-800/10 text-olive-800',
      Pending: 'bg-sand-100 text-olive-800',
      Cancelled: 'bg-state-danger/12 text-state-danger',
    };
    return map[api] || map['Pending'];
  }

  statusLabel(orderOrStatus: Order | string): string {
    const api = typeof orderOrStatus === 'string' ? resolveApiStatus({ status: orderOrStatus as Order['status'] }) : resolveApiStatus(orderOrStatus);
    const map: Record<ApiOrderStatus, { ar: string; en: string }> = {
      Pending: { ar: 'جديد', en: 'New' },
      Confirmed: { ar: 'مؤكد', en: 'Confirmed' },
      Shipped: { ar: 'في الطريق', en: 'On the way' },
      Delivered: { ar: 'تم التسليم', en: 'Delivered' },
      Cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    return this.locale.tr(map[api]);
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
    const product = this.catalog.byId(productId);
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
    if (this.reviewSaving) return;
    this.reviewOpen = false;
    this.reviewProduct = null;
    this.reviewOrderId = '';
  }

  submitReview(draft: ReviewDraft): void {
    if (!this.reviewProduct || this.reviewSaving) return;
    this.reviewSaving = true;
    const productId = this.reviewProduct.id;
    const orderId = this.reviewOrderId;
    this.catalog.addReview(productId, draft.rating, composeReviewComment(draft)).subscribe({
      next: () => {
        this.reviewSaving = false;
        this.ratings = {
          ...this.ratings,
          [this.rateKey(orderId, productId)]: draft.rating,
        };
        this.reviewOpen = false;
        this.reviewProduct = null;
        this.reviewOrderId = '';
        this.store.pushToast({ tone: 'success', title: this.locale.ui('reviewThanks') });
      },
      error: (err) => {
        this.reviewSaving = false;
        const message = err instanceof Error && err.message && err.message !== 'REVIEW' ? err.message : '';
        this.store.pushToast({
          tone: 'warning',
          title: message || this.locale.ui('reviewFailed'),
        });
      },
    });
  }

  startAddress(): void {
    this.editingAddressId = null;
    this.addrDraft = {
      label: '',
      line: '',
      city: this.locale.isAr() ? 'الرياض' : 'Riyadh',
      governorate: '',
      postalCode: '',
      phone: this.phone,
    };
    this.addressFormOpen = true;
  }

  editAddress(a: Address): void {
    this.editingAddressId = a.id;
    this.addrDraft = {
      label: this.locale.tr(a.label),
      line: this.locale.tr(a.line),
      city: this.locale.tr(a.city),
      governorate: '',
      postalCode: '',
      phone: a.phone || this.phone,
    };
    this.addressFormOpen = true;
  }

  cancelAddress(): void {
    this.addressFormOpen = false;
    this.editingAddressId = null;
  }

  saveAddress(ev: Event): void {
    ev.preventDefault();
    if (this.saving) return;
    if (!this.addrDraft.label.trim() || !this.addrDraft.line.trim() || !this.addrDraft.city.trim()) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'أكمل الوصف والعنوان والمدينة' : 'Add a label, street and city',
        tone: 'warning',
      });
      return;
    }
    const dto = {
      label: this.addrDraft.label.trim(),
      street: this.addrDraft.line.trim(),
      city: this.addrDraft.city.trim(),
      governorate: this.addrDraft.governorate.trim() || this.addrDraft.city.trim(),
      postalCode: this.addrDraft.postalCode.trim() || undefined,
      notes: this.addrDraft.phone.trim() || undefined,
    };
    this.saving = true;
    const req$ = this.editingAddressId
      ? this.accountApi.updateAddress(this.editingAddressId, dto)
      : this.accountApi.addAddress(dto);
    req$.subscribe({
      next: () => {
        const phone = this.addrDraft.phone.trim();
        if (phone && phone !== this.phone) {
          this.phone = phone;
          this.accountApi
            .updateProfile({
              userName: `${this.firstName} ${this.lastName}`.trim(),
              firstName: this.firstName,
              lastName: this.lastName,
              email: this.email,
              phone,
              addresses: this.addressList,
            })
            .pipe(catchError(() => of(null)))
            .subscribe();
        }
        this.addressFormOpen = false;
        this.editingAddressId = null;
        this.reloadAddresses(true);
      },
      error: (err) => {
        this.saving = false;
        this.store.pushToast({
          title: this.locale.isAr() ? 'تعذر حفظ العنوان على الحساب' : 'Could not save the address to your profile',
          description: err instanceof Error ? err.message : undefined,
          tone: 'warning',
        });
      },
    });
  }

  private reloadAddresses(toast = false): void {
    this.accountApi.getAddresses().subscribe({
      next: (addresses) => {
        this.saving = false;
        this.addressList = addresses;
        if (toast) {
          this.store.pushToast({
            title: this.locale.isAr() ? 'تم حفظ العنوان على حسابك' : 'Address saved to your profile',
            tone: 'success',
          });
        }
      },
      error: () => {
        this.saving = false;
      },
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
    this.accountApi.deleteAddress(id).subscribe({
      next: () => this.reloadAddresses(),
      error: () => {
        this.store.pushToast({
          title: this.locale.isAr() ? 'تعذر حذف العنوان' : 'Could not delete the address',
          tone: 'warning',
        });
      },
    });
  }

  saveProfile(ev: Event): void {
    ev.preventDefault();
    if (!this.firstName.trim()) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'أدخل الاسم' : 'Enter your name',
        tone: 'warning',
      });
      return;
    }
    if (this.email && !this.email.includes('@')) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'تحقق من البريد' : 'Check the email address',
        tone: 'warning',
      });
      return;
    }
    this.saving = true;
    const profile: AccountProfile = {
      userName: `${this.firstName} ${this.lastName}`.trim(),
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      addresses: this.addressList,
    };
    this.accountApi.updateProfile(profile).subscribe({
      next: (saved) => {
        this.saving = false;
        this.applyProfile(saved);
        this.accountApi.getProfile().subscribe((fresh) => {
          const fromServer = pickDisplayName(
            fresh ? `${fresh.firstName} ${fresh.lastName}`.trim() : '',
            fresh?.userName
          );
          if (fresh && fromServer) this.applyProfile(fresh);
        });
        this.store.pushToast({
          title: this.locale.isAr() ? 'تم حفظ الملف الشخصي على الخادم' : 'Profile saved on the server',
          tone: 'success',
        });
      },
      error: () => {
        this.saving = false;
        this.store.pushToast({
          title: this.locale.isAr() ? 'تعذر الحفظ على الخادم' : 'Could not save on the server',
          tone: 'warning',
        });
      },
    });
  }

  savePassword(ev: Event): void {
    ev.preventDefault();
    if (this.passwordSaving) return;
    if (this.nextPassword.length < 4 || this.nextPassword !== this.confirmPassword) {
      this.store.pushToast({
        title: this.locale.isAr() ? 'كلمة المرور الجديدة غير متطابقة أو قصيرة' : 'New password is too short or does not match',
        tone: 'warning',
      });
      return;
    }
    this.passwordSaving = true;
    this.accountApi.changePassword(this.currentPassword, this.nextPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.currentPassword = '';
        this.nextPassword = '';
        this.confirmPassword = '';
        this.store.pushToast({
          title: this.locale.isAr() ? 'تم تحديث كلمة المرور' : 'Password updated',
          tone: 'success',
        });
      },
      error: () => {
        this.passwordSaving = false;
        this.store.pushToast({
          title: this.locale.isAr() ? 'تعذر تحديث كلمة المرور' : 'Could not update the password',
          tone: 'warning',
        });
      },
    });
  }

  setLang(next: Locale): void {
    if ((next === 'ar') !== this.locale.isAr()) this.locale.toggle();
  }

  signOut(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.store.pushToast({
          title: this.locale.isAr() ? 'تم تسجيل الخروج' : 'Signed out',
          tone: 'success',
        });
        this.router.navigateByUrl('/login');
      },
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}

function yearOf(value?: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})/);
  if (match) return match[1];
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? String(d.getFullYear()) : '';
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
  addedId: string | null = null;
  private addedTimer?: number;
  constructor(public locale: LocaleService, public store: StoreService, public catalog: CatalogService) {}
  get more() {
    return this.catalog.all().slice(0, 6);
  }
  items() {
    return this.store.wishlist().map((id) => this.catalog.byId(id)).filter((p): p is Product => Boolean(p));
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
    if (!this.store.addToCart(p.id, 1, false)) return;
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
    if (!list.length) return;
    if (!this.store.addToCart(list[0].id, 1, false)) return;
    list.slice(1).forEach((p) => this.store.addToCart(p.id, 1, false));
    this.store.openCart();
  }
}
