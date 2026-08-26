import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { UiService } from '../../core/services/ui.service';
import { EgpPipe } from '../pipes/egp.pipe';
import { IconComponent } from './icon.component';
import { QtyComponent } from './ui-bits.component';

@Component({
  selector: 'app-quick-view',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe, IconComponent, QtyComponent],
  template: `
    <ng-container *ngIf="product as p">
      <div class="overlay" (click)="ui.closeQuickView()"></div>
      <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="p.nameAr">
        <button class="x" type="button" (click)="ui.closeQuickView()" aria-label="إغلاق">
          <app-icon name="close"></app-icon>
        </button>
        <img [src]="p.images[0]" [alt]="p.nameAr" />
        <div>
          <h2>{{ p.nameAr }}</h2>
          <p class="price">{{ p.price | egp }}</p>
          <app-qty [value]="qty" [max]="p.stockQuantity || 1" (valueChange)="qty = $event"></app-qty>
          <button class="btn btn-primary" type="button" (click)="add()" [disabled]="p.stockStatus === 'out_of_stock'">
            أضف إلى السلة
          </button>
          <a [routerLink]="['/product', p.slug]" (click)="ui.closeQuickView()">تفاصيل المنتج</a>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(720px, calc(100% - 24px));
        background: var(--color-surface);
        z-index: var(--z-modal);
        border-radius: 16px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 20px;
      }
      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 12px;
      }
      .x {
        position: absolute;
        top: 8px;
        inset-inline-start: 8px;
      }
      @media (min-width: 768px) {
        .modal {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class QuickViewComponent {
  qty = 1;
  constructor(
    public ui: UiService,
    private catalog: CatalogService,
    private cart: CartService,
    private toast: ToastService
  ) {}
  get product() {
    const slug = this.ui.quickViewSlug();
    return slug ? this.catalog.getBySlug(slug) : undefined;
  }
  add(): void {
    const p = this.product;
    if (!p) return;
    const res = this.cart.add(p.id, this.qty);
    res.ok ? this.toast.success(res.message, undefined, { label: 'عرض السلة', link: '/cart' }) : this.toast.error(res.message);
    if (res.ok) this.ui.closeQuickView();
  }
}
