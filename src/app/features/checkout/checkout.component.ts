import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CheckoutDraft } from '../../core/models/commerce.models';
import { DELIVERY_METHODS, GOVERNORATES, PAYMENT_METHODS } from '../../core/data/catalog.seed';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { emptyDraft, OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { EgpPipe } from '../../shared/pipes/egp.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EgpPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  draft: CheckoutDraft = emptyDraft();
  errors: Record<string, string> = {};
  loading = false;
  failed = false;
  steps = ['بيانات العميل', 'عنوان التوصيل', 'طريقة التوصيل', 'طريقة الدفع', 'مراجعة الطلب', 'تأكيد الطلب'];
  deliveries = DELIVERY_METHODS;
  payments = PAYMENT_METHODS;
  govs = GOVERNORATES;

  constructor(
    public cart: CartService,
    private orders: OrderService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    const c = auth.customer();
    if (c) {
      this.draft.guest = false;
      this.draft.customerName = c.name;
      this.draft.email = c.email;
      this.draft.mobile = c.mobile;
      const a = c.addresses.find((x) => x.isDefault) ?? c.addresses[0];
      if (a) this.draft.address = { ...a };
    }
  }

  get shipping(): number {
    return this.deliveries.find((d) => d.id === this.draft.deliveryMethodId)?.cost ?? 0;
  }
  get total(): number {
    return this.cart.subtotal() - this.cart.discount() + this.shipping;
  }

  deliveryLabel(): string {
    return this.deliveries.find((d) => d.id === this.draft.deliveryMethodId)?.nameAr ?? '';
  }

  paymentLabel(): string {
    return this.payments.find((p) => p.id === this.draft.paymentMethodId)?.nameAr ?? '';
  }

  next(): void {
    if (!this.validate()) return;
    if (this.draft.step < 6) this.draft.step += 1;
  }
  back(): void {
    if (this.draft.step > 1) this.draft.step -= 1;
  }

  validate(): boolean {
    this.errors = {};
    const d = this.draft;
    if (d.step === 1) {
      if (!d.customerName.trim()) this.errors['name'] = 'الاسم مطلوب';
      if (!/^01\d{9}$/.test(d.mobile.replace(/\s/g, ''))) this.errors['mobile'] = 'أدخل رقم هاتف مصري صحيح';
      if (d.email && !d.email.includes('@')) this.errors['email'] = 'البريد غير صحيح';
    }
    if (d.step === 2) {
      const a = d.address;
      (['fullName', 'mobile', 'governorate', 'city', 'area', 'street', 'building', 'apartment'] as const).forEach((k) => {
        if (!String(a[k] ?? '').trim()) this.errors[k] = 'هذا الحقل مطلوب';
      });
    }
    if (d.step === 4 && d.paymentMethodId === 'card') {
      if (!d.cardPlaceholder?.number) this.errors['card'] = 'أدخل بيانات البطاقة للمحاكاة';
    }
    return Object.keys(this.errors).length === 0;
  }

  submit(): void {
    if (!this.validate()) return;
    this.loading = true;
    this.failed = false;
    setTimeout(() => {
      const res = this.orders.place(this.draft);
      this.loading = false;
      if (!res.ok || !res.order) {
        this.failed = true;
        this.toast.error(res.message);
        return;
      }
      this.toast.success('تم تأكيد الطلب');
      this.router.navigate(['/order-confirmation', res.order.id]);
    }, 700);
  }

  retry(): void {
    this.submit();
  }
}
