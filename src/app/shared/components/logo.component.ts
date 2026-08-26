import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a class="logo" routerLink="/" [attr.aria-label]="'المنبت — سر الخير'">
      <img
        src="assets/brand/logo.png"
        alt="شعار المنبت: شجرة بجذور داخل دائرة مع كلمة المنبت وشعار سر الخير"
        [class]="variant"
        [style.height.px]="height"
      />
    </a>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
        line-height: 0;
      }
      img {
        width: auto;
        object-fit: contain;
      }
      img.on-dark {
        mix-blend-mode: normal;
      }
      img.on-light {
        background: #3f5d2a;
        border-radius: 12px;
        padding: 4px 8px;
      }
    `,
  ],
})
export class LogoComponent {
  @Input() variant: 'on-dark' | 'on-light' = 'on-dark';
  @Input() height = 56;
}
