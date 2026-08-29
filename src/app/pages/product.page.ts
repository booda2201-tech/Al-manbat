import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, effect, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
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
export class ProductPageComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('galleryRoot') galleryRoot?: ElementRef<HTMLElement>;
  @ViewChild('galleryFrame') galleryFrame?: ElementRef<HTMLElement>;
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
  galleryReady = false;
  trail: { label: string; to?: string }[] = [];
  private galleryEnteredFor: string | null = null;
  private galleryTween?: gsap.core.Timeline;
  private swapping = false;
  private galleryTimer?: number;
  private galleryPaused = false;

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {
    effect(() => {
      this.locale.locale();
      if (this.product) this.buildTrail();
    });
  }

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
      this.galleryEnteredFor = null;
      this.galleryReady = false;
      this.swapping = false;
      this.stopGalleryLoop();
      this.galleryTween?.kill();
      if (!this.product) this.router.navigateByUrl('/');
      else this.buildTrail();
    });
  }

  ngAfterViewChecked(): void {
    const id = this.product?.id ?? null;
    if (id && this.galleryFrame && this.galleryEnteredFor !== id) {
      this.galleryEnteredFor = id;
      requestAnimationFrame(() => this.zone.run(() => this.enterGallery()));
    }
  }

  ngOnDestroy(): void {
    this.stopGalleryLoop();
    this.galleryTween?.kill();
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
  private buildTrail(): void {
    if (!this.product) {
      this.trail = [];
      return;
    }
    const cat = categoryBySlug(this.product.category);
    this.trail = [
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
    this.galleryPaused = true;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) this.hoverZoom = true;
  }

  onGalleryLeave(): void {
    this.hoverZoom = false;
    this.galleryPaused = false;
    this.armGalleryLoop();
  }

  onGalleryMove(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.origin = `${((ev.clientX - rect.left) / rect.width) * 100}% ${((ev.clientY - rect.top) / rect.height) * 100}%`;
  }

  selectThumb(i: number): void {
    this.stopGalleryLoop();
    this.swapGallery(i);
  }

  openLightbox(): void {
    this.hoverZoom = false;
    this.galleryPaused = true;
    this.stopGalleryLoop();
    this.lightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightbox = false;
    this.galleryPaused = false;
    document.body.style.overflow = '';
    this.armGalleryLoop();
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
    this.swapGallery((this.galleryIndex + dir + list.length) % list.length);
  }

  private reduceMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private enterGallery(): void {
    const frame = this.galleryFrame?.nativeElement;
    const root = this.galleryRoot?.nativeElement;
    if (!frame || !root) return;
    this.galleryTween?.kill();
    const thumbs = root.querySelectorAll('.pdp-gallery__thumb');
    const radius = getComputedStyle(frame).borderTopLeftRadius || '18px';
    if (this.reduceMotion()) {
      this.galleryReady = true;
      gsap.set(frame, { clipPath: `inset(0% 0% 0% 0% round ${radius})`, scale: 1, clearProps: 'clipPath,transform' });
      gsap.set(thumbs, { clearProps: 'opacity,transform' });
      this.armGalleryLoop();
      return;
    }
    const fromClip = `inset(24% 18% 24% 18% round ${radius})`;
    const toClip = `inset(0% 0% 0% 0% round ${radius})`;
    gsap.set(frame, { clipPath: fromClip, scale: 1.28 });
    gsap.set(thumbs, { y: 32, opacity: 0 });
    this.galleryReady = true;
    this.galleryTween = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => this.armGalleryLoop(),
    });
    this.galleryTween.to(frame, { clipPath: toClip, scale: 1, duration: 1.2 }, 0);
    if (thumbs.length) {
      this.galleryTween.to(thumbs, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, 0.45);
    }
  }

  private swapGallery(i: number): void {
    if (i === this.galleryIndex || this.swapping) return;
    this.hoverZoom = false;
    this.origin = '50% 50%';
    const frame = this.galleryFrame?.nativeElement;
    if (!frame || this.reduceMotion()) {
      this.galleryIndex = i;
      this.armGalleryLoop();
      return;
    }
    this.swapping = true;
    this.galleryTween?.kill();
    const radius = getComputedStyle(frame).borderTopLeftRadius || '18px';
    const hide = this.locale.isAr()
      ? `inset(0% 0% 0% 100% round ${radius})`
      : `inset(0% 100% 0% 0% round ${radius})`;
    const open = `inset(0% 0% 0% 0% round ${radius})`;
    this.galleryTween = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        this.swapping = false;
        this.armGalleryLoop();
      },
    });
    this.galleryTween
      .to(frame, { clipPath: hide, scale: 1.08, duration: 0.38, ease: 'power3.in' })
      .add(() => {
        this.zone.run(() => {
          this.galleryIndex = i;
        });
      })
      .fromTo(
        frame,
        { clipPath: hide, scale: 1.22 },
        { clipPath: open, scale: 1, duration: 0.72, ease: 'power3.out' }
      );
  }

  private armGalleryLoop(): void {
    this.stopGalleryLoop();
    if (typeof window === 'undefined') return;
    if (this.lightbox || this.galleryPaused) return;
    if ((this.product?.gallery.length ?? 0) < 2) return;
    this.galleryTimer = window.setTimeout(() => {
      this.galleryTimer = undefined;
      if (this.lightbox || this.galleryPaused || !this.product) return;
      const list = this.product.gallery;
      if (list.length < 2) return;
      this.zone.run(() => {
        this.swapGallery((this.galleryIndex + 1) % list.length);
      });
    }, 3800);
  }

  private stopGalleryLoop(): void {
    if (this.galleryTimer != null) {
      window.clearTimeout(this.galleryTimer);
      this.galleryTimer = undefined;
    }
  }

  @HostListener('document:visibilitychange')
  onVisibility(): void {
    if (document.hidden) this.stopGalleryLoop();
    else this.armGalleryLoop();
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

  reviewInitial(review: Review): string {
    return this.locale.tr(review.author).trim().charAt(0) || 'م';
  }

  reviewDate(date: string): string {
    const parts = date.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (!year || !month || !day) return date;
    if (this.locale.isAr()) {
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${day} ${months[month - 1]} ${year}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[month - 1]} ${year}`;
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
