import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GOVERNORATES } from '../../core/data/catalog.seed';
import { Address, Order } from '../../core/models/commerce.models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { EmptyStateComponent } from '../../shared/components/ui-bits.component';
import { EgpPipe } from '../../shared/pipes/egp.pipe';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="container acc">
      <aside>
        <a routerLink="/account" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">لوحة الحساب</a>
        <a routerLink="/account/orders" routerLinkActive="on">طلباتي</a>
        <a routerLink="/account/wishlist" routerLinkActive="on">المفضلة</a>
        <a routerLink="/account/addresses" routerLinkActive="on">العناوين</a>
        <a routerLink="/account/profile" routerLinkActive="on">الملف الشخصي</a>
        <button type="button" (click)="logout()">تسجيل الخروج</button>
      </aside>
      <section><router-outlet></router-outlet></section>
    </div>
  `,
  styles: [
    `
      .acc {
        display: grid;
        gap: 24px;
        padding: 32px 0 64px;
      }
      aside {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      aside a,
      aside button {
        text-align: right;
        padding: 10px;
        border-radius: 10px;
      }
      .on {
        background: var(--color-surface);
        color: var(--color-primary);
        font-weight: 700;
      }
      @media (min-width: 900px) {
        .acc {
          grid-template-columns: 220px 1fr;
        }
      }
    `,
  ],
})
export class AccountLayoutComponent {
  confirmOut = false;
  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}
  logout(): void {
    if (!confirm('تأكيد تسجيل الخروج؟')) return;
    this.auth.logout();
    this.toast.info('تم تسجيل الخروج');
    this.router.navigate(['/']);
  }
}

@Component({
  selector: 'app-account-home',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe],
  template: `
    <h1>مرحباً {{ name }}</h1>
    <div class="cards">
      <article>
        <h2>آخر طلب</h2>
        <p *ngIf="last">{{ last.number }} — {{ orders.statusLabel(last.status) }}</p>
        <p *ngIf="!last">لا توجد طلبات بعد.</p>
        <a routerLink="/account/orders">كل الطلبات</a>
      </article>
      <article>
        <h2>المفضلة</h2>
        <p>{{ wish.count() }} منتج</p>
        <a routerLink="/account/wishlist">عرض</a>
      </article>
      <article>
        <h2>العناوين</h2>
        <p>{{ addrCount }} عنوان محفوظ</p>
        <a routerLink="/account/addresses">إدارة</a>
      </article>
    </div>
    <p *ngIf="!auth.isLoggedIn()"><a routerLink="/login">سجّل الدخول</a> لحفظ الطلبات والعناوين على الحساب. التصفح والسلة متاحان بدون حساب.</p>
  `,
  styles: [
    `
      .cards {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr;
      }
      article {
        background: var(--color-surface);
        padding: 16px;
        border-radius: 12px;
      }
      @media (min-width: 700px) {
        .cards {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `,
  ],
})
export class AccountHomeComponent {
  constructor(public auth: AuthService, public orders: OrderService, public wish: WishlistService) {}
  get name() {
    return this.auth.customer()?.name ?? 'زائر المنبت';
  }
  get last() {
    return this.orders.forCustomer()[0] ?? this.orders.list()[0];
  }
  get addrCount() {
    return this.auth.customer()?.addresses.length ?? 0;
  }
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe],
  template: `
    <h1>طلباتي</h1>
    <p *ngIf="!list.length">لا توجد طلبات بعد.</p>
    <a class="row" *ngFor="let o of list" [routerLink]="['/account/orders', o.id]">
      <strong>{{ o.number }}</strong>
      <span>{{ orders.statusLabel(o.status) }}</span>
      <span>{{ o.total | egp }}</span>
    </a>
  `,
  styles: [`.row { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--color-border); }`],
})
export class OrdersComponent {
  constructor(public orders: OrderService) {}
  get list() {
    return this.orders.forCustomer().length ? this.orders.forCustomer() : this.orders.list();
  }
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EgpPipe],
  template: `
    <div *ngIf="order">
      <h1>{{ order.number }}</h1>
      <p>{{ orders.statusLabel(order.status) }}</p>
      <p *ngFor="let i of order.items">{{ i.nameAr }} × {{ i.quantity }} — {{ i.lineTotal | egp }}</p>
      <p>الإجمالي {{ order.total | egp }}</p>
      <a routerLink="/track-order">تتبع الطلب</a>
    </div>
  `,
})
export class OrderDetailComponent {
  order?: Order;
  constructor(public orders: OrderService, route: ActivatedRoute) {
    this.order = orders.get(route.snapshot.paramMap.get('id')!);
  }
}

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, EmptyStateComponent, RouterLink],
  template: `
    <h1>المفضلة</h1>
    <app-empty *ngIf="!products.length" title="المفضلة فارغة" message="احفظ منتجات لتعود إليها لاحقاً.">
      <a class="btn btn-primary" routerLink="/shop">تسوق الآن</a>
    </app-empty>
    <div class="product-grid">
      <app-product-card *ngFor="let p of products" [product]="p"></app-product-card>
    </div>
  `,
})
export class WishlistPageComponent {
  constructor(public wish: WishlistService, private catalog: CatalogService, public cart: CartService) {}
  get products() {
    return this.wish.list().map((id) => this.catalog.getById(id)!).filter(Boolean);
  }
}

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>العناوين</h1>
    <p *ngIf="!auth.isLoggedIn()">سجّل الدخول لحفظ العناوين على الحساب.</p>
    <article *ngFor="let a of addresses">
      <strong>{{ a.fullName }}</strong>
      <p>{{ a.street }}، {{ a.city }}، {{ a.governorate }}</p>
      <button type="button" (click)="remove(a.id)">حذف</button>
    </article>
    <form (submit)="save($event)" *ngIf="auth.isLoggedIn()">
      <h2>عنوان جديد</h2>
      <div class="field"><label>الاسم</label><input name="fn" [(ngModel)]="form.fullName" required /></div>
      <div class="field"><label>الموبايل</label><input name="m" [(ngModel)]="form.mobile" required /></div>
      <div class="field"><label>المحافظة</label>
        <select name="g" [(ngModel)]="form.governorate">
          <option *ngFor="let g of govs" [value]="g">{{ g }}</option>
        </select>
      </div>
      <div class="field"><label>المدينة</label><input name="c" [(ngModel)]="form.city" required /></div>
      <div class="field"><label>المنطقة</label><input name="ar" [(ngModel)]="form.area" required /></div>
      <div class="field"><label>الشارع</label><input name="st" [(ngModel)]="form.street" required /></div>
      <div class="field"><label>المبنى</label><input name="b" [(ngModel)]="form.building" required /></div>
      <div class="field"><label>الشقة</label><input name="ap" [(ngModel)]="form.apartment" required /></div>
      <button class="btn btn-primary">حفظ العنوان</button>
    </form>
  `,
})
export class AddressesComponent {
  govs = GOVERNORATES;
  form: Omit<Address, 'id' | 'isDefault'> = {
    fullName: '',
    mobile: '',
    governorate: 'القاهرة',
    city: '',
    area: '',
    street: '',
    building: '',
    apartment: '',
  };
  constructor(public auth: AuthService, private toast: ToastService) {}
  get addresses() {
    return this.auth.customer()?.addresses ?? [];
  }
  save(ev: Event): void {
    ev.preventDefault();
    this.auth.saveAddress({ ...this.form, isDefault: this.addresses.length === 0 });
    this.toast.success('تم حفظ العنوان');
  }
  remove(id: string): void {
    this.auth.removeAddress(id);
  }
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>الملف الشخصي</h1>
    <p *ngIf="!auth.isLoggedIn()"><a routerLink="/login">سجّل الدخول</a> لتعديل بياناتك.</p>
    <form *ngIf="auth.isLoggedIn()" (submit)="save($event)">
      <div class="field"><label>الاسم</label><input name="n" [(ngModel)]="name" /></div>
      <div class="field"><label>البريد</label><input name="e" [(ngModel)]="email" /></div>
      <div class="field"><label>الموبايل</label><input name="m" [(ngModel)]="mobile" /></div>
      <button class="btn btn-primary">حفظ</button>
    </form>
    <form *ngIf="auth.isLoggedIn()" (submit)="pass($event)">
      <h2>تغيير كلمة المرور</h2>
      <div class="field"><label>الحالية</label><input type="password" name="c" [(ngModel)]="current" /></div>
      <div class="field"><label>الجديدة</label><input type="password" name="n2" [(ngModel)]="next" /></div>
      <p class="field-error" *ngIf="err">{{ err }}</p>
      <button class="btn btn-outline">تحديث كلمة المرور</button>
    </form>
  `,
})
export class ProfileComponent {
  name = '';
  email = '';
  mobile = '';
  current = '';
  next = '';
  err = '';
  constructor(public auth: AuthService, private toast: ToastService) {
    const c = auth.customer();
    if (c) {
      this.name = c.name;
      this.email = c.email;
      this.mobile = c.mobile;
    }
  }
  save(ev: Event): void {
    ev.preventDefault();
    this.auth.updateProfile({ name: this.name, email: this.email, mobile: this.mobile });
    this.toast.success('تم حفظ الملف');
  }
  pass(ev: Event): void {
    ev.preventDefault();
    const res = this.auth.updatePassword(this.current, this.next);
    this.err = res.ok ? '' : res.message;
    if (res.ok) this.toast.success(res.message);
  }
}
