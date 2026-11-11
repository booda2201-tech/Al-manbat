import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, computed, effect, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HeroAd, Category, Bilingual } from '../types';
import { placeVideo } from '../data/content';
import { HERO_AD_MS, desktopHeroAds, heroAds } from '../data/hero-ads';
import { ContentApiService, mapAdvertisement, bySort } from '../services/content-api.service';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { CountPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { SpinWheelComponent } from '../ui/spin-wheel.component';
import { ScrollOpenDirective } from '../ui/scroll-open.directive';
import {
  ProductCardComponent,
  ProductRailComponent,
  SectionHeaderComponent,
  TrustStripComponent,
} from '../commerce/commerce.component';

const CATEGORY_PLACEHOLDER = 'assets/catalog/cat-oil-banner.png';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    SpinWheelComponent,
    ScrollOpenDirective,
    CountPipe,
    ProductCardComponent,
    ProductRailComponent,
    SectionHeaderComponent,
    TrustStripComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  images = images;
  heroIndex = 0;
  heroPaused = false;
  placeFilms: Array<{ title: Bilingual; place: Bilingual; poster: string; src: string }> = [];
  placeIndex = 0;
  placePlaying = false;
  @ViewChild('placeStage') placeStage?: ElementRef<HTMLElement>;
  @ViewChild(SpinWheelComponent) homeWheel?: SpinWheelComponent;
  @ViewChildren('slideFilm') slideFilms?: QueryList<ElementRef<HTMLVideoElement>>;
  hours = '00';
  minutes = '00';
  seconds = '00';
  offerClock = false;
  private timer?: number;
  private left = 0;
  private heroTimer?: number;
  private heroStartedAt = 0;
  private heroRemaining = HERO_AD_MS;
  private reduceMotion = false;
  private placeWatch?: IntersectionObserver;
  private placeSound = false;
  private readonly desktop = signal(false);
  private desktopMq?: MediaQueryList;
  private desktopMqListener?: (event: MediaQueryListEvent) => void;

  private readonly campaignAds = signal<HeroAd[]>([]);

  constructor(
    public locale: LocaleService,
    public catalog: CatalogService,
    private content: ContentApiService,
    private zone: NgZone
  ) {
    if (typeof window !== 'undefined') {
      this.desktop.set(window.matchMedia('(min-width: 1024px)').matches);
    }
    effect(() => {
      const n = this.heroSlides().length;
      untracked(() => {
        if (!n) return;
        if (this.heroIndex >= n) this.heroIndex = 0;
      });
    });
    effect(() => {
      const ends = this.deals()
        .map((product) => Date.parse(product.discountEndsAt || ''))
        .filter((time) => Number.isFinite(time));
      untracked(() => this.syncOfferClock(ends));
    });
  }

  readonly categories = computed(() => this.catalog.categories());
  readonly catsFew = computed(() => this.categories().length <= 5);
  readonly catsOdd = computed(() => this.categories().length % 2 === 1);
  readonly lead = computed(() => this.categories()[0] ?? null);
  readonly rest = computed(() => this.categories().slice(1, 5));
  readonly bestSellers = computed(() => {
    const list = this.catalog.withBadge('bestseller');
    return (list.length ? list : this.catalog.all()).slice(0, 8);
  });
  readonly newArrivals = computed(() => {
    const list = this.catalog.withBadge('new');
    return (list.length ? list : this.catalog.all()).slice(0, 8);
  });
  readonly exclusive = computed(() => this.catalog.exclusive().slice(0, 8));
  readonly deals = computed(() => this.catalog.withBadge('deal').slice(0, 8));
  readonly spots = computed(() =>
    this.categories()
      .slice(0, 3)
      .map((c, i) => ({
        slug: c.slug,
        dark: i === 1,
        flip: i === 1,
        category: c,
        items: this.catalog.byCategory(c.slug).slice(0, 3),
      }))
  );

  private readonly heroSlides = computed(() => {
    const remote = this.campaignAds();
    if (remote.length) return remote;
    if (this.desktop()) return this.desktopSlides();
    const slides = this.catalog.categories().map((category) => this.slideFromCategory(category));
    return slides.length ? slides : heroAds;
  });

  get ads(): HeroAd[] {
    return this.heroSlides();
  }

  get desktopHero(): boolean {
    return this.desktop();
  }

  get currentAd(): HeroAd {
    return this.ads[this.heroIndex] || this.ads[0];
  }

  get nextAd(): HeroAd {
    const list = this.ads;
    if (!list.length) return heroAds[0];
    return list[(this.heroIndex + 1) % list.length];
  }

  get heroCount(): string {
    return String(this.ads.length).padStart(2, '0');
  }

  heroShows(index: number): boolean {
    const n = this.ads.length;
    if (!n) return false;
    const prev = (this.heroIndex - 1 + n) % n;
    const next = (this.heroIndex + 1) % n;
    return index === this.heroIndex || index === next || index === prev;
  }

  get placeReel(): Array<{ title: Bilingual; place: Bilingual; poster: string; src: string }> {
    return this.placeFilms;
  }

  playSlide(index: number, muted = false): void {
    const film = this.slideFilms?.get(index)?.nativeElement;
    if (!film?.src) return;
    if (index === this.placeIndex && !film.paused) return;
    this.slideFilms?.forEach((item, itemIndex) => {
      if (itemIndex !== index) item.nativeElement.pause();
    });
    this.placeIndex = index;
    this.placePlaying = true;
    film.muted = muted || !this.placeSound;
    const played = film.play();
    if (!played) return;
    played.then(() => {
      if (!film.muted) this.placeSound = true;
    }).catch(() => {
      if (!film.muted) {
        film.muted = true;
        const retry = film.play();
        if (retry) retry.catch(() => { this.placePlaying = false; });
        return;
      }
      this.placePlaying = false;
    });
  }

  stepPlace(dir: number): void {
    const count = this.placeReel.length;
    if (count < 2) return;
    const keepPlaying = this.placePlaying;
    this.slideFilms?.forEach((item) => item.nativeElement.pause());
    this.placePlaying = false;
    this.placeIndex = (this.placeIndex + dir + count) % count;
    if (keepPlaying) setTimeout(() => this.playSlide(this.placeIndex));
  }

  showPlay(index: number): boolean {
    return !this.placePlaying || this.placeIndex !== index;
  }

  isPlace(index: number): boolean {
    return this.placeIndex === index;
  }

  hasManyFilms(): boolean {
    return this.placeReel.length > 1;
  }

  dotClass(index: number): string {
    return this.placeIndex === index ? 'w-6 bg-gold-400' : 'w-2 bg-sand-50/70';
  }

  goPlace(index: number): void {
    if (index === this.placeIndex || index < 0 || index >= this.placeReel.length) return;
    this.slideFilms?.forEach((item) => item.nativeElement.pause());
    this.placePlaying = false;
    this.placeIndex = index;
    this.playSlide(index, !this.placeSound);
  }

  private watchPlace(): void {
    this.placeWatch?.disconnect();
    const node = this.placeStage?.nativeElement;
    if (!node || this.reduceMotion || typeof IntersectionObserver === 'undefined') return;
    this.placeWatch = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const ratio = entry.intersectionRatio;
      const show = entry.isIntersecting && ratio >= 0.35;
      const hide = !entry.isIntersecting || ratio < 0.12;
      this.zone.run(() => {
        if (show) this.playSlide(this.placeIndex, !this.placeSound);
        else if (hide) this.pausePlace();
      });
    }, { threshold: [0, 0.12, 0.35, 0.6] });
    this.placeWatch.observe(node);
  }

  private pausePlace(): void {
    this.slideFilms?.forEach((item) => item.nativeElement.pause());
    this.placePlaying = false;
  }

  onPlaceEnded(): void {
    if (this.placeReel.length > 1) {
      this.stepPlace(1);
      return;
    }
    this.placePlaying = false;
  }

  catCount(cat: Category): number {
    const fromSubs = cat.subcategories.reduce((s, x) => s + x.count, 0);
    return fromSubs || this.catalog.byCategory(cat.slug).length;
  }

  trackCat(_i: number, c: Category): string {
    return c.slug;
  }

  trackSpot(_i: number, s: { slug: string }): string {
    return s.slug;
  }

  trackProduct(_i: number, p: { id: string }): string {
    return p.id;
  }

  chipClass(dark: boolean): string {
    return dark
      ? 'border-sand-100/20 text-sand-100/85 hover:border-gold-300 hover:text-gold-300'
      : 'border-olive-800/15 bg-white text-ink-soft hover:border-olive-800/40 hover:text-olive-700';
  }

  shopAllClass(dark: boolean): string {
    return dark
      ? 'border-sand-100/25 text-sand-100 hover:border-gold-300 hover:text-gold-300'
      : 'border-olive-800/20 text-olive-700 hover:border-gold-400 hover:text-gold-400';
  }

  spotlightSectionClass(dark: boolean): string {
    return dark ? 'grain relative bg-olive-800' : 'bg-sand-100/50';
  }

  storyClass(dark: boolean): string {
    return dark ? 'text-sand-100/75' : 'text-ink-muted';
  }

  heroScrimClass(): string {
    return this.locale.isAr()
      ? 'bg-gradient-to-l from-olive-900/70 via-olive-900/28 to-transparent'
      : 'bg-gradient-to-r from-olive-900/70 via-olive-900/28 to-transparent';
  }

  heroImgClass(active: boolean): string {
    const base = 'hero-photo absolute inset-0 h-full w-full object-center transition-opacity duration-[900ms] ease-premium';
    return active ? `${base} is-on opacity-100` : `${base} opacity-0`;
  }

  heroPlayState(): string {
    return this.heroPaused ? 'paused' : 'running';
  }

  heroTrackClass(active: boolean): string {
    return active ? 'bg-sand-100/30' : 'bg-sand-100/15 hover:bg-sand-100/28';
  }

  padSlide(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  trackAd(_index: number, ad: HeroAd): string {
    return ad.id;
  }

  private slideFromCategory(category: Category): HeroAd {
    const storyAr = (category.story?.ar || category.tagline?.ar || '').trim();
    const storyEn = (category.story?.en || category.tagline?.en || '').trim();
    return {
      id: category.slug,
      image: this.heroImageFor(category),
      badge: { ar: 'من أقسام المنبت', en: 'From our shelves' },
      eyebrow: category.name,
      heading: { ar: category.name.ar, en: category.name.en },
      body: {
        ar: clipText(storyAr, 48) || `تسوق قسم ${category.name.ar}.`,
        en: clipText(storyEn, 56) || `Shop ${category.name.en}.`,
      },
      primary: {
        label: { ar: `تسوق ${category.name.ar}`, en: `Shop ${category.name.en}` },
        to: `/listing/${category.slug}`,
      },
      secondary: { label: { ar: 'كل الأقسام', en: 'All categories' }, to: '/listing/all' },
    };
  }

  private heroImageFor(category: Category): string {
    if (category.image && category.image !== CATEGORY_PLACEHOLDER) return category.image;
    const product = this.catalog.byCategory(category.slug).find((item) => item.image && item.image !== CATEGORY_PLACEHOLDER);
    return product?.image || category.image || images.hero;
  }

  goToHero(index: number): void {
    const total = this.ads.length || 1;
    const next = (index + total) % total;
    this.heroIndex = next;
    this.heroRemaining = HERO_AD_MS;
    if (this.heroPaused) {
      this.clearHeroClock();
      return;
    }
    this.startHeroClock();
  }

  nextHero(): void {
    this.goToHero(this.heroIndex + 1);
  }

  prevHero(): void {
    this.goToHero(this.heroIndex - 1);
  }

  pauseHero(): void {
    if (this.heroPaused) return;
    this.heroPaused = true;
    this.clearHeroClock();
    this.heroRemaining = Math.max(400, this.heroRemaining - (Date.now() - this.heroStartedAt));
  }

  resumeHero(): void {
    if (!this.heroPaused) return;
    this.heroPaused = false;
    this.startHeroClock();
  }

  toggleHeroPause(): void {
    if (this.heroPaused) this.resumeHero();
    else this.pauseHero();
  }

  @HostListener('document:visibilitychange')
  onHeroVisibility(): void {
    if (document.hidden) this.pauseHero();
    else this.resumeHero();
  }

  webLink(to?: string): boolean {
    return !!to && /^https?:\/\//i.test(to);
  }

  ngOnInit(): void {
    this.content.videos().subscribe((rows) => {
      const films = bySort(rows)
        .filter((row) => row.isActive !== false && /^https?:\/\//i.test((row.videoUrl || '').trim()))
        .map((row) => ({
          title: {
            ar: (row.titleAr || row.title || row.titleEn || placeVideo.title.ar).trim(),
            en: (row.titleEn || row.title || row.titleAr || placeVideo.title.en).trim(),
          },
          place: placeVideo.place,
          poster: (row.thumbnailUrl || '').trim() || placeVideo.poster,
          src: (row.videoUrl || '').trim(),
        }));
      if (!films.length) return;
      this.placeFilms = films;
      this.placeIndex = 0;
      this.placePlaying = false;
      setTimeout(() => this.watchPlace(), 0);
    });
    this.content.advertisements().subscribe((rows) => {
      const slides = bySort(rows).map(mapAdvertisement).filter((ad): ad is HeroAd => !!ad);
      if (slides.length) {
        this.campaignAds.set(slides);
        this.heroIndex = 0;
      }
    });
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.watchDesktopHero();
    this.startHeroClock();
    this.tick();
    this.zone.runOutsideAngular(() => {
      this.timer = window.setInterval(() => {
        this.left = Math.max(0, this.left - 1);
        this.zone.run(() => this.tick());
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    this.placeWatch?.disconnect();
    this.clearHeroClock();
    if (this.desktopMq && this.desktopMqListener) {
      this.desktopMq.removeEventListener('change', this.desktopMqListener);
    }
    if (this.timer) window.clearInterval(this.timer);
  }

  private watchDesktopHero(): void {
    this.desktopMq = window.matchMedia('(min-width: 1024px)');
    this.desktop.set(this.desktopMq.matches);
    this.desktopMqListener = (event) => this.zone.run(() => this.desktop.set(event.matches));
    this.desktopMq.addEventListener('change', this.desktopMqListener);
  }

  private desktopSlides(): HeroAd[] {
    const cats = this.catalog.categories();
    const slugFor = (match: RegExp, fallback: string): string => {
      const hit = cats.find((c) => match.test(`${c.slug} ${c.name.ar} ${c.name.en}`));
      return hit?.slug || fallback;
    };
    const pickles = slugFor(/مخلل|pickle/i, 'pickles');
    const grape = slugFor(/عنب|grape/i, 'grape-leaves');
    const olives = slugFor(/زيتون|olive/i, 'olives');
    return desktopHeroAds.map((ad) => {
      const slug = ad.id.includes('grape') ? grape : ad.id.includes('olives') ? olives : pickles;
      return {
        ...ad,
        primary: ad.primary ? { ...ad.primary, to: `/listing/${slug}` } : undefined,
      };
    });
  }

  private startHeroClock(): void {
    this.clearHeroClock();
    this.heroStartedAt = Date.now();
    this.heroTimer = window.setTimeout(() => this.nextHero(), this.heroRemaining);
  }

  private clearHeroClock(): void {
    if (this.heroTimer) window.clearTimeout(this.heroTimer);
    this.heroTimer = undefined;
  }

  private syncOfferClock(ends: number[]): void {
    const next = ends.filter((time) => time > Date.now());
    if (!next.length) {
      this.offerClock = false;
      return;
    }
    const left = Math.max(0, Math.floor((Math.min(...next) - Date.now()) / 1000));
    if (left <= 0 || left > 99 * 3600) {
      this.offerClock = false;
      return;
    }
    this.offerClock = true;
    this.left = left;
    this.tick();
  }

  private tick(): void {
    if (this.left <= 0) this.offerClock = false;
    const h = Math.floor(this.left / 3600);
    const m = Math.floor((this.left % 3600) / 60);
    const s = this.left % 60;
    this.hours = String(h).padStart(2, '0');
    this.minutes = String(m).padStart(2, '0');
    this.seconds = String(s).padStart(2, '0');
  }
}

function clipText(value: string, max: number): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
