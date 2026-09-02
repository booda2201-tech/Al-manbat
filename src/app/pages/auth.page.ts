import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { normalizeAuthPhone } from '../api/api.util';
import { AuthApiService } from '../services/auth-api.service';
import { StoreService } from '../services/store.service';
import { SessionService } from '../services/session.service';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './auth.page.html',
})
export class AuthPageComponent implements OnInit {
  signup = false;
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  phone = '';
  error = '';
  showPassword = false;
  busy = false;
  images = images;

  constructor(
    public locale: LocaleService,
    private route: ActivatedRoute,
    private router: Router,
    private store: StoreService,
    private auth: AuthApiService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((url) => {
      this.signup = url[0]?.path === 'signup';
      this.error = '';
    });
    if (this.session.isLoggedIn()) {
      this.router.navigateByUrl(this.redirectTo());
    }
  }

  scrimClass(): string {
    return this.locale.isAr()
      ? 'bg-gradient-to-l from-sand-50/92 via-sand-50/70 to-transparent'
      : 'bg-gradient-to-r from-sand-50/92 via-sand-50/70 to-transparent';
  }

  submit(ev: Event): void {
    ev.preventDefault();
    this.error = '';
    if (this.busy) return;
    const phone = normalizeAuthPhone(this.phone) || this.phone.trim();
    if (phone.length < 8 || this.password.length < 6) {
      this.error = this.locale.isAr()
        ? 'أدخل رقم جوال صحيح وكلمة مرور من ٦ أحرف على الأقل.'
        : 'Enter a valid mobile number and a password of at least 6 characters.';
      return;
    }
    if (this.signup) {
      if (!this.firstName.trim() || !this.lastName.trim()) {
        this.error = this.locale.isAr() ? 'أدخل الاسم كاملاً.' : 'Enter your full name.';
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.error = this.locale.isAr() ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.';
        return;
      }
      if (!/\d/.test(this.password)) {
        this.error = this.locale.isAr()
          ? 'كلمة المرور لازم فيها رقم واحد على الأقل.'
          : 'Password must include at least one digit.';
        return;
      }
      this.busy = true;
      const displayName = `${this.firstName.trim()} ${this.lastName.trim()}`.replace(/\s+/g, ' ');
      this.auth
        .register({
          userName: toApiUserName(displayName, phone),
          displayName,
          phone,
          password: this.password,
        })
        .subscribe({
          next: () => this.succeed(true),
          error: (err) => this.fail(err),
        });
      return;
    }
    this.busy = true;
    this.auth.login(phone, this.password).subscribe({
      next: () => this.succeed(false),
      error: (err) => this.fail(err),
    });
  }

  forgot(): void {
    this.store.pushToast({
      tone: 'success',
      title: this.locale.isAr() ? 'إن وُجد الحساب، سيصلك رابط إعادة التعيين' : 'If the account exists, a reset link will be sent',
    });
  }

  private succeed(created: boolean): void {
    this.busy = false;
    this.store.hydrateFromApi();
    this.store.pushToast({
      tone: 'success',
      title: created
        ? this.locale.isAr()
          ? 'تم إنشاء الحساب'
          : 'Account created'
        : this.locale.isAr()
          ? 'أهلاً بعودتك'
          : 'Welcome back',
    });
    if (this.session.isAdmin()) {
      void this.router.navigateByUrl('/admin');
      return;
    }
    if (!this.store.fulfillCartAfterLogin()) {
      void this.router.navigateByUrl(this.redirectTo());
    }
  }

  private redirectTo(): string {
    const next = this.route.snapshot.queryParamMap.get('redirect') || '';
    if (this.session.isAdmin()) {
      return next.startsWith('/admin') ? next : '/admin';
    }
    if (next.startsWith('/') && !next.startsWith('/admin')) return next;
    return '/account';
  }

  private fail(err: unknown): void {
    this.busy = false;
    const code = err instanceof Error ? err.message : '';
    if (code === 'NO_TOKEN') {
      this.error = this.locale.isAr()
        ? 'السيرفر رد بالدخول، من غير توكن. جرّب رقم الجوال بصيغة 01XXXXXXXXX.'
        : 'The server accepted login without a token. Try the mobile as 01XXXXXXXXX.';
      return;
    }
    if (code && code !== 'LOGIN' && code !== 'REGISTER') {
      this.error = /<[a-z!/]/i.test(code) || /عطل في الخادم/i.test(code)
        ? this.locale.isAr()
          ? 'الخادم رفض تسجيل الدخول. اكتب رقم الجوال بدون + أو مسافات.'
          : 'The server rejected sign-in. Enter the mobile number without + or spaces.'
        : code;
      return;
    }
    this.error = this.locale.isAr() ? 'تعذر إتمام العملية. حاول مرة أخرى.' : 'Could not complete this. Try again.';
  }
}

function toApiUserName(_displayName: string, phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return (digits ? `user${digits}` : 'user').slice(0, 32);
}
