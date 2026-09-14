import { CommonModule } from '@angular/common';
import { Component, HostListener, NgZone, OnDestroy, OnInit, computed, effect, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HeroAd, Category } from '../types';
import { brandPillars } from '../data/content';
import { HERO_AD_MS, desktopHeroAds, heroAds } from '../data/hero-ads';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { CountPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
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
  pillars = brandPillars;
  hours = '06';
  minutes = '42';
  seconds = '18';
  private timer?: number;
  private left = 6 * 3600 + 42 * 60 + 18;
  private heroTimer?: number;
  private heroStartedAt = 0;
  private heroRemaining = HERO_AD_MS;
  private reduceMotion = false;
  private readonly desktop = signal(false);
  private desktopMq?: MediaQueryList;
  private desktopMqListener?: (event: MediaQueryListEvent) => void;

  constructor(
    public locale: LocaleService,
    public catalog: CatalogService,
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

  ngOnInit(): void {
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
        primary: { ...ad.primary, to: `/listing/${slug}` },
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

  private tick(): void {
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
