import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Bilingual, Category, Product, Subcategory } from '../types';
import { LocaleService } from '../services/locale.service';
import { IconComponent } from '../ui/icon.component';
import { SarPipe } from '../utils/sar.pipe';
import type { FilterState } from './filters';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, SarPipe],
  template: `
    <div class="filter-panel" [class.is-sheet]="compact">
      <div *ngIf="!compact" class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-[0.14em] text-olive-800">{{ locale.ui('filters') }}</h2>
        <button type="button" class="text-xs text-ink-muted underline-offset-4 hover:text-clay-400 hover:underline" (click)="reset.emit()">
          {{ locale.ui('clearAll') }}
        </button>
      </div>

      <section>
        <h3 class="filter-panel__h">{{ locale.isAr() ? 'الأقسام' : 'Departments' }}</h3>
        <div class="filter-chips">
          <button type="button" class="filter-chip" [class.is-on]="!selectedCategory" (click)="selectCategory(null)">
            {{ locale.ui('allProducts') }}
          </button>
          <button *ngFor="let c of categories" type="button" class="filter-chip" [class.is-on]="selectedCategory === c.slug" (click)="selectCategory(c.slug)">
            {{ locale.tr(c.name) }}
          </button>
        </div>
        <div *ngIf="selectedCategory && subcategories.length" class="filter-chips mt-2.5">
          <button type="button" class="filter-chip is-ghost" [class.is-on]="!filters.sub" (click)="setSub(null)">{{ locale.ui('allCategories') }}</button>
          <button *ngFor="let s of subcategories" type="button" class="filter-chip is-ghost" [class.is-on]="filters.sub === s.slug" (click)="setSub(s.slug)">
            {{ locale.tr(s.name) }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="filter-panel__h">{{ locale.ui('price') }}</h3>
        <div class="filter-price">
          <input
            type="range"
            class="filter-range"
            min="0"
            [max]="ceiling"
            step="10"
            [value]="filters.maxPrice"
            [attr.aria-label]="locale.ui('price')"
            (input)="patch({ maxPrice: +$any($event.target).value })"
          />
          <div class="filter-price__meta">
            <span>{{ 0 | sar }}</span>
            <span>{{ filters.maxPrice | sar }}</span>
          </div>
        </div>
      </section>

      <section *ngIf="brands.length">
        <h3 class="filter-panel__h">{{ locale.ui('brand') }}</h3>
        <div class="filter-chips">
          <button
            *ngFor="let b of brands"
            type="button"
            class="filter-chip"
            [class.is-on]="filters.brands.includes(b.en)"
            (click)="toggleBrand(b.en)"
          >
            {{ locale.tr(b) }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="filter-panel__h">{{ locale.ui('rating') }}</h3>
        <div class="filter-rates">
          <button
            *ngFor="let min of ratingOptions"
            type="button"
            class="filter-rate"
            [class.is-on]="filters.minRating === min"
            (click)="patch({ minRating: min })"
          >
            <span class="flex gap-0.5" aria-hidden="true">
              <app-icon
                *ngFor="let i of stars"
                name="star"
                [size]="15"
                [filled]="i <= (min || 0)"
                [ngClass]="i <= (min || 0) ? 'text-gold-400' : 'text-sand-300'"
              ></app-icon>
            </span>
            <span>{{ min === 0 ? (locale.isAr() ? 'الكل' : 'All') : min + '+' }}</span>
          </button>
        </div>
      </section>

      <section>
        <h3 class="filter-panel__h">{{ locale.ui('extraFilters') }}</h3>
        <div class="filter-chips">
          <button type="button" class="filter-chip" [class.is-on]="filters.newOnly" (click)="patch({ newOnly: !filters.newOnly })">{{ locale.ui('newOnly') }}</button>
          <button type="button" class="filter-chip" [class.is-on]="filters.inStockOnly" (click)="patch({ inStockOnly: !filters.inStockOnly })">{{ locale.ui('inStockOnly') }}</button>
          <button type="button" class="filter-chip" [class.is-on]="filters.onSaleOnly" (click)="patch({ onSaleOnly: !filters.onSaleOnly })">{{ locale.ui('onSale') }}</button>
        </div>
      </section>
    </div>
  `,
})
export class FilterPanelComponent {
  @Input() source: Product[] = [];
  @Input() filters!: FilterState;
  @Input() subcategories: Subcategory[] = [];
  @Input() categories: Category[] = [];
  @Input() selectedCategory: string | null = null;
  @Input() compact = false;
  @Output() filtersChange = new EventEmitter<FilterState>();
  @Output() reset = new EventEmitter<void>();
  @Output() categoryChange = new EventEmitter<string | null>();

  stars = [1, 2, 3, 4, 5];
  ratingOptions = [4, 3, 0];

  constructor(public locale: LocaleService) {}

  get ceiling(): number {
    return Math.max(...this.source.map((p) => p.price), 100);
  }

  get brands(): Bilingual[] {
    const seen = new Set<string>();
    const list: Bilingual[] = [];
    for (const p of this.source) {
      if (seen.has(p.brand.en)) continue;
      seen.add(p.brand.en);
      list.push(p.brand);
    }
    return list;
  }

  patch(partial: Partial<FilterState>): void {
    this.filtersChange.emit({ ...this.filters, ...partial });
  }

  setSub(sub: string | null): void {
    this.patch({ sub });
  }

  selectCategory(slug: string | null): void {
    this.categoryChange.emit(slug);
  }

  toggleBrand(en: string): void {
    const brands = this.filters.brands.includes(en)
      ? this.filters.brands.filter((b) => b !== en)
      : [...this.filters.brands, en];
    this.patch({ brands });
  }
}
