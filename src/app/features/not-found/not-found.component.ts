import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <img src="assets/brand/logo.png" alt="" />
      <h1>404</h1>
      <p>عذراً، الصفحة غير موجودة</p>
      <a class="btn btn-gold" routerLink="/">العودة للرئيسية</a>
    </div>
  `,
  styles: [
    `
      .wrap {
        min-height: 70vh;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 48px 16px;
      }
      img {
        width: 140px;
        border-radius: 16px;
      }
    `,
  ],
})
export class NotFoundComponent {}
