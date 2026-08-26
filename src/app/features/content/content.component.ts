import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FAQS } from '../../core/data/catalog.seed';
import { ToastService } from '../../core/services/toast.service';
import { IMG } from '../../core/data/images';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <img [src]="img" alt="أشجار زيتون في ضوء هادئ" />
      <div class="copy container">
        <p class="gold">سر الخير</p>
        <h1 class="display">قصة المنبت</h1>
      </div>
    </section>
    <div class="container page">
      <p>
        المنبت علامة مصرية تمزج بين أصالة المنشأ ووضوح التجربة. الاسم يشير إلى الأصل والجذور، والشعار «سر الخير» يلخّص وعدنا: جودة تُختار بهدوء وتصل إلى البيت بثقة.
      </p>
      <h2>الأصل</h2>
      <p>نبدأ من المصدر — من الزيتون والمؤن إلى ما يخدم البيت الحديث — دون أن نفصل بين العراقة وسهولة الشراء.</p>
      <h2>القيم</h2>
      <ul>
        <li>صدق الوصف والمكوّنات</li>
        <li>اختيار مرتّب بدل الكثرة</li>
        <li>تجربة عربية واضحة من البحث حتى التسليم</li>
      </ul>
      <h2>وعد الجودة</h2>
      <p>نعرض المواصفات بوضوح، ونميّز ما هو متاح الآن عما سيُربط لاحقاً بخدمات الشحن والدفع الفعلية.</p>
      <h2>تجربة العميل</h2>
      <p>سلة واحدة، حساب واحد، وأقسام أربعة تحت لغة بصرية واحدة. <a routerLink="/shop">تسوق التشكيلة</a></p>
    </div>
  `,
  styles: [
    `
      .hero {
        position: relative;
        min-height: 360px;
        display: flex;
        align-items: flex-end;
      }
      .hero img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .copy {
        position: relative;
        color: #fff;
        padding-bottom: 32px;
      }
      .page {
        padding: 40px 0 64px;
        max-width: 760px;
      }
      h2 {
        margin-top: 28px;
      }
    `,
  ],
})
export class AboutComponent {
  img = IMG.heroStill;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container page">
      <h1 class="headline">تواصل معنا</h1>
      <div class="grid">
        <form class="card-surface" (submit)="send($event)">
          <div class="field"><label>الاسم</label><input name="n" [(ngModel)]="name" required /><span class="field-error" *ngIf="errors['name']">{{ errors['name'] }}</span></div>
          <div class="field"><label>البريد</label><input name="e" [(ngModel)]="email" required /><span class="field-error" *ngIf="errors['email']">{{ errors['email'] }}</span></div>
          <div class="field"><label>الرسالة</label><textarea name="m" [(ngModel)]="message" rows="5" required></textarea></div>
          <p class="ok" *ngIf="success">{{ success }}</p>
          <button class="btn btn-primary" [disabled]="loading">{{ loading ? 'جارٍ الإرسال…' : 'إرسال' }}</button>
        </form>
        <aside>
          <p>الهاتف: 0100 000 0000</p>
          <p>البريد: hello@al-manbat.example</p>
          <p>العنوان: القاهرة، مصر (عنوان للعرض)</p>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 40px 0;
      }
      .grid {
        display: grid;
        gap: 20px;
      }
      form {
        padding: 24px;
        display: grid;
        gap: 12px;
      }
      .ok {
        color: var(--color-success);
      }
      @media (min-width: 800px) {
        .grid {
          grid-template-columns: 1.2fr 0.8fr;
        }
      }
    `,
  ],
})
export class ContactComponent {
  name = '';
  email = '';
  message = '';
  loading = false;
  success = '';
  errors: Record<string, string> = {};
  constructor(private toast: ToastService) {}
  send(ev: Event): void {
    ev.preventDefault();
    this.errors = {};
    if (!this.name.trim()) this.errors['name'] = 'الاسم مطلوب';
    if (!this.email.includes('@')) this.errors['email'] = 'بريد غير صحيح';
    if (Object.keys(this.errors).length) return;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.success = 'وصلت رسالتك. سنعود إليك عبر البريد عند تفعيل خدمة التواصل.';
      this.toast.success('تم إرسال الرسالة');
    }, 500);
  }
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container page">
      <h1 class="headline">الأسئلة الشائعة</h1>
      <div class="item" *ngFor="let f of faqs; let i = index">
        <button type="button" [attr.aria-expanded]="open === i" (click)="open = open === i ? -1 : i">{{ f.q }}</button>
        <p *ngIf="open === i">{{ f.a }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 40px 0 64px;
        max-width: 800px;
      }
      .item {
        border-bottom: 1px solid var(--color-border);
      }
      button {
        width: 100%;
        text-align: right;
        padding: 16px 0;
        font-weight: 700;
      }
      p {
        padding-bottom: 16px;
      }
    `,
  ],
})
export class FaqComponent {
  faqs = FAQS;
  open = 0;
}

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container legal">
      <h1>سياسة الخصوصية</h1>
      <p class="muted">نص للعرض بانتظار المراجعة القانونية للنشاط التجاري.</p>
      <p>نجمع بيانات الحساب والطلب لتجهيز الشراء والتواصل. لا نبيع البيانات لأطراف ثالثة في هذه النسخة التجريبية.</p>
      <p>بيانات السلة والمفضلة تُحفظ محلياً في المتصفح حتى يتم ربط خادم حقيقي.</p>
    </div>
  `,
  styles: [`.legal { max-width: 760px; padding: 40px 0 64px; }`],
})
export class PrivacyComponent {}

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container legal">
      <h1>الشروط والأحكام</h1>
      <p class="muted">نص للعرض بانتظار المراجعة القانونية.</p>
      <p>استخدام المتجر يعني الموافقة على وصف المنتجات والأسعار الظاهرة وقت الطلب. أوقات التوصيل تقديرية وغير ملزمة قانونياً حتى إقرار سياسة الشحن النهائية.</p>
      <p>الأسعار بالجنيه المصري. العروض والكوبونات قابلة للتعديل أو الإيقاف.</p>
    </div>
  `,
  styles: [`.legal { max-width: 760px; padding: 40px 0 64px; }`],
})
export class TermsComponent {}
