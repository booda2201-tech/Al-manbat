import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent, FormsModule],
  template: `
    <footer class="footer">
      <div class="container grid">
        <div>
          <app-logo [height]="64"></app-logo>
          <p class="tag">سر الخير</p>
          <p>
            المنبت علامة مصرية تربط بين أصل المنشأ وجودة مختارة وتجربة شراء هادئة، من مواد يومك إلى تفاصيل رفاهيتك.
          </p>
        </div>
        <div>
          <h3>التسوق</h3>
          <a routerLink="/shop">كل المنتجات</a>
          <a routerLink="/category/groceries">مواد غذائية</a>
          <a routerLink="/category/beauty">تجميل وعناية</a>
          <a routerLink="/category/appliances">أجهزة كهربائية</a>
          <a routerLink="/category/electronics">إلكترونيات</a>
          <a routerLink="/category/offers">العروض</a>
        </div>
        <div>
          <h3>خدمة العملاء</h3>
          <a routerLink="/contact">تواصل معنا</a>
          <a routerLink="/faq">الأسئلة الشائعة</a>
          <a routerLink="/track-order">تتبع طلبك</a>
          <a routerLink="/about">عن المنبت</a>
          <p class="meta">التوصيل خلال 2 إلى 4 أيام عمل تقديرياً. الإرجاع خلال 14 يوماً للمنتجات غير المفتوحة.</p>
        </div>
        <div>
          <h3>حسابك</h3>
          <a routerLink="/login">تسجيل الدخول</a>
          <a routerLink="/register">إنشاء حساب</a>
          <a routerLink="/account/orders">طلباتي</a>
          <a routerLink="/account/wishlist">المفضلة</a>
          <p class="meta">hello@al-manbat.example<br />0100 000 0000</p>
          <div class="social" aria-label="وسائل التواصل">
            <span>IG</span><span>FB</span><span>WA</span>
          </div>
        </div>
      </div>
      <div class="container news">
        <div>
          <h3>خليك دايماً على معرفة بالجديد</h3>
          <p>اشترك ليصلك أحدث المنتجات والعروض المميزة</p>
        </div>
        <form (submit)="subscribe($event)">
          <label class="sr-only" for="nl">البريد الإلكتروني</label>
          <input id="nl" name="email" type="email" required [(ngModel)]="email" placeholder="البريد الإلكتروني" />
          <button class="btn btn-gold" type="submit">اشترك الآن</button>
        </form>
      </div>
      <div class="container bottom">
        <p>طرق الدفع: الدفع عند الاستلام · بطاقة · محفظة</p>
        <p>
          <a routerLink="/privacy">سياسة الخصوصية</a>
          ·
          <a routerLink="/terms">الشروط والأحكام</a>
          · © 2026 المنبت. سر الخير.
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background: var(--color-deep-olive);
        color: var(--color-soft-ivory);
        padding-top: 56px;
        margin-top: 48px;
      }
      .grid {
        display: grid;
        gap: 28px;
        grid-template-columns: 1fr;
      }
      .tag {
        color: var(--color-olive-gold);
        font-weight: 700;
        margin: 8px 0 12px;
      }
      h3 {
        color: var(--color-olive-gold);
        font-size: 15px;
        margin-bottom: 12px;
      }
      a,
      p {
        display: block;
        margin-bottom: 8px;
        color: rgba(238, 230, 201, 0.86);
      }
      .meta {
        margin-top: 12px;
        font-size: 13px;
      }
      .social {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .social span {
        border: 1px solid rgba(168, 137, 55, 0.5);
        color: var(--color-olive-gold);
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        font-size: 11px;
      }
      .news {
        display: flex;
        flex-direction: column;
        gap: 16px;
        border-top: 1px solid rgba(238, 230, 201, 0.12);
        margin-top: 32px;
        padding: 28px 0;
      }
      form {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      input {
        flex: 1;
        min-width: 220px;
        background: rgba(238, 230, 201, 0.08);
        border: 1px solid rgba(238, 230, 201, 0.2);
        color: var(--color-soft-ivory);
        border-radius: 12px;
        padding: 12px 14px;
      }
      .bottom {
        border-top: 1px solid rgba(238, 230, 201, 0.12);
        padding: 18px 0 28px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
      }
      @media (min-width: 900px) {
        .grid {
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
        }
        .news {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .bottom {
          flex-direction: row;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class FooterComponent {
  email = '';
  constructor(private toast: ToastService) {}
  subscribe(ev: Event): void {
    ev.preventDefault();
    if (!this.email.includes('@')) {
      this.toast.error('أدخل بريداً إلكترونياً صحيحاً');
      return;
    }
    this.toast.success('تم الاشتراك', 'سنخبرك بالجديد عند تفعيل خدمة البريد.');
    this.email = '';
  }
}
