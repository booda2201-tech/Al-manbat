import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage, pickDisplayName } from '../api/api.util';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { StoreService } from '../services/store.service';
import { SessionService } from '../services/session.service';
import { ShopApiService } from '../services/shop-api.service';
import { egyptGovernorates } from '../data/egypt-places';
import { SarPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { ProductRailComponent, SectionHeaderComponent } from '../commerce/commerce.component';

const DRAFT_KEY = 'almanbat.checkoutDraft';
const LAST_ORDER_KEY = 'almanbat.lastOrderId';
const WA_ORDER_KEY = 'almanbat.whatsappOrder';
const ORDER_WHATSAPP = '201050302172';

interface CheckoutDraft {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  ship: string;
  pay: string;
  notes: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, SarPipe],
  templateUrl: './checkout.page.html',
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  step = 0;
  summaryOpen = false;
  name = '';
  phone = '';
  governorate = '';
  city = '';
  address = '';
  notes = '';
  ship = 'standard';
  pay = 'cod';
  placing = false;
  private whatsappTab: Window | null = null;
  shippingOptions = [
    { id: 'sameday', title: { ar: 'توصيل في نفس اليوم', en: 'Same-day delivery' }, detail: { ar: 'قبل ١١ مساءً · القاهرة والجيزة', en: 'Before 11pm · Cairo and Giza' }, price: 35 },
    { id: 'standard', title: { ar: 'التوصيل القياسي', en: 'Standard delivery' }, detail: { ar: 'من يومين إلى ٤ أيام عمل', en: '2 – 4 working days' }, price: 0 },
    { id: 'pickup', title: { ar: 'الاستلام من المعرض', en: 'Collect in store' }, detail: { ar: 'جاهز خلال ساعتين · المعادي', en: 'Ready in 2 hours · Maadi' }, price: 0 },
  ];
  payOptions = [
    { id: 'cod', label: { ar: 'الدفع عند الاستلام', en: 'Cash on delivery' } },
    { id: 'card', label: { ar: 'فيزا / ماستركارد', en: 'Visa / Mastercard' } },
  ];

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    public catalog: CatalogService,
    public session: SessionService,
    private shop: ShopApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreDraft();
    this.prefillFromSession();
    this.store.setShippingGovernorate(this.governorate);
  }

  readonly places = egyptGovernorates;
  get steps() {
    return [this.locale.ui('stepAddress'), this.locale.ui('stepReview')];
  }
  get cityOptions() {
    return egyptGovernorates.find((item) => item.ar === this.governorate)?.cities ?? [];
  }
  onGovernorateChange(): void {
    this.city = '';
    this.store.setShippingGovernorate(this.governorate);
  }
  placeName(item: { ar: string; en: string }): string {
    return this.locale.isAr() ? item.ar : item.en;
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
    if (id === 'cod') return 'truck';
    return 'card';
  }
  shipIcon(id: string): string {
    if (id === 'sameday') return 'zap';
    if (id === 'pickup') return 'home';
    return 'truck';
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
    return this.locale.isAr() ? ['القاهرة', 'الجيزة', 'الإسكندرية'] : ['Cairo', 'Giza', 'Alexandria'];
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
    return this.store.shipping();
  }
  wheelTitle(): string {
    const prize = this.store.wheel();
    if (!prize) return '';
    return this.locale.isAr() ? prize.labelAr : prize.labelEn;
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
  advance(): void {
    if (this.step === 0 && !this.validAddress()) return;
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
    this.placing = true;
    this.saveDraft();
    this.whatsappTab?.close();
    this.whatsappTab = window.open('', '_blank');
    const items = this.rows()
      .map((row) => ({ productId: Number(row.productId), quantity: row.qty }))
      .filter((row) => Number.isFinite(row.productId) && row.productId > 0 && row.quantity > 0);
    this.shop
      .checkout({
        name: this.name.trim(),
        phone: this.phone.trim(),
        governorate: this.governorate.trim(),
        city: this.city.trim(),
        address: this.address.trim(),
        paymentMethod: 'cash',
        notes: this.notes.trim(),
        spinToken: this.store.wheel()?.token,
        items,
      })
      .subscribe({
        next: (result) => {
          const whatsappUrl = this.whatsappOrderUrl(result.id);
          this.placing = false;
          this.store.clearCart();
          this.store.clearWheel();
          try {
            sessionStorage.removeItem(DRAFT_KEY);
            sessionStorage.setItem(WA_ORDER_KEY, whatsappUrl);
            if (result.id) sessionStorage.setItem(LAST_ORDER_KEY, result.id);
          } catch {
            /* ignore */
          }
          const tab = this.whatsappTab;
          this.whatsappTab = null;
          if (tab && !tab.closed) tab.location.href = whatsappUrl;
          this.router.navigate(['/order/confirmed'], {
            queryParams: result.id ? { id: result.id } : {},
          });
        },
        error: (err) => {
          this.placing = false;
          this.whatsappTab?.close();
          this.whatsappTab = null;
          this.store.pushToast({
            tone: 'warning',
            title: this.locale.isAr() ? 'تعذر إتمام الطلب' : 'Could not place the order',
            description: this.checkoutError(err),
          });
        },
      });
  }

  private validAddress(): boolean {
    const ar = this.locale.isAr();
    if (!this.name.trim()) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'اكتب الاسم' : 'Enter the name' });
      return false;
    }
    if (!this.phone.trim()) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'اكتب رقم التليفون' : 'Enter the phone number' });
      return false;
    }
    if (!this.governorate) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'اختار المحافظة' : 'Choose a governorate' });
      return false;
    }
    if (!this.store.shippingKnown()) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'رسوم توصيل المحافظة دي مش متسجلة' : 'This governorate has no shipping fee' });
      return false;
    }
    if (!this.city) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'اختار المدينة' : 'Choose a city' });
      return false;
    }
    if (!this.address.trim()) {
      this.store.pushToast({ tone: 'warning', title: ar ? 'اكتب العنوان التفصيلي' : 'Enter the detailed address' });
      return false;
    }
    return true;
  }

  private whatsappOrderUrl(orderId: string): string {
    const rows = this.rows();
    const products = rows
      .map((row, index) => {
        const name = row.product.name.ar || row.product.name.en;
        const line = row.product.price * row.qty;
        const n = (index + 1).toLocaleString('ar-EG');
        const qty = row.qty.toLocaleString('ar-EG');
        const lines = [`${n}. ${name}`, `   ${qty} × ${money(row.product.price)}  =  ${money(line)}`];
        if (row.product.compareAt && row.product.compareAt > row.product.price) {
          lines.push(`   قبل الخصم: ${money(row.product.compareAt)}`);
        }
        return lines.join('\n');
      })
      .join('\n');
    const prize = this.store.wheel();
    const promo = this.store.promo();
    const subtotal = this.store.subtotal();
    const wheelDiscount =
      prize?.kind === 'Percent' && prize.percent ? Math.round((subtotal * prize.percent) / 100) : 0;
    const codeDiscount = Math.max(0, this.store.promoDiscount() - wheelDiscount);
    const shipping = this.checkoutShipping();
    const notes = this.notes.trim();
    const prizeTitle = prize?.labelAr || prize?.labelEn || '';
    const prizeDetail = prize?.detailAr || prize?.detailEn || '';
    const prizeBlock = prize
      ? [
          '*جائزة العجلة*',
          prizeTitle,
          prizeDetail && prizeDetail !== prizeTitle ? prizeDetail : '',
          prize.kind === 'FreeShipping' ? 'توصيل مجاني على الطلب' : '',
          prize.kind === 'Gift' ? 'هتطلع مع الطلب' : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';
    const shippingText =
      prize?.kind === 'FreeShipping' ? 'مجاني — جائزة العجلة' : shipping === 0 ? 'مجاني' : money(shipping);
    const place = [this.governorate.trim(), this.city.trim()].filter(Boolean).join('، ');
    const customer = [
      '*العميل*',
      `الاسم: ${this.name.trim()}`,
      `التليفون: ${this.phone.trim()}`,
      place ? `العنوان: ${place}` : '',
      this.address.trim(),
      notes ? `ملاحظات: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const totals = [
      `المجموع: ${money(subtotal)}`,
      wheelDiscount > 0 ? `خصم العجلة${prizeTitle ? ` (${prizeTitle})` : ''}: − ${money(wheelDiscount)}` : '',
      codeDiscount > 0 ? `كود الخصم${promo ? ` (${promo})` : ''}: − ${money(codeDiscount)}` : '',
      prize?.kind === 'Gift' && prizeTitle ? `هدية العجلة: ${prizeTitle}` : '',
      `التوصيل: ${shippingText}`,
    ].filter(Boolean);
    totals.push('', `*المطلوب: ${money(this.checkoutTotal())}*`, 'الدفع عند الاستلام');
    const rule = '────────────────';
    const text = [
      ['*فاتورة — المنبت*', orderId ? `رقم الفاتورة: ${orderId}` : '', `التاريخ: ${orderStamp()}`].filter(Boolean).join('\n'),
      customer,
      `*الأصناف*\n${products}`,
      prizeBlock,
      totals.join('\n'),
    ]
      .filter(Boolean)
      .join(`\n${rule}\n`);
    return `https://wa.me/${ORDER_WHATSAPP}?text=${encodeURIComponent(text)}`;
  }

  private checkoutError(err: unknown): string {
    const ar = this.locale.isAr();
    const code = err instanceof Error ? err.message : '';
    if (code === 'CART_EMPTY') {
      return ar ? 'السلة فارغة.' : 'Your cart is empty.';
    }
    return apiErrorMessage(err, ar ? 'تعذر إتمام الطلب. حاول مرة أخرى.' : 'Could not place the order. Try again.');
  }

  private goNextStep(): void {
    this.saveDraft();
    this.step = Math.min(1, this.step + 1);
    this.summaryOpen = false;
    document.body.style.overflow = '';
    this.scrollTop();
  }

  private prefillFromSession(): void {
    if (!this.phone) this.phone = this.session.phone() || '';
    if (!this.name) this.name = pickDisplayName(this.session.userName()) || '';
  }

  private saveDraft(): void {
    const draft: CheckoutDraft = {
      name: this.name,
      phone: this.phone,
      governorate: this.governorate,
      city: this.city,
      address: this.address,
      ship: this.ship,
      pay: this.pay,
      notes: this.notes,
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
      const legacyName = `${draft.firstName || ''} ${draft.lastName || ''}`.trim();
      this.name = draft.name || legacyName || this.name;
      this.phone = draft.phone || this.phone;
      this.governorate = draft.governorate || this.governorate;
      this.city = draft.city || this.city;
      this.address = draft.address || this.address;
      this.ship = draft.ship || this.ship;
      this.pay = draft.pay || this.pay;
      this.notes = draft.notes || '';
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
          · {{ locale.isAr() ? 'هنوصلّه لعنوانك.' : 'We’ll deliver it to your address.' }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a *ngIf="whatsappUrl" [href]="whatsappUrl" target="_blank" rel="noopener" class="h-12 inline-flex items-center rounded-md bg-[#25D366] px-6 font-semibold text-white">{{ locale.isAr() ? 'إرسال الطلب على واتساب' : 'Send the order on WhatsApp' }}</a>
          <a routerLink="/" class="h-12 inline-flex items-center rounded-md bg-gold-400 px-6 text-olive-900">{{ locale.ui('continueShopping') }}</a>
        </div>
      </div>
      <div class="mt-16"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
    </div>
  `,
})
export class OrderConfirmedComponent implements OnInit {
  orderId = '';
  whatsappUrl = '';
  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParamMap.get('id') || readLastOrderId();
    this.whatsappUrl = readWhatsappOrder();
  }
  get more() {
    return this.catalog.all().slice(0, 6);
  }
}

function readLastOrderId(): string {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY) || '';
  } catch {
    return '';
  }
}

function readWhatsappOrder(): string {
  try {
    return sessionStorage.getItem(WA_ORDER_KEY) || '';
  } catch {
    return '';
  }
}

function money(amount: number): string {
  const value = amount.toLocaleString('ar-EG', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${value} ج.م`;
}

function orderStamp(): string {
  const now = new Date();
  const date = now.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  return `${date}، ${time}`;
}
