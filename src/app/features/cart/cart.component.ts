import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { EgpPipe } from '../../shared/pipes/egp.pipe';
import { EmptyStateComponent, QtyComponent } from '../../shared/components/ui-bits.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EgpPipe, QtyComponent, EmptyStateComponent],
  template: `
    <div class="container page">
      <h1 class="headline">سلة التسوق</h1>
      <app-empty *ngIf="!lines.length" title="السلة فاضية حالياً" message="أضف منتجات من المتجر لتبدأ الطلب.">
        <a class="btn btn-primary" routerLink="/shop">ابدأ التسوق</a>
      </app-empty>
      <div class="grid" *ngIf="lines.length">
        <div class="list">
          <article *ngFor="let l of lines">
            <img [src]="l.image" [alt]="l.name" />
            <div>
              <a [routerLink]="['/product', l.slug]">{{ l.name }}</a>
              <app-qty [value]="l.item.quantity" [max]="l.stock" (valueChange)="cart.setQuantity(l.item.productId, $event)"></app-qty>
              <div class="row">
                <button type="button" (click)="move(l.item.productId)">نقل إلى المفضلة</button>
                <button type="button" (click)="cart.remove(l.item.productId)">حذف</button>
              </div>
            </div>
            <strong>{{ l.price * l.item.quantity | egp }}</strong>
          </article>
        </div>
        <aside class="sum card-surface">
          <h2>ملخص الطلب</h2>
          <form (submit)="coupon($event)">
            <input name="code" [(ngModel)]="code" placeholder="كود الخصم" />
            <button class="btn btn-outline btn-sm" type="submit">تطبيق</button>
          </form>
          <p>المجموع الفرعي <span>{{ cart.subtotal() | egp }}</span></p>
          <p>الخصم <span>{{ cart.discount() | egp }}</span></p>
          <p>الشحن يُحسب عند إتمام الشراء</p>
          <p class="total">الإجمالي التقريبي <strong>{{ cart.subtotal() - cart.discount() | egp }}</strong></p>
          <a class="btn btn-gold" routerLink="/checkout">إتمام الشراء</a>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px 0 64px;
      }
      .grid {
        display: grid;
        gap: 24px;
        margin-top: 24px;
      }
      article {
        display: grid;
        grid-template-columns: 88px 1fr auto;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
      }
      img {
        width: 88px;
        height: 88px;
        object-fit: cover;
        border-radius: 12px;
      }
      .row button {
        margin-left: 8px;
        color: var(--color-primary);
        font-weight: 700;
      }
      .sum {
        padding: 20px;
        display: grid;
        gap: 10px;
        height: max-content;
      }
      .sum p {
        display: flex;
        justify-content: space-between;
      }
      form {
        display: flex;
        gap: 8px;
      }
      form input {
        flex: 1;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid var(--color-border);
      }
      @media (min-width: 900px) {
        .grid {
          grid-template-columns: 1.6fr 0.8fr;
        }
      }
    `,
  ],
})
export class CartPageComponent {
  code = '';
  constructor(public cart: CartService, private wish: WishlistService, private toast: ToastService) {}
  get lines() {
    return this.cart.lineItems();
  }
  coupon(ev: Event): void {
    ev.preventDefault();
    const res = this.cart.applyCoupon(this.code);
    res.ok ? this.toast.success(res.message) : this.toast.error(res.message);
  }
  move(id: string): void {
    if (!this.wish.has(id)) this.wish.toggle(id);
    this.cart.remove(id);
    this.toast.success('نُقل المنتج إلى المفضلة');
  }
}
