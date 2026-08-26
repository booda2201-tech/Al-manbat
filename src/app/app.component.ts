import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { categories } from './data/categories';
import { copy } from './data/copy';
import { byCategory, products } from './data/products';
import { LocaleService } from './services/locale.service';
import { StoreService } from './services/store.service';
import { IconComponent } from './ui/icon.component';
import { LogoComponent } from './ui/logo.component';
import { CartDrawerComponent } from './ui/cart-drawer.component';
import { CountPipe, SarPipe } from './utils/sar.pipe';
import type { Bilingual, Category, Product } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    LogoComponent,
    CartDrawerComponent,
    SarPipe,
    CountPipe,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  categories = categories;
  openMenu: string | null = null;
  query = '';
  promo = '';
  email = '';
  subscribed = false;
  tickerItems: Array<{ label: Bilingual; to?: string }> = [
    { label: copy['announcement1'], to: '/offers' },
    { label: copy['announcement5'] },
    { label: copy['announcement2'] },
    { label: copy['announcement4'], to: '/listing/olive-oil' },
    { label: copy['announcement7'], to: '/listing/olive-oil' },
    { label: copy['announcement6'] },
    { label: copy['announcement3'], to: '/support' },
  ];
  footerCols = [
    {
      title: { ar: 'خدمة العملاء', en: 'Customer care' },
      links: [
        { label: { ar: 'الأسئلة الشائعة', en: 'FAQ' }, to: '/faq' },
        { label: { ar: 'تتبع الطلب', en: 'Track order' }, to: '/track' },
        { label: { ar: 'الدعم', en: 'Support' }, to: '/support' },
      ],
    },
    {
      title: { ar: 'المنبت', en: 'Almanbat' },
      links: [
        { label: { ar: 'قصتنا', en: 'Our story' }, to: '/about' },
        { label: { ar: 'تسجيل الدخول', en: 'Sign in' }, to: '/login' },
        { label: { ar: 'العروض', en: 'Offers' }, to: '/offers' },
        { label: { ar: 'وصل حديثاً', en: 'New arrivals' }, to: '/new' },
      ],
    },
  ];
  payments = ['mada', 'VISA', 'Mastercard', 'Apple Pay', 'tabby', 'tamara'];
  bareLayout = false;
  focusLayout = false;
  heroBleed = false;

  constructor(public locale: LocaleService, public store: StoreService, private router: Router) {
    effect((onCleanup) => {
      const lock = this.store.menuOpen() || this.store.searchOpen() || this.store.cartOpen();
      document.body.style.overflow = lock ? 'hidden' : '';
      onCleanup(() => {
        document.body.style.overflow = '';
      });
    });
  }

  ngOnInit(): void {
    this.syncLayout(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.syncLayout(e.urlAfterRedirects);
      this.openMenu = null;
      this.store.menuOpen.set(false);
      this.store.searchOpen.set(false);
      this.store.cartOpen.set(false);
      window.scrollTo({ top: 0 });
    });
  }

  private syncLayout(url: string): void {
    const path = url.split('?')[0];
    this.bareLayout = path === '/login' || path === '/signup';
    this.focusLayout = path === '/checkout';
    this.heroBleed =
      path === '/' ||
      path === '' ||
      path === '/about' ||
      path === '/offers' ||
      path === '/new' ||
      path === '/maintenance' ||
      path.startsWith('/category/');
  }

  searchHits() {
    const q = this.query.trim().toLowerCase();
    if (!q) return products.slice(0, 5);
    return products.filter((p) => `${p.name.ar} ${p.name.en} ${p.brand.ar}`.toLowerCase().includes(q)).slice(0, 6);
  }

  goSearch(): void {
    const q = this.query.trim();
    this.store.searchOpen.set(false);
    this.router.navigate(['/search'], { queryParams: q ? { q } : {} });
  }

  applyPromo(): void {
    const ok = this.store.applyPromo(this.promo);
    this.store.pushToast({
      tone: ok ? 'success' : 'warning',
      title: ok ? this.locale.ui('promoApplied') : this.locale.ui('promoInvalid'),
    });
  }

  subscribe(ev: Event): void {
    ev.preventDefault();
    if (this.email.includes('@')) this.subscribed = true;
  }

  get openCategory(): Category | null {
    return this.categories.find((c) => c.slug === this.openMenu) ?? null;
  }

  menuProducts(slug: string): Product[] {
    return byCategory(slug).slice(0, 3);
  }

  navCatClass(slug: string): string {
    return this.openMenu === slug ? 'text-olive-700' : 'text-ink-soft hover:text-olive-700';
  }

  get menuCatsOdd(): boolean {
    return this.categories.length % 2 === 1;
  }

  menuCatSpan(last: boolean): string {
    return last && this.menuCatsOdd ? 'md:col-span-2' : '';
  }

  menuCatHeight(last: boolean): string {
    return last && this.menuCatsOdd ? 'md:h-52' : 'md:h-44';
  }
}
