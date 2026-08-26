import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { UiService } from '../../core/services/ui.service';
import { EgpPipe } from '../pipes/egp.pipe';
import { EmptyStateComponent, QtyComponent } from './ui-bits.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe, QtyComponent, EmptyStateComponent, IconComponent],
  template: `
    <ng-container *ngIf="ui.cartOpen()">
      <div class="overlay" (click)="ui.cartOpen.set(false)"></div>
      <aside class="drawer drawer-end" role="dialog" aria-label="سلة التسوق">
        <header>
          <h2>السلة</h2>
          <button type="button" (click)="ui.cartOpen.set(false)" aria-label="إغلاق">
            <app-icon name="close"></app-icon>
          </button>
        </header>
        <div class="list" *ngIf="lines.length; else empty">
          <div class="line" *ngFor="let l of lines">
            <img [src]="l.image" [alt]="l.name" />
            <div>
              <a [routerLink]="['/product', l.slug]" (click)="ui.cartOpen.set(false)">{{ l.name }}</a>
              <app-qty [value]="l.item.quantity" [max]="l.stock" (valueChange)="qty(l.item.productId, $event)"></app-qty>
              <strong>{{ l.price * l.item.quantity | egp }}</strong>
            </div>
            <button type="button" (click)="cart.remove(l.item.productId)" aria-label="حذف">
              <app-icon name="close" [size]="16"></app-icon>
            </button>
          </div>
        </div>
        <ng-template #empty>
          <app-empty title="السلة فاضية حالياً" message="ابدأ التسوق لإضافة منتجات.">
            <a class="btn btn-primary" routerLink="/shop" (click)="ui.cartOpen.set(false)">ابدأ التسوق</a>
          </app-empty>
        </ng-template>
        <footer *ngIf="lines.length">
          <p>المجموع الفرعي <strong>{{ cart.subtotal() | egp }}</strong></p>
          <a class="btn btn-gold" routerLink="/checkout" (click)="ui.cartOpen.set(false)">إتمام الشراء</a>
          <a class="btn btn-outline" routerLink="/cart" (click)="ui.cartOpen.set(false)">عرض السلة</a>
        </footer>
      </aside>
    </ng-container>
  `,
  styles: [
    `
      header,
      footer {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      footer {
        flex-direction: column;
        border-top: 1px solid var(--color-border);
      }
      footer .btn {
        width: 100%;
      }
      .list {
        flex: 1;
        overflow: auto;
        padding: 8px 16px;
      }
      .line {
        display: grid;
        grid-template-columns: 72px 1fr auto;
        gap: 10px;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
      }
      img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 10px;
      }
    `,
  ],
})
export class CartDrawerComponent {
  constructor(public ui: UiService, public cart: CartService) {}
  get lines() {
    return this.cart.lineItems();
  }
  qty(id: string, n: number): void {
    this.cart.setQuantity(id, n);
  }
}
