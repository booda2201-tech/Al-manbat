import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../core/models/commerce.models';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container page">
      <h1 class="headline">تتبع طلبك</h1>
      <p class="muted">أدخل رقم الطلب ورقم الموبايل المسجّل مع الشحنة. للتجربة: MNB-10934 و 01000000000</p>
      <form class="card-surface form" (submit)="lookup($event)">
        <div class="field"><label for="num">رقم الطلب</label><input id="num" name="num" [(ngModel)]="number" /></div>
        <div class="field"><label for="mob">رقم الموبايل</label><input id="mob" name="mob" [(ngModel)]="mobile" /></div>
        <p class="field-error" *ngIf="error">{{ error }}</p>
        <button class="btn btn-primary" type="submit" [disabled]="loading">{{ loading ? 'جارٍ البحث…' : 'تتبع' }}</button>
      </form>
      <div class="result" *ngIf="order">
        <h2>{{ order.number }}</h2>
        <p>{{ orders.statusLabel(order.status) }}</p>
        <ol class="tl">
          <li *ngFor="let s of stages; let i = index" [class.on]="i <= indexOf(order.status)" [class.now]="i === indexOf(order.status)">
            <span></span>
            <div>
              <strong>{{ s.label }}</strong>
            </div>
          </li>
        </ol>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 40px 0 64px;
        max-width: 720px;
      }
      .form {
        padding: 24px;
        display: grid;
        gap: 12px;
        margin: 24px 0;
      }
      .tl {
        list-style: none;
        padding: 0;
      }
      .tl li {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 12px;
        margin-bottom: 16px;
        opacity: 0.45;
      }
      .tl span {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--color-border);
        margin-top: 4px;
      }
      .tl .on {
        opacity: 1;
      }
      .tl .on span {
        background: var(--color-primary);
      }
      .tl .now span {
        background: var(--color-olive-gold);
      }
    `,
  ],
})
export class TrackComponent {
  number = '';
  mobile = '';
  loading = false;
  error = '';
  order?: Order;
  stages = [
    { key: 'received', label: 'تم استلام الطلب' },
    { key: 'preparing', label: 'جاري التجهيز' },
    { key: 'out_for_delivery', label: 'خرج للتوصيل' },
    { key: 'delivered', label: 'تم التسليم' },
  ];
  constructor(public orders: OrderService) {}
  indexOf(status: Order['status']): number {
    const i = this.stages.findIndex((s) => s.key === status);
    return i < 0 ? 0 : i;
  }
  lookup(ev: Event): void {
    ev.preventDefault();
    this.error = '';
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.order = this.orders.track(this.number, this.mobile);
      if (!this.order) this.error = 'لم نجد طلباً بهذه البيانات.';
    }, 450);
  }
}
