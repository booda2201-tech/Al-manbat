import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <ng-container *ngIf="ui.menuOpen()">
      <div class="overlay" (click)="ui.menuOpen.set(false)"></div>
      <aside class="drawer drawer-start" role="dialog" aria-label="القائمة">
        <header>
          <strong>المنبت</strong>
          <button type="button" (click)="ui.menuOpen.set(false)" aria-label="إغلاق">
            <app-icon name="close"></app-icon>
          </button>
        </header>
        <nav>
          <a routerLink="/" (click)="close()">الرئيسية</a>
          <a routerLink="/shop" (click)="close()">كل المنتجات</a>
          <button type="button" (click)="cats = !cats" [attr.aria-expanded]="cats">الأقسام</button>
          <div class="sub" *ngIf="cats">
            <a routerLink="/category/groceries" (click)="close()">مواد غذائية</a>
            <a routerLink="/category/beauty" (click)="close()">تجميل وعناية</a>
            <a routerLink="/category/appliances" (click)="close()">أجهزة كهربائية</a>
            <a routerLink="/category/electronics" (click)="close()">إلكترونيات</a>
          </div>
          <a routerLink="/category/offers" (click)="close()">العروض</a>
          <a routerLink="/category/best-sellers" (click)="close()">الأكثر مبيعاً</a>
          <a routerLink="/account" (click)="close()">حسابي</a>
          <a routerLink="/account/wishlist" (click)="close()">المفضلة</a>
          <a routerLink="/contact" (click)="close()">تواصل معنا</a>
        </nav>
      </aside>
    </ng-container>
  `,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        padding: 16px;
      }
      nav {
        display: flex;
        flex-direction: column;
        padding: 8px 16px 32px;
      }
      a,
      button {
        text-align: right;
        padding: 12px 0;
        font-weight: 700;
        border-bottom: 1px solid var(--color-border);
      }
      .sub a {
        font-weight: 500;
        padding-inline-start: 12px;
      }
    `,
  ],
})
export class MobileMenuComponent {
  cats = false;
  constructor(public ui: UiService) {}
  close(): void {
    this.ui.menuOpen.set(false);
  }
}
