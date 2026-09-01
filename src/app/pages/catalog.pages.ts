import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Category, Product, Subcategory } from '../types';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { CountPipe } from '../utils/sar.pipe';
import { IconComponent } from '../ui/icon.component';
import { SortSelectComponent } from '../ui/sort-select.component';
import { PagerComponent, ProductCardComponent, ProductRailComponent, SectionHeaderComponent, TrustStripComponent } from '../commerce/commerce.component';
import { FilterPanelComponent } from '../commerce/filter-panel.component';
import { CrumbsComponent } from '../commerce/crumbs.component';
import { applyFilters, emptyFilters, sortProducts, type FilterState } from '../commerce/filters';

@Component({
  selector: 'app-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, SortSelectComponent, ProductCardComponent, CrumbsComponent, CountPipe, FilterPanelComponent, PagerComponent],
  template: `
    <div class="mx-auto max-w-shell px-4 pb-6 pt-3 lg:px-10 lg:py-10">
      <app-crumbs [trail]="trail"></app-crumbs>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4 lg:mt-5">
        <div class="min-w-0">
          <h1 class="font-displayAr text-4xl leading-tight text-olive-800 lg:text-[46px]">{{ pageTitle }}</h1>
          <p class="mt-1.5 text-sm text-ink-muted">{{ visible.length | countLoc }} {{ locale.ui('results') }}</p>
        </div>
        <div class="flex w-full min-w-0 items-stretch gap-2.5 lg:w-auto">
          <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-olive-800/15 bg-white px-3.5 text-[13px] lg:hidden" (click)="openDrawer()">
            <app-icon name="sliders" [size]="16"></app-icon> {{ locale.ui('filters') }}
          </button>
          <app-sort-select class="min-w-0 flex-1 lg:flex-none" [(value)]="sort" (valueChange)="refresh()"></app-sort-select>
        </div>
      </div>
      <div class="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside class="hidden lg:block lg:self-start">
          <div class="filter-rail">
            <div class="filter-rail-body">
            <app-filter-panel
              [source]="source"
              [filters]="filters"
              [subcategories]="subs"
              [categories]="allCategories"
              [selectedCategory]="selectedCat"
              (filtersChange)="onFilters($event)"
              (categoryChange)="selectCategory($event)"
              (reset)="reset()"
            ></app-filter-panel>
            </div>
          </div>
        </aside>
        <div>
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <label class="relative min-w-0 flex-1">
              <app-icon name="search" [size]="16" class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold-400"></app-icon>
              <input
                class="h-11 w-full rounded-md border border-olive-800/15 bg-white pe-3 ps-10 text-sm text-olive-800"
                [placeholder]="locale.ui('searchPlaceholder')"
                [(ngModel)]="query"
                (ngModelChange)="refresh()"
              />
            </label>
            <span class="inline-flex h-11 shrink-0 items-center rounded-md border border-olive-800/10 bg-white px-3.5 text-[13px] font-medium text-olive-800">
              {{ visible.length | countLoc }} {{ locale.isAr() ? 'منتج' : 'products' }}
            </span>
          </div>
          <div *ngIf="loading" class="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
            <div *ngFor="let i of skeletons" class="aspect-[4/5] animate-pulse rounded-lg bg-sand-100"></div>
          </div>
          <div *ngIf="!loading && !visible.length" class="rounded-xl border border-olive-800/10 bg-white p-10 text-center">
            <p class="font-medium text-olive-800">{{ locale.ui('noResults') }}</p>
            <button type="button" class="mt-4 text-sm text-olive-700" (click)="reset()">{{ locale.ui('clearAll') }}</button>
          </div>
          <div id="listing-results" *ngIf="!loading && visible.length" class="grid scroll-mt-24 grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5 md:gap-y-9 lg:scroll-mt-32 xl:grid-cols-4">
            <app-product-card *ngFor="let p of paged" [product]="p"></app-product-card>
          </div>
          <app-pager [page]="page" [pageCount]="pageCount" (pageChange)="goPage($event)"></app-pager>
        </div>
      </div>
    </div>
    <div *ngIf="drawer" class="filter-sheet-scrim lg:hidden" (click)="closeDrawer()"></div>
    <aside *ngIf="drawer" class="filter-sheet lg:hidden" role="dialog" [attr.aria-label]="locale.ui('filters')">
      <div class="filter-sheet__grab" aria-hidden="true"></div>
      <header class="filter-sheet__head">
        <h2>{{ locale.ui('filters') }}</h2>
        <div class="filter-sheet__head-actions">
          <button type="button" class="filter-sheet__clear" (click)="reset()">{{ locale.ui('clearAll') }}</button>
          <button type="button" class="filter-sheet__close" [attr.aria-label]="locale.ui('close')" (click)="closeDrawer()">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </div>
      </header>
      <div class="filter-sheet__body">
        <app-filter-panel
          [compact]="true"
          [source]="source"
          [filters]="filters"
          [subcategories]="subs"
          [categories]="allCategories"
          [selectedCategory]="selectedCat"
          (filtersChange)="onFilters($event)"
          (categoryChange)="selectCategory($event)"
          (reset)="reset()"
        ></app-filter-panel>
      </div>
      <footer class="filter-sheet__foot">
        <button type="button" class="filter-sheet__apply" (click)="closeDrawer()">{{ locale.ui('apply') }} · {{ visible.length | countLoc }} {{ locale.ui('results') }}</button>
      </footer>
    </aside>
  `,
})
export class ListingComponent implements OnInit, OnDestroy {
  slug = 'all';
  category: Category | null = null;
  source: Product[] = [];
  filters: FilterState = emptyFilters(1000);
  sort = 'popular';
  query = '';
  visible: Product[] = [];
  page = 1;
  pageSize = 12;
  loading = true;
  drawer = false;
  skeletons = [1, 2, 3, 4, 5, 6, 7, 8];
  trail: { label: string; to?: string }[] = [];
  subs: Subcategory[] = [];

  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute, private router: Router) {}

  get allCategories() {
    return this.catalog.categories();
  }

  get selectedCat(): string | null {
    return this.slug === 'all' ? null : this.slug;
  }

  get pageTitle(): string {
    if (this.category) return this.locale.tr(this.category.name);
    return this.locale.ui('allProducts');
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => this.boot());
    this.route.queryParamMap.subscribe((q) => {
      const sub = q.get('sub');
      if (this.filters.sub !== sub) {
        this.filters = { ...this.filters, sub };
        this.refresh();
      }
    });
  }

  boot(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || 'all';
    this.category = this.slug === 'all' ? null : this.catalog.categoryBySlug(this.slug) ?? null;
    this.source = this.slug === 'all' ? this.catalog.all() : this.catalog.byCategory(this.slug);
    const ceiling = Math.max(...this.source.map((p) => p.price), 100);
    const prev = this.filters;
    this.filters = {
      ...emptyFilters(ceiling),
      inStockOnly: prev.inStockOnly,
      onSaleOnly: prev.onSaleOnly,
      newOnly: prev.newOnly,
      minRating: prev.minRating,
      sub: this.route.snapshot.queryParamMap.get('sub'),
    };
    this.subs = this.category?.subcategories ?? [];
    this.trail = [
      { label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' },
      ...(this.category
        ? [{ label: this.locale.tr(this.category.name), to: `/category/${this.category.slug}` }, { label: this.locale.ui('shopAll') }]
        : [{ label: this.locale.ui('allProducts') }]),
    ];
    this.loading = true;
    this.refresh();
    window.setTimeout(() => (this.loading = false), 400);
  }

  refresh(): void {
    const q = this.query.trim().toLowerCase();
    let list = applyFilters(this.source, this.filters);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.ar.includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          p.brand.ar.includes(q) ||
          p.brand.en.toLowerCase().includes(q)
      );
    }
    this.visible = sortProducts(list, this.sort);
    this.page = 1;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  get paged(): Product[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  goPage(n: number): void {
    this.page = n;
    document.getElementById('listing-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onFilters(next: FilterState): void {
    const subChanged = next.sub !== this.filters.sub;
    this.filters = next;
    if (subChanged) {
      this.router.navigate([], { queryParams: next.sub ? { sub: next.sub } : {}, queryParamsHandling: '' });
    }
    this.refresh();
  }

  selectCategory(slug: string | null): void {
    this.query = '';
    this.closeDrawer();
    this.router.navigate(['/listing', slug || 'all']);
  }

  openDrawer(): void {
    this.drawer = true;
    document.body.style.overflow = 'hidden';
  }

  closeDrawer(): void {
    this.drawer = false;
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  reset(): void {
    const ceiling = Math.max(...this.source.map((p) => p.price), 100);
    this.filters = emptyFilters(ceiling);
    this.query = '';
    this.router.navigate(['/listing', 'all']);
    this.refresh();
  }
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ProductCardComponent, ProductRailComponent, SectionHeaderComponent, TrustStripComponent, CrumbsComponent, CountPipe],
  template: `
    <div *ngIf="category">
      <section class="relative h-[380px] overflow-hidden lg:h-[460px]">
        <img [src]="category.image" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-olive-900/58"></div>
        <div class="absolute inset-0 flex items-end">
          <div class="mx-auto w-full max-w-shell px-4 pb-10 lg:px-10 lg:pb-14">
            <app-crumbs [trail]="trail"></app-crumbs>
            <p class="mt-5 text-2xs uppercase tracking-[0.28em] text-gold-300">{{ totalCount | countLoc }} {{ locale.isAr() ? 'منتج مختار' : 'curated products' }}</p>
            <h1 class="mt-3 font-displayAr text-5xl leading-[1.05] text-sand-50 lg:text-[64px]">{{ locale.tr(category.name) }}</h1>
            <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-sand-100/80">{{ locale.tr(category.story) }}</p>
            <a [routerLink]="['/listing', category.slug]" class="mt-8 inline-flex h-12 items-center gap-2.5 rounded-md bg-gold-400 px-6 text-sm font-medium text-olive-900">
              {{ locale.ui('shopAll') }} <app-icon name="arrow-up-right" [size]="16"></app-icon>
            </a>
          </div>
        </div>
      </section>
      <section class="mx-auto max-w-shell px-4 py-8 lg:px-10 lg:py-14">
        <app-section-header [title]="locale.isAr() ? 'تسوق حسب القسم' : 'Shop by department'" [subtitle]="locale.tr(category.tagline)"></app-section-header>
        <div class="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          <a *ngFor="let sub of category.subcategories" [routerLink]="['/listing', category.slug]" [queryParams]="{ sub: sub.slug }" class="w-[150px] shrink-0 rounded-lg border border-olive-800/10 bg-white p-5 text-center hover:border-gold-400/50 lg:w-auto">
            <span class="mx-auto block h-16 w-16 overflow-hidden rounded-full bg-sand-100"><img [src]="category.image" class="h-full w-full object-cover" alt="" /></span>
            <span class="mt-3.5 block text-[13px] font-medium text-olive-800">{{ locale.tr(sub.name) }}</span>
            <span class="mt-1 text-xs text-ink-muted">{{ sub.count | countLoc }}</span>
          </a>
        </div>
      </section>
      <section *ngIf="deals.length" class="grain relative bg-olive-800 py-8 lg:py-14">
        <div class="mx-auto max-w-shell px-4 lg:px-10">
          <h2 class="mb-5 font-displayAr text-3xl text-sand-50 lg:mb-8">{{ locale.isAr() ? 'عروض القسم' : 'Highlighted offers' }}</h2>
          <div class="rounded-xl bg-sand-50 p-4"><app-product-rail [products]="deals"></app-product-rail></div>
        </div>
      </section>
      <section class="mx-auto max-w-shell px-4 py-8 lg:px-10 lg:py-16">
        <app-section-header [title]="locale.isAr() ? 'منتجات مميزة' : 'Featured products'" [linkTo]="'/listing/' + category.slug" [linkLabel]="locale.ui('viewAll')"></app-section-header>
        <div class="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5 md:gap-y-9 xl:grid-cols-4">
          <app-product-card *ngFor="let p of featured" [product]="p"></app-product-card>
        </div>
      </section>
      <section class="border-y border-olive-800/10 bg-sand-100/50 py-8 lg:py-12"><div class="mx-auto max-w-shell px-4 lg:px-10"><app-trust-strip></app-trust-strip></div></section>
      <section class="mx-auto max-w-shell px-4 pb-5 pt-8 lg:px-10 lg:pb-8 lg:pt-16">
        <app-section-header [title]="locale.isAr() ? 'تابع التسوق' : 'Continue exploring'"></app-section-header>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a *ngFor="let s of siblings" [routerLink]="['/category', s.slug]" class="group relative flex h-40 items-end overflow-hidden rounded-lg p-5">
            <img [src]="s.image" class="absolute inset-0 h-full w-full object-cover group-hover:scale-105" alt="" />
            <span class="absolute inset-0 bg-olive-900/55"></span>
            <span class="relative font-displayAr text-xl text-sand-50">{{ locale.tr(s.name) }}</span>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class CategoryComponent implements OnInit {
  category: Category | null = null;
  items: Product[] = [];
  deals: Product[] = [];
  featured: Product[] = [];
  totalCount = 0;
  trail: { label: string; to?: string }[] = [];
  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute, private router: Router) {}
  get siblings() {
    return this.catalog.categories().filter((c) => c.slug !== this.category?.slug);
  }
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || '';
      this.category = this.catalog.categoryBySlug(slug) ?? null;
      if (!this.category) {
        this.router.navigateByUrl('/not-found', { skipLocationChange: true });
        return;
      }
      this.items = this.catalog.byCategory(slug);
      this.deals = this.items.filter((p) => !!p.compareAt);
      this.featured = this.items.slice(0, 8);
      this.totalCount = this.category.subcategories.reduce((s, x) => s + x.count, 0) || this.items.length;
      this.trail = [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.tr(this.category.name) }];
    });
  }
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductRailComponent, SectionHeaderComponent, CountPipe],
  template: `
    <div class="mx-auto max-w-shell px-4 pb-6 pt-3 lg:px-10 lg:py-9">
      <p class="text-2xs uppercase tracking-[0.2em] text-gold-400">{{ locale.ui('search') }}</p>
      <h1 class="mt-3 font-displayAr text-4xl text-olive-800">“{{ query }}”</h1>
      <p class="mt-2 text-sm text-ink-muted">{{ results.length | countLoc }} {{ locale.ui('results') }}</p>
      <div class="mt-7 flex flex-wrap gap-2">
        <button type="button" class="h-9 rounded-full border px-3.5 text-[13px]" [class.bg-olive-800]="!cat" [class.text-sand-50]="!cat" (click)="cat = null; run()">{{ locale.ui('allCategories') }}</button>
        <button *ngFor="let c of categories" type="button" class="h-9 rounded-full border px-3.5 text-[13px]" [class.bg-olive-800]="cat === c.slug" [class.text-sand-50]="cat === c.slug" (click)="cat = c.slug; run()">{{ locale.tr(c.name) }}</button>
      </div>
      <div *ngIf="results.length" class="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        <app-product-card *ngFor="let p of results" [product]="p"></app-product-card>
      </div>
      <div *ngIf="!results.length" class="mt-10 text-center">
        <p class="font-medium">{{ locale.ui('noResults') }}</p>
        <app-section-header class="mt-10 block" [title]="locale.ui('bestSellers')"></app-section-header>
        <app-product-rail [products]="fallback"></app-product-rail>
      </div>
    </div>
  `,
})
export class SearchComponent implements OnInit {
  query = '';
  cat: string | null = null;
  results: Product[] = [];
  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute) {}
  get categories() {
    return this.catalog.categories();
  }
  get fallback() {
    return this.catalog.all().slice(0, 6);
  }
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      this.query = q.get('q') || '';
      this.run();
    });
  }
  run(): void {
    const q = this.query.trim();
    let base = q ? this.catalog.search(q) : this.catalog.all();
    if (this.cat) base = base.filter((p) => p.category === this.cat);
    this.results = sortProducts(base, 'popular');
  }
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, ProductCardComponent, CrumbsComponent, CountPipe, FilterPanelComponent, SortSelectComponent, PagerComponent],
  template: `
    <section class="relative h-[300px] overflow-hidden lg:h-[360px]">
      <img [src]="hero" alt="" class="h-full w-full object-cover" />
      <div class="absolute inset-0 bg-olive-900/60"></div>
      <div class="absolute inset-0 flex items-center">
        <div class="mx-auto w-full max-w-shell px-4 lg:px-10">
          <app-crumbs [trail]="trail"></app-crumbs>
          <p class="mt-5 inline-flex items-center gap-2 text-2xs uppercase tracking-[0.26em] text-gold-300">
            <app-icon *ngIf="!isNew" name="zap" [size]="14"></app-icon>
            {{ eyebrow }}
          </p>
          <h1 class="mt-3 font-displayAr text-5xl text-sand-50 lg:text-[60px]">{{ title }}</h1>
        </div>
      </div>
    </section>
    <div class="mx-auto max-w-shell px-4 py-5 lg:px-10 lg:py-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <p class="text-sm text-ink-muted">{{ visible.length | countLoc }} {{ locale.ui('results') }}</p>
        <div class="flex w-full min-w-0 items-stretch gap-2.5 lg:w-auto">
          <button type="button" class="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-olive-800/15 bg-white px-3.5 text-[13px] lg:hidden" (click)="openDrawer()">
            <app-icon name="sliders" [size]="16"></app-icon> {{ locale.ui('filters') }}
          </button>
          <app-sort-select class="min-w-0 flex-1 lg:flex-none" [(value)]="sort" (valueChange)="refresh()"></app-sort-select>
        </div>
      </div>
      <div class="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside class="hidden lg:block lg:self-start">
          <div class="filter-rail">
            <div class="filter-rail-body">
            <app-filter-panel
              [source]="panelSource"
              [filters]="filters"
              [subcategories]="subs"
              [categories]="allCategories"
              [selectedCategory]="selectedCat"
              (filtersChange)="onFilters($event)"
              (categoryChange)="selectCategory($event)"
              (reset)="reset()"
            ></app-filter-panel>
            </div>
          </div>
        </aside>
        <div>
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <label class="relative min-w-0 flex-1">
              <app-icon name="search" [size]="16" class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold-400"></app-icon>
              <input
                class="h-11 w-full rounded-md border border-olive-800/15 bg-white pe-3 ps-10 text-sm text-olive-800"
                [placeholder]="locale.ui('searchPlaceholder')"
                [(ngModel)]="query"
                (ngModelChange)="refresh()"
              />
            </label>
            <span class="inline-flex h-11 shrink-0 items-center rounded-md border border-olive-800/10 bg-white px-3.5 text-[13px] font-medium text-olive-800">
              {{ visible.length | countLoc }} {{ locale.isAr() ? 'منتج' : 'products' }}
            </span>
          </div>
          <div *ngIf="!visible.length" class="rounded-xl border border-olive-800/10 bg-white p-10 text-center">
            <p class="font-medium text-olive-800">{{ locale.ui('noResults') }}</p>
            <button type="button" class="mt-4 text-sm text-olive-700" (click)="reset()">{{ locale.ui('clearAll') }}</button>
          </div>
          <div id="offers-results" *ngIf="visible.length" class="grid scroll-mt-24 grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5 md:gap-y-9 lg:scroll-mt-32 xl:grid-cols-4">
            <app-product-card *ngFor="let p of paged" [product]="p"></app-product-card>
          </div>
          <app-pager [page]="page" [pageCount]="pageCount" (pageChange)="goPage($event)"></app-pager>
        </div>
      </div>
    </div>
    <div *ngIf="drawer" class="filter-sheet-scrim lg:hidden" (click)="closeDrawer()"></div>
    <aside *ngIf="drawer" class="filter-sheet lg:hidden" role="dialog" [attr.aria-label]="locale.ui('filters')">
      <div class="filter-sheet__grab" aria-hidden="true"></div>
      <header class="filter-sheet__head">
        <h2>{{ locale.ui('filters') }}</h2>
        <div class="filter-sheet__head-actions">
          <button type="button" class="filter-sheet__clear" (click)="reset()">{{ locale.ui('clearAll') }}</button>
          <button type="button" class="filter-sheet__close" [attr.aria-label]="locale.ui('close')" (click)="closeDrawer()">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </div>
      </header>
      <div class="filter-sheet__body">
        <app-filter-panel
          [compact]="true"
          [source]="panelSource"
          [filters]="filters"
          [subcategories]="subs"
          [categories]="allCategories"
          [selectedCategory]="selectedCat"
          (filtersChange)="onFilters($event)"
          (categoryChange)="selectCategory($event)"
          (reset)="reset()"
        ></app-filter-panel>
      </div>
      <footer class="filter-sheet__foot">
        <button type="button" class="filter-sheet__apply" (click)="closeDrawer()">{{ locale.ui('apply') }} · {{ visible.length | countLoc }} {{ locale.ui('results') }}</button>
      </footer>
    </aside>
  `,
})
export class OffersComponent implements OnInit, OnDestroy {
  isNew = false;
  selectedCat: string | null = null;
  filters: FilterState = emptyFilters(1000);
  sort = 'popular';
  query = '';
  visible: Product[] = [];
  page = 1;
  pageSize = 12;
  drawer = false;
  subs: Subcategory[] = [];

  constructor(public locale: LocaleService, public catalog: CatalogService, private route: ActivatedRoute) {}

  get allCategories() {
    return this.catalog.categories();
  }

  get pool(): Product[] {
    return this.isNew ? this.catalog.withBadge('new') : this.catalog.all().filter((p) => !!p.compareAt);
  }

  get panelSource(): Product[] {
    return this.selectedCat ? this.pool.filter((p) => p.category === this.selectedCat) : this.pool;
  }

  get hero() {
    return this.isNew ? images.campaign : images.cat['olive-oil'];
  }
  get title() {
    return this.isNew ? this.locale.ui('newArrivals') : this.locale.ui('offers');
  }
  get eyebrow() {
    return this.isNew
      ? this.locale.isAr()
        ? 'إضافات هذا الأسبوع'
        : 'Added this week'
      : this.locale.isAr()
        ? 'خصومات حقيقية'
        : 'Genuine reductions';
  }
  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.title }];
  }

  ngOnInit(): void {
    this.route.url.subscribe((seg) => {
      this.isNew = seg[0]?.path === 'new';
      this.selectedCat = null;
      this.subs = [];
      this.query = '';
      this.filters = emptyFilters(Math.max(...this.pool.map((p) => p.price), 100));
      this.refresh();
    });
  }

  refresh(): void {
    const q = this.query.trim().toLowerCase();
    let list = applyFilters(this.panelSource, this.filters);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.ar.includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          p.brand.ar.includes(q) ||
          p.brand.en.toLowerCase().includes(q)
      );
    }
    this.visible = sortProducts(list, this.sort);
    this.page = 1;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.visible.length / this.pageSize));
  }

  get paged(): Product[] {
    const start = (this.page - 1) * this.pageSize;
    return this.visible.slice(start, start + this.pageSize);
  }

  goPage(n: number): void {
    this.page = n;
    document.getElementById('offers-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onFilters(next: FilterState): void {
    this.filters = next;
    this.refresh();
  }

  selectCategory(slug: string | null): void {
    this.selectedCat = slug;
    this.filters = { ...this.filters, sub: null };
    this.subs = slug ? this.catalog.categoryBySlug(slug)?.subcategories ?? [] : [];
    this.refresh();
  }

  reset(): void {
    this.selectedCat = null;
    this.subs = [];
    this.query = '';
    this.filters = emptyFilters(Math.max(...this.pool.map((p) => p.price), 100));
    this.refresh();
  }

  openDrawer(): void {
    this.drawer = true;
    document.body.style.overflow = 'hidden';
  }

  closeDrawer(): void {
    this.drawer = false;
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
