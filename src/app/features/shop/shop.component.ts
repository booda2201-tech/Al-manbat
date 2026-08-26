import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogQuery, CategoryId, Product, SortOption } from '../../core/models/commerce.models';
import { CatalogService, SORT_LABELS } from '../../core/services/catalog.service';
import { UiService } from '../../core/services/ui.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { ProductCardComponent, ProductSkeletonComponent } from '../../shared/components/product-card.component';
import { EmptyStateComponent } from '../../shared/components/ui-bits.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    ProductCardComponent,
    ProductSkeletonComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit {
  loading = true;
  error = false;
  items: Product[] = [];
  total = 0;
  page = 1;
  pageSize = 9;
  pages: number[] = [];
  title = 'كل المنتجات';
  description = 'تشكيلة المنبت الكاملة في مكان واحد.';
  crumbs = [{ label: 'كل المنتجات' }];
  sort: SortOption = 'relevance';
  sortLabels = SORT_LABELS;
  sortKeys = Object.keys(SORT_LABELS) as SortOption[];
  brands;
  selectedBrands: string[] = [];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability: CatalogQuery['availability'] = 'all';
  offerOnly = false;
  category?: CategoryId | 'offers' | 'best-sellers';
  search = '';
  priceBounds = { min: 0, max: 3000 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public catalog: CatalogService,
    public ui: UiService
  ) {
    this.brands = catalog.getBrands();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => this.syncFromRoute());
    this.route.queryParamMap.subscribe(() => this.syncFromRoute());
  }

  private syncFromRoute(): void {
    const slug = this.route.snapshot.paramMap.get('slug') as CategoryId | 'offers' | 'best-sellers' | null;
    const path = this.route.snapshot.routeConfig?.path;
    this.search = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.sort = (this.route.snapshot.queryParamMap.get('sort') as SortOption) || 'relevance';
    this.page = Number(this.route.snapshot.queryParamMap.get('page') || 1);
    this.minPrice = num(this.route.snapshot.queryParamMap.get('min'));
    this.maxPrice = num(this.route.snapshot.queryParamMap.get('max'));
    this.minRating = num(this.route.snapshot.queryParamMap.get('rating'));
    this.availability = (this.route.snapshot.queryParamMap.get('avail') as CatalogQuery['availability']) || 'all';
    this.offerOnly = this.route.snapshot.queryParamMap.get('offer') === '1';
    this.selectedBrands = (this.route.snapshot.queryParamMap.get('brand') || '').split(',').filter(Boolean);

    if (path === 'search') {
      this.category = undefined;
      this.title = this.search ? `نتائج البحث عن «${this.search}»` : 'البحث';
      this.description = 'ابحث في كل أقسام المنبت دفعة واحدة.';
      this.crumbs = [{ label: 'بحث' }];
    } else if (slug) {
      this.category = slug;
      const map: Record<string, { t: string; d: string }> = {
        groceries: { t: 'مواد غذائية', d: 'زيوت وعسل وتمور ومؤن مختارة للمطبخ.' },
        beauty: { t: 'تجميل وعناية', d: 'عناية بالبشرة والشعر والجسم بمكوّنات واضحة.' },
        appliances: { t: 'أجهزة كهربائية', d: 'أجهزة عملية للمطبخ والمنزل.' },
        electronics: { t: 'إلكترونيات', d: 'سماعات وإكسسوارات وإضاءة للاستخدام اليومي.' },
        offers: { t: 'العروض', d: 'منتجات بسعر مخفّض ضمن تشكيلة المنبت.' },
        'best-sellers': { t: 'الأكثر مبيعاً', d: 'اختيارات يعتمد عليها زبائن المنبت.' },
      };
      const m = map[slug] ?? { t: 'المنتجات', d: '' };
      this.title = m.t;
      this.description = m.d;
      this.crumbs = [{ label: m.t }];
    } else {
      this.category = undefined;
      this.title = 'كل المنتجات';
      this.description = 'تصفح التشكيلة الكاملة مع فلاتر واضحة وترتيب مرن.';
      this.crumbs = [{ label: 'كل المنتجات' }];
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.catalog
      .query({
        category: this.category,
        search: this.search,
        brands: this.selectedBrands,
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        minRating: this.minRating,
        availability: this.availability,
        offerOnly: this.offerOnly,
        sort: this.sort,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.items = res.items;
          this.total = res.total;
          this.priceBounds = { min: res.minPrice, max: res.maxPrice };
          const n = Math.ceil(res.total / res.pageSize) || 1;
          this.pages = Array.from({ length: n }, (_, i) => i + 1);
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }

  apply(): void {
    this.page = 1;
    this.ui.filtersOpen.set(false);
    this.writeQuery();
  }

  clear(): void {
    this.selectedBrands = [];
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.minRating = undefined;
    this.availability = 'all';
    this.offerOnly = false;
    this.sort = 'relevance';
    this.apply();
  }

  toggleBrand(id: string, checked: boolean): void {
    this.selectedBrands = checked
      ? [...this.selectedBrands, id]
      : this.selectedBrands.filter((b) => b !== id);
  }

  removeChip(kind: string, value?: string): void {
    if (kind === 'brand' && value) this.selectedBrands = this.selectedBrands.filter((b) => b !== value);
    if (kind === 'offer') this.offerOnly = false;
    if (kind === 'stock') this.availability = 'all';
    if (kind === 'rating') this.minRating = undefined;
    this.apply();
  }

  goPage(p: number): void {
    this.page = p;
    this.writeQuery();
  }

  private writeQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.search || null,
        sort: this.sort !== 'relevance' ? this.sort : null,
        page: this.page > 1 ? this.page : null,
        min: this.minPrice ?? null,
        max: this.maxPrice ?? null,
        rating: this.minRating ?? null,
        avail: this.availability !== 'all' ? this.availability : null,
        offer: this.offerOnly ? '1' : null,
        brand: this.selectedBrands.join(',') || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  get chips() {
    const list: { kind: string; label: string; value?: string }[] = [];
    this.selectedBrands.forEach((b) =>
      list.push({ kind: 'brand', value: b, label: this.catalog.brandName(b) })
    );
    if (this.offerOnly) list.push({ kind: 'offer', label: 'عروض فقط' });
    if (this.availability === 'in_stock') list.push({ kind: 'stock', label: 'متوفر' });
    if (this.minRating) list.push({ kind: 'rating', label: `${this.minRating}+ نجوم` });
    return list;
  }
}

function num(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
