import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './auth.page.html',
})
export class AuthPageComponent implements OnInit {
  signup = false;
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  phone = '';
  error = '';
  showPassword = false;
  images = images;

  constructor(
    public locale: LocaleService,
    private route: ActivatedRoute,
    private router: Router,
    private store: StoreService
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((url) => {
      this.signup = url[0]?.path === 'signup';
      this.error = '';
    });
  }

  scrimClass(): string {
    return this.locale.isAr()
      ? 'bg-gradient-to-l from-sand-50/92 via-sand-50/70 to-transparent'
      : 'bg-gradient-to-r from-sand-50/92 via-sand-50/70 to-transparent';
  }

  submit(ev: Event): void {
    ev.preventDefault();
    this.error = '';
    if (!this.email.includes('@') || this.password.length < 4) {
      this.error = this.locale.isAr() ? 'تحقق من البريد وكلمة المرور.' : 'Check your email and password.';
      return;
    }
    this.store.pushToast({
      tone: 'success',
      title: this.signup
        ? this.locale.isAr()
          ? 'تم إنشاء الحساب'
          : 'Account created'
        : this.locale.isAr()
          ? 'أهلاً بعودتك'
          : 'Welcome back',
    });
    this.router.navigateByUrl('/account');
  }

  forgot(): void {
    this.store.pushToast({
      tone: 'success',
      title: this.locale.isAr() ? 'إن وُجد الحساب، سيصلك رابط إعادة التعيين' : 'If the account exists, a reset link will be sent',
    });
  }
}
