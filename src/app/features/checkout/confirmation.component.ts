import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DELIVERY_METHODS } from '../../core/data/catalog.seed';
import { Order } from '../../core/models/commerce.models';
import { OrderService } from '../../core/services/order.service';
import { EgpPipe } from '../../shared/pipes/egp.pipe';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe],
  template: `
    <div class="container page" *ngIf="order; else missing">
      <img src="assets/brand/logo.png" alt="" class="logo" />
      <h1>تم تأكيد طلبك</h1>
      <p class="gold">رقم الطلب {{ order.number }}</p>
      <ul>
        <li *ngFor="let i of order.items">{{ i.nameAr }} × {{ i.quantity }} — {{ i.lineTotal | egp }}</li>
      </ul>
      <p>الإجمالي {{ order.total | egp }}</p>
      <p>التوصيل: {{ delivery }}</p>
      <p>الدفع: {{ orders.paymentLabel(order.paymentMethodId) }}</p>
      <a class="btn btn-primary" routerLink="/track-order">تتبع طلبك</a>
    </div>
    <ng-template #missing>
      <div class="container page">
        <h1>الطلب غير موجود</h1>
        <a routerLink="/account/orders">طلباتي</a>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .page {
        padding: 48px 0;
        text-align: center;
      }
      .logo {
        width: 140px;
        margin: 0 auto 16px;
        border-radius: 16px;
      }
      ul {
        list-style: none;
        padding: 0;
      }
    `,
  ],
})
export class ConfirmationComponent implements OnInit {
  order?: Order;
  delivery = '';
  constructor(public orders: OrderService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.order = this.orders.get(id);
    const d = DELIVERY_METHODS.find((x) => x.id === this.order?.deliveryMethodId);
    this.delivery = d ? `${d.nameAr} — ${d.estimate}` : '';
  }
}
