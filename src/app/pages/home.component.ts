import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CategorySlug, HeroAd } from '../types';
import { brandPillars } from '../data/content';
import { categories, categoryBySlug } from '../data/categories';
import { HERO_AD_MS, heroAds } from '../data/hero-ads';
import { images } from '../data/images';
import { byCategory, products, withBadge } from '../data/products';
import { LocaleService } from '../services/locale.service';
import { CountPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { ScrollOpenDirective } from '../ui/scroll-open.directive';
import {
  ProductCardComponent,
  ProductRailComponent,
  SectionHeaderComponent,
  TrustStripComponent,
} from '../commerce/commerce.component';

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
  categories = categories;
  images = images;
  ads = heroAds;
  heroIndex = 0;
  heroPaused = false;
  pillars = brandPillars;
  spotlights: Array<{ slug: CategorySlug; dark: boolean; flip: boolean }> = [
    { slug: 'olive-oil', dark: false, flip: false },
    { slug: 'pickles', dark: true, flip: true },
    { slug: 'table-olives', dark: false, flip: false },
  ];
  hours = '06';
  minutes = '42';
  seconds = '18';
  private timer?: number;
  private left = 6 * 3600 + 42 * 60 + 18;
  private heroTimer?: number;
  private heroStartedAt = 0;
  private heroRemaining = HERO_AD_MS;
  private reduceMotion = false;

  constructor(public locale: LocaleService) {}

  get currentAd(): HeroAd {
    return this.ads[this.heroIndex];
  }

  get nextAd(): HeroAd {
    return this.ads[(this.heroIndex + 1) % this.ads.length];
  }

  get heroCount(): string {
    return String(this.ads.length).padStart(2, '0');
  }
  get lead() {
    return this.categories[0];
  }
  get rest() {
    return this.categories.slice(1);
  }
  get bestSellers() {
    const list = withBadge('bestseller');
    return list.length ? list : products.slice(0, 6);
  }
  get newArrivals() {
    const list = withBadge('new');
    return list.length ? list : products.slice(6, 12);
  }
  get deals() {
    return products.filter((p) => p.badges.includes('deal')).slice(0, 8);
  }

  catCount(cat: typeof categories[0]): number {
    return cat.subcategories.reduce((s, x) => s + x.count, 0);
  }

  spotlight(slug: CategorySlug) {
    const category = categoryBySlug(slug)!;
    return { category, items: byCategory(slug).slice(0, 3) };
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
      ? 'bg-gradient-to-l from-olive-900/95 via-olive-900/72 to-olive-900/15'
      : 'bg-gradient-to-r from-olive-900/95 via-olive-900/72 to-olive-900/15';
  }

  heroImgClass(active: boolean): string {
    const base =
      'absolute inset-0 h-full w-full object-cover object-[center_30%] transition-opacity duration-[900ms] ease-premium lg:object-center';
    if (!active) return `${base} opacity-0`;
    return this.reduceMotion ? `${base} opacity-100` : `${base} opacity-100 hero-ken`;
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

  goToHero(index: number): void {
    const next = (index + this.ads.length) % this.ads.length;
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
    this.startHeroClock();
    this.tick();
    this.timer = window.setInterval(() => {
      this.left = Math.max(0, this.left - 1);
      this.tick();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearHeroClock();
    if (this.timer) window.clearInterval(this.timer);
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
