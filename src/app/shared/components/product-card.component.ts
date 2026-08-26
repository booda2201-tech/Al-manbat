import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/commerce.models';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { UiService } from '../../core/services/ui.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { EgpPipe } from '../pipes/egp.pipe';
import { IconComponent } from './icon.component';
import { RatingComponent } from './ui-bits.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe, IconComponent, RatingComponent],
  template: `
    <article class="card" *ngIf="product">
      <div class="media">
        <a [routerLink]="['/product', product.slug]">
          <img [src]="product.images[0]" [alt]="product.nameAr" width="400" height="500" loading="lazy" />
        </a>
        <span class="chip disc" *ngIf="product.discountPercent">خصم {{ product.discountPercent }}٪</span>
        <button class="wish" type="button" (click)="toggleWish()" [attr.aria-label]="wishLabel">
          <app-icon name="heart" [size]="18"></app-icon>
        </button>
        <div class="hover">
          <button class="btn btn-outline btn-sm" type="button" (click)="ui.openQuickView(product.slug)">عرض سريع</button>
        </div>
      </div>
      <div class="body">
        <p class="cat">{{ catName }}</p>
        <h3><a [routerLink]="['/product', product.slug]">{{ product.nameAr }}</a></h3>
        <app-rating [value]="product.rating" [count]="product.reviewCount"></app-rating>
        <div class="prices">
          <strong>{{ product.price | egp }}</strong>
          <s *ngIf="product.oldPrice">{{ product.oldPrice | egp }}</s>
        </div>
        <p class="stock" [class.out]="product.stockStatus === 'out_of_stock'" [class.low]="product.stockStatus === 'low_stock'">
          {{ stockLabel }}
        </p>
        <button class="btn btn-primary btn-sm" type="button" (click)="add()" [disabled]="product.stockStatus === 'out_of_stock'">
          أضف إلى السلة
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        background: var(--color-surface-highest);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-olive);
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: transform var(--ease), box-shadow var(--ease);
      }
      .card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-olive-hover);
      }
      .media {
        position: relative;
        aspect-ratio: 4 / 5;
        background: var(--color-surface-raised);
        overflow: hidden;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }
      .card:hover img {
        transform: scale(1.04);
      }
      .disc {
        position: absolute;
        top: 12px;
        inset-inline-end: 12px;
      }
      .wish {
        position: absolute;
        top: 12px;
        inset-inline-start: 12px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(250, 246, 232, 0.92);
        color: var(--color-primary);
        display: grid;
        place-items: center;
      }
      .hover {
        position: absolute;
        inset-inline: 12px;
        bottom: 12px;
        opacity: 0;
        transform: translateY(8px);
        transition: 0.2s ease;
      }
      .card:hover .hover {
        opacity: 1;
        transform: none;
      }
      .hover .btn {
        width: 100%;
        background: rgba(250, 246, 232, 0.95);
      }
      .body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }
      .cat {
        font-size: 12px;
        color: var(--color-warm-brown);
        font-weight: 700;
      }
      h3 {
        font-size: 17px;
        line-height: 1.4;
        min-height: 2.8em;
      }
      .prices {
        display: flex;
        gap: 8px;
        align-items: baseline;
      }
      s {
        color: var(--color-text-muted);
        font-size: 13px;
      }
      .stock {
        font-size: 13px;
        color: var(--color-success);
      }
      .stock.low {
        color: var(--color-warning);
      }
      .stock.out {
        color: var(--color-danger);
      }
      .btn-primary {
        margin-top: auto;
      }
      @media (max-width: 767px) {
        .hover {
          display: none;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  @Input() product!: Product;
  constructor(
    public ui: UiService,
    private cart: CartService,
    private wishlist: WishlistService,
    private toast: ToastService,
    private catalog: CatalogService
  ) {}

  get catName(): string {
    return this.catalog.categories.find((c) => c.id === this.product.category)?.nameAr ?? '';
  }
  get stockLabel(): string {
    if (this.product.stockStatus === 'out_of_stock') return 'غير متوفر';
    if (this.product.stockStatus === 'low_stock') return 'كمية محدودة';
    return 'متوفر';
  }
  get wishLabel(): string {
    return this.wishlist.has(this.product.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';
  }
  toggleWish(): void {
    const on = this.wishlist.toggle(this.product.id);
    this.toast.success(on ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
  }
  add(): void {
    const res = this.cart.add(this.product.id, 1);
    if (res.ok) {
      this.toast.success(res.message, undefined, { label: 'عرض السلة', link: '/cart' });
    } else {
      this.toast.error(res.message);
    }
  }
}

@Component({
  selector: 'app-product-skeleton',
  standalone: true,
  template: `
    <div class="sk">
      <div class="skeleton media"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line short"></div>
    </div>
  `,
  styles: [
    `
      .sk {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .media {
        aspect-ratio: 4/5;
      }
      .line {
        height: 14px;
      }
      .short {
        width: 40%;
      }
    `,
  ],
})
export class ProductSkeletonComponent {}
