import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, effect, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import '../ui/gsap-setup';
import type { Product, Review } from '../types';
import { faqs } from '../data/content';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { SessionService } from '../services/session.service';
import { StoreService } from '../services/store.service';
import { formatCount } from '../utils/format';
import { pickDisplayName } from '../api/api.util';
import { IconComponent } from '../ui/icon.component';
import { ReviewFormComponent, composeReviewComment, type ReviewDraft } from '../ui/review-form.component';
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
  lightboxIndex = 0;
  hoverZoom = false;
  lightbox = false;
  origin = '50% 50%';
  faqs = faqs.slice(0, 4);
  reviews: Review[] = [];
  extraReviews = 0;
  openFaq: number | null = null;
  reviewOpen = false;
  reviewSaving = false;
  galleryReady = false;
  trail: { label: string; to?: string }[] = [];
  related: Product[] = [];
  bundle: Product[] = [];
  bundleTotal = 0;
  promises: Array<{ icon: string; stat: string; title: string; detail: string }> = [];
  private galleryWatch?: IntersectionObserver;
  private galleryInView = true;
  private galleryEnteredFor: string | null = null;
  private galleryTween?: gsap.core.Timeline;
  private swapping = false;
  private galleryTimer?: number;
  private galleryPaused = false;

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    public catalog: CatalogService,
    public session: SessionService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {
    effect(() => {
      this.locale.locale();
      if (this.product) {
        this.buildTrail();
        this.hydrateDerived();
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.product = this.catalog.bySlug(params.get('slug') || '') ?? null;
      this.qty = 1;
      this.tab = 'description';
      this.galleryIndex = 0;
      this.lightboxIndex = 0;
      this.hoverZoom = false;
      this.closeLightbox();
      this.reviews = [];
      this.extraReviews = 0;
      this.reviewOpen = false;
      this.galleryEnteredFor = null;
      this.galleryReady = false;
      this.swapping = false;
      this.galleryWatch?.disconnect();
      this.stopGalleryLoop();
      this.galleryTween?.kill();
      if (!this.product) this.router.navigateByUrl('/');
      else {
        this.buildTrail();
        this.hydrateDerived();
        this.catalog.reviews(this.product.id).subscribe((rows) => this.applyReviews(rows));
      }
    });
  }

  ngAfterViewChecked(): void {
    const id = this.product?.id ?? null;
    if (!id || this.galleryEnteredFor === id || !this.galleryFrame) return;
    this.galleryEnteredFor = id;
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.enterGallery());
    });
  }

  ngOnDestroy(): void {
    this.galleryWatch?.disconnect();
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
  private buildTrail(): void {
    if (!this.product) {
      this.trail = [];
      return;
    }
    const cat = this.catalog.categoryBySlug(this.product.category);
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

  private hydrateDerived(): void {
    const product = this.product;
    if (!product) {
      this.related = [];
      this.bundle = [];
      this.bundleTotal = 0;
      this.promises = [];
      return;
    }
    const same = this.catalog.byCategory(product.category).filter((p) => p.id !== product.id);
    this.related = same.length ? same : this.catalog.all().filter((p) => p.id !== product.id).slice(0, 5);
    this.bundle = [product, ...this.catalog.all().filter((p) => p.id !== product.id).slice(0, 2)];
    this.bundleTotal = this.bundle.reduce((s, p) => s + p.price, 0);
    const ar = this.locale.isAr();
    const loc = this.locale.locale();
    this.promises = [
      {
        icon: 'truck',
        stat: formatCount(product.deliveryDays, loc),
        title: ar ? 'توصيل' : 'Delivery',
        detail: product.freeShipping ? (ar ? 'بدون رسوم' : 'No fee') : ar ? '٢٥ ر.س' : 'SAR 25',
      },
      {
        icon: 'lock',
        stat: ar ? 'مشفّر' : 'PCI',
        title: ar ? 'الدفع' : 'Payment',
        detail: ar ? 'آمن بالكامل' : 'Fully secure',
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
    if (!this.hoverZoom) return;
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
    this.galleryTween?.kill();
    this.swapping = false;
    this.resetGalleryFrame();
    this.lightboxIndex = this.galleryIndex;
    this.lightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightbox = false;
    this.galleryIndex = this.lightboxIndex;
    this.galleryPaused = false;
    document.body.style.overflow = '';
    this.armGalleryLoop();
  }

  stopLightbox(ev: Event): void {
    ev.stopPropagation();
  }

  stepLightbox(ev: Event, dir: number): void {
    ev.stopPropagation();
    this.shiftLightbox(dir);
  }

  stepGallery(dir: number): void {
    const list = this.product?.gallery ?? [];
    if (list.length < 2) return;
    this.swapGallery((this.galleryIndex + dir + list.length) % list.length);
  }

  private shiftLightbox(dir: number): void {
    const list = this.product?.gallery ?? [];
    if (list.length < 2) return;
    this.lightboxIndex = (this.lightboxIndex + dir + list.length) % list.length;
  }

  private resetGalleryFrame(): void {
    const frame = this.galleryFrame?.nativeElement;
    if (!frame) return;
    const img = frame.querySelector('img');
    gsap.set(frame, { clipPath: 'none', scale: 1, clearProps: 'clipPath,transform' });
    if (img) gsap.set(img, { scale: 1, clearProps: 'transform' });
  }

  private reduceMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private isCompact(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  }

  private clip(parts: string, radius: string): string {
    return this.isCompact() ? `inset(${parts})` : `inset(${parts} round ${radius})`;
  }

  private watchGallery(root: HTMLElement): void {
    this.galleryWatch?.disconnect();
    if (typeof IntersectionObserver === 'undefined') {
      this.galleryInView = true;
      return;
    }
    this.galleryWatch = new IntersectionObserver(
      (entries) => {
        this.galleryInView = entries.some((entry) => entry.isIntersecting);
        if (this.galleryInView) this.armGalleryLoop();
        else this.stopGalleryLoop();
      },
      { threshold: 0.4 }
    );
    this.galleryWatch.observe(root);
  }

  private enterGallery(): void {
    const frame = this.galleryFrame?.nativeElement;
    const root = this.galleryRoot?.nativeElement;
    if (!frame || !root) return;
    this.galleryTween?.kill();
    this.watchGallery(root);
    const thumbs = root.querySelectorAll('.pdp-gallery__thumb');
    const img = frame.querySelector('img');
    const radius = getComputedStyle(frame).borderTopLeftRadius || '18px';
    if (this.reduceMotion()) {
      this.zone.run(() => {
        this.galleryReady = true;
      });
      gsap.set(frame, { clipPath: 'none', clearProps: 'clipPath,transform' });
      if (img) gsap.set(img, { scale: 1, clearProps: 'transform' });
      gsap.set(thumbs, { clearProps: 'opacity,transform' });
      this.armGalleryLoop();
      return;
    }
    const compact = this.isCompact();
    const fromClip = this.clip('24% 18% 24% 18%', radius);
    const toClip = this.clip('0% 0% 0% 0%', radius);
    gsap.set(frame, { clipPath: fromClip });
    if (img) gsap.set(img, { scale: compact ? 1.18 : 1.28, transformOrigin: '50% 50%', force3D: true });
    gsap.set(thumbs, { y: 32, opacity: 0 });
    this.zone.run(() => {
      this.galleryReady = true;
    });
    this.galleryTween = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        gsap.set(frame, { clearProps: 'clipPath' });
        if (img) gsap.set(img, { clearProps: 'transform' });
        this.armGalleryLoop();
      },
    });
    this.galleryTween.to(frame, { clipPath: toClip, duration: compact ? 0.9 : 1.2 }, 0);
    if (img) this.galleryTween.to(img, { scale: 1, duration: compact ? 0.9 : 1.2 }, 0);
    if (thumbs.length) {
      this.galleryTween.to(thumbs, { y: 0, opacity: 1, duration: compact ? 0.45 : 0.6, stagger: compact ? 0.06 : 0.1 }, compact ? 0.28 : 0.45);
    }
  }

  private swapGallery(i: number): void {
    if (this.lightbox) return;
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
    const img = frame.querySelector('img');
    const radius = getComputedStyle(frame).borderTopLeftRadius || '18px';
    const compact = this.isCompact();
    const hide = this.clip(this.locale.isAr() ? '0% 0% 0% 100%' : '0% 100% 0% 0%', radius);
    const open = this.clip('0% 0% 0% 0%', radius);
    this.galleryTween = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        gsap.set(frame, { clearProps: 'clipPath' });
        if (img) gsap.set(img, { clearProps: 'transform' });
        this.swapping = false;
        this.armGalleryLoop();
      },
    });
    this.galleryTween.to(frame, { clipPath: hide, duration: compact ? 0.28 : 0.38, ease: 'power3.in' });
    if (img) {
      this.galleryTween.to(img, { scale: compact ? 1.06 : 1.08, duration: compact ? 0.28 : 0.38, ease: 'power3.in' }, 0);
    }
    this.galleryTween.add(() => {
      this.zone.run(() => {
        this.galleryIndex = i;
      });
    });
    this.galleryTween.fromTo(frame, { clipPath: hide }, { clipPath: open, duration: compact ? 0.55 : 0.72, ease: 'power3.out' });
    if (img) {
      this.galleryTween.fromTo(
        img,
        { scale: compact ? 1.14 : 1.22 },
        { scale: 1, duration: compact ? 0.55 : 0.72, ease: 'power3.out' },
        '<'
      );
    }
  }

  private armGalleryLoop(): void {
    this.stopGalleryLoop();
    if (typeof window === 'undefined') return;
    if (this.lightbox || this.galleryPaused || !this.galleryInView) return;
    if ((this.product?.gallery.length ?? 0) < 2) return;
    this.galleryTimer = window.setTimeout(() => {
      this.galleryTimer = undefined;
      if (this.lightbox || this.galleryPaused || !this.galleryInView || !this.product) return;
      const list = this.product.gallery;
      if (list.length < 2) return;
      this.zone.run(() => {
        this.swapGallery((this.galleryIndex + 1) % list.length);
      });
    }, this.isCompact() ? 5200 : 3800);
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
    if (this.lightbox) this.shiftLightbox(this.locale.isAr() ? 1 : -1);
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.lightbox) this.shiftLightbox(this.locale.isAr() ? -1 : 1);
  }

  get reviewCount(): number {
    if (this.reviews.length) return this.reviews.length;
    return this.product?.reviews ?? 0;
  }

  get displayRating(): number {
    if (this.reviews.length) {
      return this.reviews.reduce((sum, row) => sum + row.rating, 0) / this.reviews.length;
    }
    return this.product?.rating ?? 0;
  }

  get breakdown(): Array<{ stars: number; percent: number }> {
    const total = this.reviews.length;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      percent: total ? Math.round((this.reviews.filter((row) => row.rating === stars).length / total) * 100) : 0,
    }));
  }

  get reviewerName(): string {
    return pickDisplayName(this.session.userName()) || '';
  }

  goReviews(): void {
    this.tab = 'reviews';
    window.setTimeout(() => {
      document.getElementById('pdp-reviews')?.scrollIntoView({
        behavior: this.isCompact() ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 40);
  }

  openReview(): void {
    this.tab = 'reviews';
    this.reviewOpen = true;
  }

  addReview(draft: ReviewDraft): void {
    if (!this.product || this.reviewSaving) return;
    this.reviewSaving = true;
    const productId = this.product.id;
    this.catalog.addReview(productId, draft.rating, composeReviewComment(draft)).subscribe({
      next: (created) => {
        this.reviewSaving = false;
        this.reviewOpen = false;
        this.store.pushToast({ tone: 'success', title: this.locale.ui('reviewThanks') });
        this.catalog.reviews(productId).subscribe((rows) => {
          this.applyReviews(rows.length ? rows : created ? [created] : this.reviews);
        });
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

  private applyReviews(rows: Review[]): void {
    this.reviews = rows;
    this.extraReviews = 0;
    if (!this.product) return;
    const fresh = this.catalog.byId(this.product.id);
    if (fresh) this.product = { ...fresh };
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
    if (!this.store.addToCart(this.product.id, this.qty)) return;
    this.store.pushToast({ tone: 'success', title: this.locale.ui('addedToCart'), description: this.locale.tr(this.product.name) });
    this.added = true;
    window.setTimeout(() => (this.added = false), 1600);
  }

  buyNow(): void {
    if (!this.product || this.soldOut) return;
    if (!this.store.addToCart(this.product.id, this.qty, false)) {
      this.store.requestCheckoutAfterLogin();
      return;
    }
    this.store.cartOpen.set(false);
    this.router.navigateByUrl('/checkout');
  }

  addBundle(): void {
    if (!this.bundle.length) return;
    if (!this.store.addToCart(this.bundle[0].id, 1, false)) return;
    this.bundle.slice(1).forEach((p) => this.store.addToCart(p.id, 1, false));
    this.store.openCart();
  }
}
