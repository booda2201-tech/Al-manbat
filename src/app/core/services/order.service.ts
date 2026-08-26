import { Injectable, signal } from '@angular/core';
import { Address, CheckoutDraft, Order, OrderItem, PaymentKind } from '../models/commerce.models';
import { DELIVERY_METHODS } from '../data/catalog.seed';
import { CartService } from './cart.service';
import { CatalogService } from './catalog.service';
import { AuthService } from './auth.service';
import { STORAGE_KEYS, storageGet, storageSet, uid } from '../utils/helpers';

/** MOCK BOUNDARY: submit orders to a real checkout / payments / shipping API. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly lastError = signal<string | null>(null);

  constructor(
    private cart: CartService,
    private catalog: CatalogService,
    private auth: AuthService
  ) {}

  list(): Order[] {
    return this.read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  forCustomer(): Order[] {
    const id = this.auth.customer()?.id;
    if (!id) return [];
    return this.list().filter((o) => o.customerId === id);
  }

  get(id: string): Order | undefined {
    return this.read().find((o) => o.id === id || o.number === id);
  }

  track(number: string, mobile: string): Order | undefined {
    return this.read().find(
      (o) => o.number.toLowerCase() === number.trim().toLowerCase() && o.guestMobile === mobile.trim()
    );
  }

  place(draft: CheckoutDraft): { ok: boolean; order?: Order; message: string } {
    this.lastError.set(null);
    const lines = this.cart.lineItems();
    if (!lines.length) {
      return { ok: false, message: 'السلة فاضية حالياً.' };
    }
    const delivery = DELIVERY_METHODS.find((d) => d.id === draft.deliveryMethodId);
    if (!delivery) return { ok: false, message: 'اختر طريقة توصيل.' };

    const items: OrderItem[] = lines.map((l) => ({
      productId: l.item.productId,
      nameAr: l.name,
      image: l.image,
      quantity: l.item.quantity,
      unitPrice: l.price,
      lineTotal: l.price * l.item.quantity,
    }));

    const address: Address = {
      id: uid('addr'),
      isDefault: true,
      fullName: draft.address.fullName,
      mobile: draft.address.mobile,
      governorate: draft.address.governorate,
      city: draft.address.city,
      area: draft.address.area,
      street: draft.address.street,
      building: draft.address.building,
      apartment: draft.address.apartment,
      notes: draft.address.notes,
    };

    const order: Order = {
      id: uid('ord'),
      number: `MNB-${Math.floor(10000 + Math.random() * 89999)}`,
      customerId: this.auth.customer()?.id,
      guestEmail: draft.email,
      guestMobile: draft.mobile,
      createdAt: new Date().toISOString(),
      status: 'received',
      items,
      address,
      deliveryMethodId: delivery.id,
      paymentMethodId: draft.paymentMethodId,
      subtotal: this.cart.subtotal(),
      discount: this.cart.discount(),
      shipping: delivery.cost,
      total: this.cart.subtotal() - this.cart.discount() + delivery.cost,
      couponCode: this.cart.couponCode(),
      notes: draft.notes,
    };

    storageSet(STORAGE_KEYS.orders, [order, ...this.read()]);
    this.cart.clear();
    return { ok: true, order, message: 'تم تأكيد الطلب.' };
  }

  failDemo(): void {
    this.lastError.set('تعذر إرسال الطلب. حاول مرة أخرى.');
  }

  paymentLabel(id: PaymentKind): string {
    return { cod: 'الدفع عند الاستلام', card: 'بطاقة بنكية', wallet: 'محفظة إلكترونية' }[id];
  }

  statusLabel(status: Order['status']): string {
    return {
      received: 'تم استلام الطلب',
      preparing: 'جاري التجهيز',
      out_for_delivery: 'خرج للتوصيل',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    }[status];
  }

  private read(): Order[] {
    const existing = storageGet<Order[]>(STORAGE_KEYS.orders, []);
    if (existing.length) return existing;
    const demo: Order = {
      id: 'ord-demo',
      number: 'MNB-10934',
      guestMobile: '01000000000',
      guestEmail: 'guest@example.com',
      createdAt: new Date().toISOString(),
      status: 'out_for_delivery',
      items: [
        {
          productId: 'p01',
          nameAr: 'زيت زيتون بكر ممتاز',
          image: '',
          quantity: 1,
          unitPrice: 420,
          lineTotal: 420,
        },
      ],
      address: {
        id: 'addr-demo',
        fullName: 'ضيف المنبت',
        mobile: '01000000000',
        governorate: 'القاهرة',
        city: 'مدينة نصر',
        area: 'الحي الثامن',
        street: 'شارع النيل',
        building: '12',
        apartment: '4',
        isDefault: true,
      },
      deliveryMethodId: 'standard',
      paymentMethodId: 'cod',
      subtotal: 420,
      discount: 0,
      shipping: 40,
      total: 460,
    };
    storageSet(STORAGE_KEYS.orders, [demo]);
    return [demo];
  }
}

export function emptyDraft(): CheckoutDraft {
  return {
    step: 1,
    guest: true,
    customerName: '',
    email: '',
    mobile: '',
    address: {
      fullName: '',
      mobile: '',
      governorate: '',
      city: '',
      area: '',
      street: '',
      building: '',
      apartment: '',
      notes: '',
    },
    deliveryMethodId: 'standard',
    paymentMethodId: 'cod',
    notes: '',
    cardPlaceholder: { number: '', expiry: '', cvc: '', name: '' },
    walletPlaceholder: '',
  };
}
