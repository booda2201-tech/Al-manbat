import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { copy } from './data/copy';
import { LocaleService } from './services/locale.service';
import { CatalogService } from './services/catalog.service';
import { StoreService } from './services/store.service';
import { SessionService } from './services/session.service';
import { AuthApiService } from './services/auth-api.service';
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
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('catRow') catRow?: ElementRef<HTMLElement>;
  @ViewChild('catMeasure') catMeasure?: ElementRef<HTMLElement>;
  openMenu: string | null = null;
  openMore = false;
  catLimit = 4;
  showNewLink = false;
  showAboutLink = false;
  private navObserver: ResizeObserver | null = null;
  query = '';
  promo = '';
  email = '';
  subscribed = false;
  tickerItems: Array<{ label: Bilingual; to?: string }> = [
    { label: copy['announcement1'], to: '/offers' },
    { label: copy['announcement5'] },
    { label: copy['announcement2'] },
    { label: copy['announcement4'], to: '/listing/extra-virgin' },
    { label: copy['announcement7'], to: '/listing/extra-virgin' },
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

  constructor(
    public locale: LocaleService,
    public store: StoreService,
    public catalog: CatalogService,
    public session: SessionService,
    private auth: AuthApiService,
    private router: Router,
    private zone: NgZone
  ) {
    effect((onCleanup) => {
      const lock = this.store.menuOpen() || this.store.searchOpen() || this.store.cartOpen();
      document.body.style.overflow = lock ? 'hidden' : '';
      onCleanup(() => {
        document.body.style.overflow = '';
      });
    });
    effect(() => {
      this.locale.locale();
      this.catalog.categories().length;
      queueMicrotask(() => this.fitCats());
    });
  }

  ngOnInit(): void {
    if (this.session.dropIfExpired()) {
      const path = this.router.url.split('?')[0];
      if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/account')) {
        void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      }
    } else {
      this.auth.refreshProfile().subscribe();
    }
    this.syncLayout(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart && e.url.split('?')[0] === '/cart') {
        this.store.requestCartOpen();
      }
    });
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split('?')[0];
      const stayOnAdmin = this.focusLayout && (path === '/admin' || path.startsWith('/admin/'));
      this.syncLayout(e.urlAfterRedirects);
      this.openMenu = null;
      this.openMore = false;
      this.store.menuOpen.set(false);
      this.store.searchOpen.set(false);
      this.store.cartOpen.set(this.store.consumeCartOpenRequest());
      if (!stayOnAdmin) {
        window.scrollTo(0, 0);
      }
    });
  }

  private syncLayout(url: string): void {
    const path = url.split('?')[0];
    this.bareLayout = path === '/login' || path === '/signup';
    this.focusLayout = path === '/checkout' || path === '/admin' || path.startsWith('/admin/');
    if (this.bareLayout || this.focusLayout) {
      this.openMenu = null;
      this.openMore = false;
      this.store.menuOpen.set(false);
      this.store.searchOpen.set(false);
    }
    this.heroBleed =
      path === '/' ||
      path === '' ||
      path === '/about' ||
      path === '/offers' ||
      path === '/new' ||
      path === '/maintenance' ||
      path.startsWith('/category/');
  }

  ngAfterViewInit(): void {
    const row = this.catRow?.nativeElement;
    if (row && typeof ResizeObserver !== 'undefined') {
      this.navObserver = new ResizeObserver(() => this.zone.run(() => this.fitCats()));
      this.navObserver.observe(row);
    }
    this.fitCats();
  }

  ngOnDestroy(): void {
    this.navObserver?.disconnect();
  }

  private fitCats(): void {
    const row = this.catRow?.nativeElement;
    const measure = this.catMeasure?.nativeElement;
    if (!row || !measure) return;
    const cats = Array.from(measure.querySelectorAll<HTMLElement>('[data-kind="cat"]'));
    if (!cats.length) return;

    const boxOf = (kind: string) => {
      const el = measure.querySelector<HTMLElement>(`[data-kind="${kind}"]`);
      if (!el) return 0;
      const s = getComputedStyle(el);
      return el.offsetWidth + (parseFloat(s.marginInlineStart) || 0) + (parseFloat(s.marginInlineEnd) || 0);
    };
    const moreW = boxOf('more');
    const sepW = boxOf('sep');
    const offersW = boxOf('offers');
    const newW = boxOf('new');
    const aboutW = boxOf('about');
    const styles = getComputedStyle(row);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const pad = (parseFloat(styles.paddingInlineStart) || 0) + (parseFloat(styles.paddingInlineEnd) || 0);
    const budget = row.clientWidth - pad;
    if (budget < 80) return;

    const catsWidth = (n: number) => {
      let total = 0;
      for (let i = 0; i < n; i++) total += cats[i].offsetWidth;
      return total;
    };
    const layoutWidth = (n: number, more: boolean, showNew: boolean, showAbout: boolean) => {
      const parts = n + 1 + (more ? 1 : 0) + 1 + (showNew ? 1 : 0) + (showAbout ? 1 : 0);
      return (
        catsWidth(n) +
        offersW +
        sepW +
        (more ? moreW : 0) +
        (showNew ? newW : 0) +
        (showAbout ? aboutW : 0) +
        Math.max(0, parts - 1) * gap
      );
    };

    let limit = cats.length;
    let showNew = true;
    let showAbout = true;
    if (layoutWidth(cats.length, false, true, true) <= budget) {
      /* all links fit */
    } else if (layoutWidth(cats.length, false, true, false) <= budget) {
      showAbout = false;
    } else if (layoutWidth(cats.length, false, false, false) <= budget) {
      showNew = false;
      showAbout = false;
    } else {
      showNew = false;
      showAbout = false;
      limit = 1;
      for (let n = cats.length - 1; n >= 1; n--) {
        if (layoutWidth(n, true, false, false) <= budget) {
          limit = n;
          break;
        }
      }
    }

    if (limit !== this.catLimit || showNew !== this.showNewLink || showAbout !== this.showAboutLink) {
      this.catLimit = limit;
      this.showNewLink = showNew;
      this.showAboutLink = showAbout;
      this.openMore = false;
    }
  }

  get navCategories(): Category[] {
    return this.categories.slice(0, this.catLimit);
  }

  get moreCategories(): Category[] {
    return this.categories.slice(this.catLimit);
  }

  openCat(slug: string): void {
    this.openMore = false;
    this.openMenu = this.openMenu === slug ? null : slug;
  }

  toggleMoreMenu(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.openMenu = null;
    this.openMore = !this.openMore;
  }

  hoverCat(slug: string): void {
    this.openMore = false;
    this.openMenu = slug;
  }

  @HostListener('document:click', ['$event'])
  closeMenusOnOutside(ev: MouseEvent): void {
    if (!this.openMenu && !this.openMore) return;
    const el = ev.target as HTMLElement | null;
    if (el?.closest('header')) return;
    this.openMenu = null;
    this.openMore = false;
  }

  get categories() {
    return this.catalog.categories();
  }

  searchHits() {
    const q = this.query.trim();
    return this.catalog.search(q, q ? 6 : 5);
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

  accountHref(): string {
    return this.session.isAdmin() ? '/admin' : '/account';
  }

  accountLabel(): string {
    return this.session.isAdmin() ? this.locale.ui('adminPanel') : this.locale.ui('account');
  }

  get openCategory(): Category | null {
    return this.categories.find((c) => c.slug === this.openMenu) ?? null;
  }

  menuProducts(slug: string): Product[] {
    return this.catalog.byCategory(slug).slice(0, 3);
  }

  navCatClass(slug: string): string {
    return this.openMenu === slug ? 'text-olive-700' : 'text-ink-soft hover:text-olive-700';
  }

  get menuCatsFew(): boolean {
    return this.categories.length <= 5;
  }

  get menuCatsOdd(): boolean {
    return this.categories.length % 2 === 1;
  }
}
