import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ProductRailComponent,
  RatingComponent,
  SectionHeaderComponent,
  StockComponent,
} from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';
import { categoryBySlug } from '../data/categories';
import { byCategory, productById, products } from '../data/products';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import type { Product } from '../types';
import { IconComponent } from '../ui/icon.component';
import { CountPipe, SarPipe } from '../utils/sar.pipe';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    CrumbsComponent,
    RatingComponent,
    StockComponent,
    ProductRailComponent,
    SectionHeaderComponent,
    SarPipe,
    CountPipe,
  ],
  templateUrl: './compare.page.html',
})
export class ComparePageComponent implements OnInit, OnDestroy {
  pickerOpen = signal(false);
  pickerQuery = signal('');
  diffOnly = signal(false);
  pairMode = signal(false);
  slotA = signal(0);
  slotB = signal(1);
  private mq?: MediaQueryList;

  items = computed(() =>
    this.store.compare().map(productById).filter((p): p is Product => Boolean(p))
  );

  columns = computed(() => {
    const items = this.items();
    if (!this.pairMode() || items.length <= 2) return items;
    const a = items[this.slotA()];
    const b = items[this.slotB()];
    return [a, b].filter((p): p is Product => Boolean(p));
  });

  specLabels = computed(() => {
    const loc = this.locale.locale();
    const labels = Array.from(new Set(this.items().flatMap((p) => p.specs.map((s) => s.label[loc]))));
    if (!this.diffOnly()) return labels;
    return labels.filter((label) => this.valuesDiffer(this.items().map((p) => this.specValue(p, label) ?? '')));
  });

  cheapest = computed(() => {
    const items = this.items();
    if (items.length < 2) return null;
    return items.find((p) => this.isBestPrice(p)) ?? null;
  });

  highestRated = computed(() => {
    const items = this.items();
    if (items.length < 2) return null;
    return items.find((p) => this.isBestRating(p)) ?? null;
  });

  verdictPick = computed(() => {
    const cheap = this.cheapest();
    const rated = this.highestRated();
    if (cheap && rated && cheap.id === rated.id) return cheap;
    return null;
  });

  suggestions = computed(() => this.pool().slice(0, 8));

  candidates = computed(() => {
    const q = this.pickerQuery().trim().toLowerCase();
    const pool = this.pool();
    if (!q) return pool.slice(0, 12);
    return pool
      .filter((p) => `${p.name.ar} ${p.name.en} ${p.brand.ar} ${p.brand.en}`.toLowerCase().includes(q))
      .slice(0, 12);
  });

  constructor(public locale: LocaleService, public store: StoreService) {
    effect(() => {
      const n = this.items().length;
      if (n < 2) return;
      let a = this.slotA();
      let b = this.slotB();
      if (a > n - 1) a = 0;
      if (b > n - 1) b = a === 0 ? 1 : 0;
      if (a === b) b = a === 0 ? 1 : 0;
      if (a !== this.slotA()) this.slotA.set(a);
      if (b !== this.slotB()) this.slotB.set(b);
    });
  }

  ngOnInit(): void {
    this.mq = window.matchMedia('(max-width: 767px)');
    this.pairMode.set(this.mq.matches);
    this.mq.addEventListener('change', this.onPairMode);
  }

  ngOnDestroy(): void {
    this.mq?.removeEventListener('change', this.onPairMode);
  }

  isPaired(index: number): boolean {
    return index === this.slotA() || index === this.slotB();
  }

  selectPair(index: number): void {
    if (index === this.slotA()) return;
    if (index === this.slotB()) {
      const a = this.slotA();
      this.slotA.set(this.slotB());
      this.slotB.set(a);
      return;
    }
    this.slotB.set(index);
  }

  cycleSlot(slot: 'a' | 'b', dir: number): void {
    const n = this.items().length;
    if (n < 3) return;
    const other = slot === 'a' ? this.slotB() : this.slotA();
    let next = slot === 'a' ? this.slotA() : this.slotB();
    for (let i = 0; i < n; i++) {
      next = (next + dir + n) % n;
      if (next !== other) break;
    }
    if (slot === 'a') this.slotA.set(next);
    else this.slotB.set(next);
  }

  private onPairMode = (ev: MediaQueryListEvent): void => {
    this.pairMode.set(ev.matches);
  };

  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('compare') }];
  }

  specValue(product: Product, label: string): string | null {
    const loc = this.locale.locale();
    const match = product.specs.find((s) => s.label[loc] === label);
    return match ? this.locale.tr(match.value) : null;
  }

  categoryName(product: Product): string {
    const cat = categoryBySlug(product.category);
    return cat ? this.locale.tr(cat.name) : '';
  }

  isBestPrice(product: Product): boolean {
    const items = this.items();
    if (items.length < 2) return false;
    const min = Math.min(...items.map((p) => p.price));
    return product.price === min && this.valuesDiffer(items.map((p) => String(p.price)));
  }

  isLead(product: Product): boolean {
    const pick = this.verdictPick();
    if (pick) return pick.id === product.id;
    return this.isBestPrice(product);
  }

  shortName(product: Product): string {
    const name = this.locale.tr(product.name);
    const cut = name.split(/\s[—–-]\s/)[0]?.trim() ?? name;
    return cut.length > 28 ? `${cut.slice(0, 28)}…` : cut;
  }

  isBestRating(product: Product): boolean {
    const items = this.items();
    if (items.length < 2) return false;
    const max = Math.max(...items.map((p) => p.rating));
    return product.rating === max && this.valuesDiffer(items.map((p) => String(p.rating)));
  }

  showPriceRow(): boolean {
    return this.showFixedRow(this.items().map((p) => String(p.price)));
  }

  showRatingRow(): boolean {
    return this.showFixedRow(this.items().map((p) => String(p.rating)));
  }

  showStockRow(): boolean {
    return this.showFixedRow(this.items().map((p) => String(p.stock > 0)));
  }

  showShipRow(): boolean {
    return this.showFixedRow(this.items().map((p) => `${p.freeShipping}:${p.deliveryDays}`));
  }

  specCellClass(product: Product, label: string): string {
    const value = this.specValue(product, label);
    if (!value) return 'is-same';
    return this.specDiffers(label) ? 'is-diff' : 'is-same';
  }

  specDiffers(label: string): boolean {
    return this.valuesDiffer(this.items().map((p) => this.specValue(p, label) ?? ''));
  }

  openPicker(): void {
    if (this.items().length >= 4) return;
    this.pickerQuery.set('');
    this.pickerOpen.set(true);
  }

  pick(id: string): void {
    this.store.toggleCompare(id);
    this.pickerOpen.set(false);
  }

  addToCart(id: string): void {
    this.store.addToCart(id);
  }

  private pool(): Product[] {
    const taken = new Set(this.store.compare());
    const lead = this.items()[0];
    const source = lead ? [...byCategory(lead.category), ...products] : products;
    const seen = new Set<string>();
    return source.filter((p) => {
      if (taken.has(p.id) || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  private showFixedRow(values: string[]): boolean {
    if (!this.diffOnly() || this.items().length < 2) return true;
    return this.valuesDiffer(values);
  }

  private valuesDiffer(values: string[]): boolean {
    return new Set(values).size > 1;
  }
}
