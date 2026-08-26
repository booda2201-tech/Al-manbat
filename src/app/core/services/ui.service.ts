import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, storageGet, storageSet } from '../utils/helpers';

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly searchOpen = signal(false);
  readonly cartOpen = signal(false);
  readonly menuOpen = signal(false);
  readonly filtersOpen = signal(false);
  readonly quickViewSlug = signal<string | null>(null);
  readonly announceDismissed = signal(storageGet(STORAGE_KEYS.announce, false));

  openSearch(): void {
    this.searchOpen.set(true);
    this.closeOthers('search');
  }
  openCart(): void {
    this.cartOpen.set(true);
    this.closeOthers('cart');
  }
  openMenu(): void {
    this.menuOpen.set(true);
    this.closeOthers('menu');
  }
  openFilters(): void {
    this.filtersOpen.set(true);
  }
  openQuickView(slug: string): void {
    this.quickViewSlug.set(slug);
  }
  closeQuickView(): void {
    this.quickViewSlug.set(null);
  }
  closeAll(): void {
    this.searchOpen.set(false);
    this.cartOpen.set(false);
    this.menuOpen.set(false);
    this.filtersOpen.set(false);
  }
  dismissAnnounce(): void {
    this.announceDismissed.set(true);
    storageSet(STORAGE_KEYS.announce, true);
  }

  private closeOthers(keep: 'search' | 'cart' | 'menu'): void {
    if (keep !== 'search') this.searchOpen.set(false);
    if (keep !== 'cart') this.cartOpen.set(false);
    if (keep !== 'menu') this.menuOpen.set(false);
  }
}

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  add(id: string): void {
    const ids = storageGet<string[]>(STORAGE_KEYS.viewed, []).filter((x) => x !== id);
    ids.unshift(id);
    storageSet(STORAGE_KEYS.viewed, ids.slice(0, 8));
  }

  ids(): string[] {
    return storageGet<string[]>(STORAGE_KEYS.viewed, []);
  }
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  list(): string[] {
    return storageGet<string[]>(STORAGE_KEYS.searches, []);
  }

  add(query: string): void {
    const q = query.trim();
    if (!q) return;
    const next = [q, ...this.list().filter((x) => x !== q)].slice(0, 6);
    storageSet(STORAGE_KEYS.searches, next);
  }

  clear(): void {
    storageSet(STORAGE_KEYS.searches, []);
  }
}
