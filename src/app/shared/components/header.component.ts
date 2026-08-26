import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { SearchHistoryService, UiService } from '../../core/services/ui.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="bar" *ngIf="!ui.announceDismissed()" role="region" aria-label="شريط التنبيهات">
      <p>توصيل سريع وآمن لباب بيتك <span>•</span> عروض حصرية كل أسبوع</p>
      <button class="close" type="button" (click)="ui.dismissAnnounce()" aria-label="إخفاء التنبيه">
        <app-icon name="close" [size]="16"></app-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .bar {
        background: var(--color-primary-olive);
        color: var(--color-soft-ivory);
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 6px 40px;
        font-size: 13px;
        font-weight: 500;
        position: relative;
      }
      span {
        color: var(--color-olive-gold);
        padding: 0 8px;
      }
      .close {
        position: absolute;
        inset-inline-start: 12px;
        color: var(--color-soft-ivory);
        display: none;
      }
      @media (max-width: 767px) {
        .close {
          display: inline-flex;
        }
        .bar p {
          font-size: 12px;
        }
      }
    `,
  ],
})
export class AnnouncementComponent {
  constructor(public ui: UiService) {}
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  template: `
    <header class="header">
      <div class="row container">
        <button class="icon-btn mobile-only" type="button" (click)="ui.openMenu()" aria-label="فتح القائمة">
          <app-icon name="menu"></app-icon>
        </button>
        <app-logo [height]="isCompact ? 40 : 54"></app-logo>
        <form class="search desktop-only" (submit)="goSearch($event)">
          <app-icon name="search" [size]="18"></app-icon>
          <input
            type="search"
            placeholder="ابحث عن منتج، قسم، أو علامة تجارية"
            [value]="query"
            (input)="query = $any($event.target).value"
            (focus)="ui.openSearch()"
            aria-label="البحث في المتجر"
          />
        </form>
        <div class="actions">
          <button class="icon-btn mobile-only" type="button" (click)="ui.openSearch()" aria-label="بحث">
            <app-icon name="search"></app-icon>
          </button>
          <a class="icon-btn desktop-only" routerLink="/account" aria-label="حسابي" title="حسابي">
            <app-icon name="user"></app-icon>
          </a>
          <a class="icon-btn desktop-only" routerLink="/account/wishlist" aria-label="المفضلة" title="المفضلة">
            <app-icon name="heart"></app-icon>
            <span class="badge-count" *ngIf="wishlist.count()">{{ wishlist.count() }}</span>
          </a>
          <button class="icon-btn" type="button" (click)="ui.openCart()" aria-label="السلة" title="السلة">
            <app-icon name="cart"></app-icon>
            <span class="badge-count" *ngIf="cart.count()">{{ cart.count() }}</span>
          </button>
        </div>
      </div>
      <nav class="nav desktop-only" aria-label="أقسام المتجر">
        <div class="container links">
          <a routerLink="/shop" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">كل المنتجات</a>
          <a routerLink="/category/groceries" routerLinkActive="active">مواد غذائية</a>
          <a routerLink="/category/beauty" routerLinkActive="active">تجميل وعناية</a>
          <a routerLink="/category/appliances" routerLinkActive="active">أجهزة كهربائية</a>
          <a routerLink="/category/electronics" routerLinkActive="active">إلكترونيات</a>
          <a routerLink="/category/offers" routerLinkActive="active">العروض</a>
          <a routerLink="/category/best-sellers" routerLinkActive="active">الأكثر مبيعاً</a>
        </div>
      </nav>
    </header>
  `,
  styles: [
    `
      .header {
        background: var(--color-deep-olive);
        color: var(--color-soft-ivory);
        position: sticky;
        top: 0;
        z-index: var(--z-header);
        box-shadow: var(--shadow-header);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 16px;
        min-height: 72px;
      }
      .search {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(238, 230, 201, 0.1);
        border: 1px solid rgba(238, 230, 201, 0.18);
        border-radius: 999px;
        padding: 0 16px;
        max-width: 560px;
        margin-inline: auto;
      }
      .search input {
        flex: 1;
        background: transparent;
        border: 0;
        color: var(--color-soft-ivory);
        min-height: 44px;
      }
      .search input::placeholder {
        color: rgba(238, 230, 201, 0.7);
      }
      .actions {
        display: flex;
        align-items: center;
        margin-inline-start: auto;
      }
      .nav {
        border-top: 1px solid rgba(238, 230, 201, 0.12);
      }
      .links {
        display: flex;
        gap: 8px;
        overflow: auto;
      }
      .links a {
        padding: 12px 10px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        color: rgba(238, 230, 201, 0.82);
      }
      .links a.active,
      .links a:hover {
        color: var(--color-olive-gold);
        border-bottom-color: var(--color-olive-gold);
      }
      .mobile-only {
        display: none;
      }
      @media (max-width: 1023px) {
        .desktop-only {
          display: none !important;
        }
        .mobile-only {
          display: inline-flex;
        }
        .row {
          min-height: 60px;
          justify-content: space-between;
        }
        app-logo {
          margin-inline: auto;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  query = '';
  isCompact = false;
  constructor(
    public ui: UiService,
    public cart: CartService,
    public wishlist: WishlistService,
    private router: Router,
    private history: SearchHistoryService
  ) {}

  goSearch(ev: Event): void {
    ev.preventDefault();
    const q = this.query.trim();
    if (!q) {
      this.ui.openSearch();
      return;
    }
    this.history.add(q);
    this.ui.searchOpen.set(false);
    this.router.navigate(['/search'], { queryParams: { q } });
  }
}
