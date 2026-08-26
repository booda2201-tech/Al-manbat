import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Product, Review } from '../types';
import { faqs, ratingBreakdown, reviews as seedReviews } from '../data/content';
import { categoryBySlug } from '../data/categories';
import { byCategory, productBySlug, products } from '../data/products';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { formatCount } from '../utils/format';
import { IconComponent } from '../ui/icon.component';
import { ReviewFormComponent, type ReviewDraft } from '../ui/review-form.component';
import {
  PriceBlockComponent,
  ProductRailComponent,
  QtyComponent,
  RatingComponent,
  SectionHeaderComponent,
  StockComponent,
} from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';
import { CountPipe, SarPipe } from '../utils/sar.pipe';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    PriceBlockComponent,
    QtyComponent,
    RatingComponent,
    StockComponent,
    ProductRailComponent,
    SectionHeaderComponent,
    CrumbsComponent,
    CountPipe,
    SarPipe,
    ReviewFormComponent,
  ],
  templateUrl: './product.page.html',
})
export class ProductPageComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  qty = 1;
  tab: 'description' | 'specs' | 'reviews' = 'description';
  added = false;
  galleryIndex = 0;
  hoverZoom = false;
  lightbox = false;
  origin = '50% 50%';
  faqs = faqs.slice(0, 4);
  reviews: Review[] = [...seedReviews];
  extraReviews = 0;
  breakdown = ratingBreakdown;
  openFaq: number | null = null;
  reviewOpen = false;

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.product = productBySlug(params.get('slug') || '') ?? null;
      this.qty = 1;
      this.tab = 'description';
      this.galleryIndex = 0;
      this.hoverZoom = false;
      this.closeLightbox();
      this.reviews = [...seedReviews];
      this.extraReviews = 0;
      this.reviewOpen = false;
      if (!this.product) this.router.navigateByUrl('/');
    });
  }

  ngOnDestroy(): void {
    this.closeLightbox();
  }

  get soldOut(): boolean {
    return !this.product || this.product.stock === 0;
  }
  get wished(): boolean {
    return !!this.product && this.store.wishlist().includes(this.product.id);
  }
  get comparing(): boolean {
    return !!this.product && this.store.compare().includes(this.product.id);
  }
  get related(): Product[] {
    if (!this.product) return [];
    const list = byCategory(this.product.category).filter((p) => p.id !== this.product!.id);
    return list.length ? list : products.slice(0, 5);
  }
  get bundle(): Product[] {
    if (!this.product) return [];
    return [this.product, ...products.filter((p) => p.id !== this.product!.id).slice(0, 2)];
  }
  get bundleTotal(): number {
    return this.bundle.reduce((s, p) => s + p.price, 0);
  }
  get trail() {
    if (!this.product) return [];
    const cat = categoryBySlug(this.product.category);
    return [
      { label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' },
      ...(cat
        ? [
            { label: this.locale.tr(cat.name), to: `/category/${cat.slug}` },
            { label: this.locale.ui('shopAll'), to: `/listing/${cat.slug}` },
          ]
        : []),
      { label: this.locale.tr(this.product.name) },
    ];
  }
  get promises() {
    if (!this.product) return [];
    const p = this.product;
    const ar = this.locale.isAr();
    const loc = this.locale.locale();
    return [
      {
        icon: 'truck',
        stat: formatCount(p.deliveryDays, loc),
        title: ar ? 'توصيل' : 'Delivery',
        detail: p.freeShipping ? (ar ? 'بدون رسوم' : 'No fee') : ar ? '٢٥ ر.س' : 'SAR 25',
      },
      {
        icon: 'rotate',
        stat: formatCount(14, loc),
        title: ar ? 'إرجاع' : 'Returns',
        detail: ar ? 'من بابك مجاناً' : 'Free pickup',
      },
      {
        icon: 'pin',
        stat: ar ? 'الرياض' : 'Riyadh',
        title: ar ? 'المدينة' : 'City',
        detail: ar ? 'يمكن تغييرها' : 'Change anytime',
      },
      {
        icon: 'shield',
        stat: ar ? '١٠٠٪' : '100%',
        title: ar ? 'أصالة' : 'Authenticity',
        detail: ar ? 'دفعة موثّقة' : 'Verified batch',
      },
    ];
  }

  promiseDivider(i: number): string {
    return i > 0 ? 'lg:border-s lg:border-olive-800/10' : '';
  }

  thumbClass(i: number): string {
    return i === this.galleryIndex ? 'border-gold-400' : 'border-transparent hover:border-olive-800/20';
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

  onGalleryEnter(): void {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) this.hoverZoom = true;
  }

  onGalleryMove(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.origin = `${((ev.clientX - rect.left) / rect.width) * 100}% ${((ev.clientY - rect.top) / rect.height) * 100}%`;
  }

  selectThumb(i: number): void {
    this.galleryIndex = i;
    this.hoverZoom = false;
    this.origin = '50% 50%';
  }

  openLightbox(): void {
    this.hoverZoom = false;
    this.lightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightbox = false;
    document.body.style.overflow = '';
  }

  stopLightbox(ev: Event): void {
    ev.stopPropagation();
  }

  stepLightbox(ev: Event, dir: number): void {
    ev.stopPropagation();
    this.stepGallery(dir);
  }

  stepGallery(dir: number): void {
    const list = this.product?.gallery ?? [];
    if (list.length < 2) return;
    this.galleryIndex = (this.galleryIndex + dir + list.length) % list.length;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.lightbox) this.closeLightbox();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (this.lightbox) this.stepGallery(this.locale.isAr() ? 1 : -1);
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.lightbox) this.stepGallery(this.locale.isAr() ? -1 : 1);
  }

  get reviewCount(): number {
    return (this.product?.reviews ?? 0) + this.extraReviews;
  }

  goReviews(): void {
    this.tab = 'reviews';
    window.setTimeout(() => {
      document.getElementById('pdp-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  openReview(): void {
    this.tab = 'reviews';
    this.reviewOpen = true;
  }

  addReview(draft: ReviewDraft): void {
    const today = new Date().toISOString().slice(0, 10);
    const fallback = this.locale.isAr() ? 'تقييم' : 'Review';
    const next: Review = {
      id: 'u-' + Date.now(),
      author: { ar: draft.name, en: draft.name },
      rating: draft.rating,
      date: today,
      title: { ar: draft.title || fallback, en: draft.title || fallback },
      body: { ar: draft.body, en: draft.body },
      verified: false,
    };
    this.reviews = [next, ...this.reviews];
    this.extraReviews += 1;
    this.reviewOpen = false;
    this.store.pushToast({ tone: 'success', title: this.locale.ui('reviewThanks') });
    window.setTimeout(() => {
      document.getElementById('pdp-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  isOwnReview(id: string): boolean {
    return id.indexOf('u-') === 0;
  }

  add(): void {
    if (!this.product || this.soldOut) return;
    this.store.addToCart(this.product.id, this.qty);
    this.store.pushToast({ tone: 'success', title: this.locale.ui('addedToCart'), description: this.locale.tr(this.product.name) });
    this.added = true;
    window.setTimeout(() => (this.added = false), 1600);
  }

  buyNow(): void {
    if (!this.product || this.soldOut) return;
    this.store.addToCart(this.product.id, this.qty);
    this.store.cartOpen.set(false);
    this.router.navigateByUrl('/checkout');
  }

  addBundle(): void {
    this.bundle.forEach((p) => this.store.addToCart(p.id));
  }
}
