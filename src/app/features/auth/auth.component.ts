import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container auth">
      <h1>تسجيل الدخول</h1>
      <form (submit)="submit($event)">
        <div class="field"><label>البريد</label><input type="email" name="e" [(ngModel)]="email" required /><span class="field-error" *ngIf="errors['email']">{{ errors['email'] }}</span></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="p" [(ngModel)]="password" required /><span class="field-error" *ngIf="errors['password']">{{ errors['password'] }}</span></div>
        <p class="field-error" *ngIf="error">{{ error }}</p>
        <p class="ok" *ngIf="success">{{ success }}</p>
        <button class="btn btn-primary" [disabled]="loading">{{ loading ? 'جارٍ الدخول…' : 'دخول' }}</button>
        <a routerLink="/forgot-password">نسيت كلمة المرور؟</a>
        <a routerLink="/register">إنشاء حساب</a>
      </form>
    </div>
  `,
  styles: [`.auth { max-width: 420px; padding: 48px 0; } form { display: grid; gap: 12px; } .ok { color: var(--color-success); }`],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  success = '';
  errors: Record<string, string> = {};
  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}
  submit(ev: Event): void {
    ev.preventDefault();
    this.errors = {};
    this.error = '';
    if (!this.email.includes('@')) this.errors['email'] = 'أدخل بريداً صحيحاً';
    if (this.password.length < 6) this.errors['password'] = 'كلمة المرور 6 أحرف على الأقل';
    if (Object.keys(this.errors).length) return;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const res = this.auth.login(this.email, this.password);
      if (!res.ok) {
        this.error = res.message;
        return;
      }
      this.success = res.message;
      this.toast.success(res.message);
      this.router.navigate(['/account']);
    }, 400);
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container auth">
      <h1>إنشاء حساب</h1>
      <form (submit)="submit($event)">
        <div class="field"><label>الاسم</label><input name="n" [(ngModel)]="name" required /><span class="field-error" *ngIf="errors['name']">{{ errors['name'] }}</span></div>
        <div class="field"><label>البريد</label><input type="email" name="e" [(ngModel)]="email" required /><span class="field-error" *ngIf="errors['email']">{{ errors['email'] }}</span></div>
        <div class="field"><label>الموبايل</label><input name="m" [(ngModel)]="mobile" required /><span class="field-error" *ngIf="errors['mobile']">{{ errors['mobile'] }}</span></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="p" [(ngModel)]="password" required /><span class="field-error" *ngIf="errors['password']">{{ errors['password'] }}</span></div>
        <p class="field-error" *ngIf="error">{{ error }}</p>
        <button class="btn btn-primary" [disabled]="loading">{{ loading ? 'جارٍ الإنشاء…' : 'تسجيل' }}</button>
        <a routerLink="/login">لديك حساب؟</a>
      </form>
    </div>
  `,
  styles: [`.auth { max-width: 420px; padding: 48px 0; } form { display: grid; gap: 12px; }`],
})
export class RegisterComponent {
  name = '';
  email = '';
  mobile = '';
  password = '';
  loading = false;
  error = '';
  errors: Record<string, string> = {};
  constructor(private auth: AuthService, private toast: ToastService, private router: Router) {}
  submit(ev: Event): void {
    ev.preventDefault();
    this.errors = {};
    if (!this.name.trim()) this.errors['name'] = 'الاسم مطلوب';
    if (!this.email.includes('@')) this.errors['email'] = 'بريد غير صحيح';
    if (!/^01\d{9}$/.test(this.mobile)) this.errors['mobile'] = 'رقم غير صحيح';
    if (this.password.length < 6) this.errors['password'] = '6 أحرف على الأقل';
    if (Object.keys(this.errors).length) return;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const res = this.auth.register({ name: this.name, email: this.email, mobile: this.mobile, password: this.password });
      if (!res.ok) {
        this.error = res.message;
        return;
      }
      this.toast.success(res.message);
      this.router.navigate(['/account']);
    }, 450);
  }
}

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container auth">
      <h1>استعادة كلمة المرور</h1>
      <form (submit)="submit($event)">
        <div class="field"><label>البريد</label><input type="email" name="e" [(ngModel)]="email" required /><span class="field-error" *ngIf="error">{{ error }}</span></div>
        <p class="ok" *ngIf="success">{{ success }}</p>
        <button class="btn btn-primary" [disabled]="loading">{{ loading ? 'جارٍ الإرسال…' : 'إرسال رابط الاستعادة' }}</button>
        <a routerLink="/login">العودة لتسجيل الدخول</a>
      </form>
    </div>
  `,
  styles: [`.auth { max-width: 420px; padding: 48px 0; } form { display: grid; gap: 12px; } .ok { color: var(--color-success); }`],
})
export class ForgotComponent {
  email = '';
  loading = false;
  error = '';
  success = '';
  constructor(private auth: AuthService) {}
  submit(ev: Event): void {
    ev.preventDefault();
    this.error = '';
    this.success = '';
    if (!this.email.includes('@')) {
      this.error = 'أدخل بريداً صحيحاً';
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const res = this.auth.requestReset(this.email);
      if (!res.ok) this.error = res.message;
      else this.success = res.message;
    }, 400);
  }
}
