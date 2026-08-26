import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../core/models/commerce.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { RecentlyViewedService } from '../../core/services/ui.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { QtyComponent, RatingComponent } from '../../shared/components/ui-bits.component';
import { EgpPipe } from '../../shared/pipes/egp.pipe';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbsComponent,
    ProductCardComponent,
    QtyComponent,
    RatingComponent,
    EgpPipe,
    IconComponent,
  ],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  product?: Product;
  qty = 1;
  imgIndex = 0;
  zoom = false;
  tab: 'desc' | 'specs' | 'ship' | 'reviews' = 'desc';
  related: Product[] = [];
  recent: Product[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public catalog: CatalogService,
    private cart: CartService,
    private wishlist: WishlistService,
    private toast: ToastService,
    private viewed: RecentlyViewedService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const slug = p.get('slug')!;
      this.loading = true;
      setTimeout(() => {
        this.product = this.catalog.getBySlug(slug);
        this.loading = false;
        if (!this.product) return;
        this.qty = 1;
        this.imgIndex = 0;
        this.related = this.catalog.related(this.product);
        this.viewed.add(this.product.id);
        this.recent = this.viewed
          .ids()
          .filter((id) => id !== this.product!.id)
          .map((id) => this.catalog.getById(id))
          .filter((x): x is Product => !!x)
          .slice(0, 4);
      }, 280);
    });
  }

  get crumbs() {
    if (!this.product) return [];
    const cat = this.catalog.categories.find((c) => c.id === this.product!.category);
    return [
      { label: cat?.nameAr ?? '', link: `/category/${this.product.category}` },
      { label: this.product.nameAr },
    ];
  }

  wished(): boolean {
    return !!this.product && this.wishlist.has(this.product.id);
  }

  toggleWish(): void {
    if (!this.product) return;
    const on = this.wishlist.toggle(this.product.id);
    this.toast.success(on ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
  }

  add(buyNow = false): void {
    if (!this.product) return;
    const res = this.cart.add(this.product.id, this.qty);
    if (!res.ok) {
      this.toast.error(res.message);
      return;
    }
    this.toast.success(res.message, undefined, { label: 'عرض السلة', link: '/cart' });
    if (buyNow) this.router.navigate(['/checkout']);
  }

  reviews() {
    return this.product ? this.catalog.reviewsFor(this.product.id) : [];
  }
}
