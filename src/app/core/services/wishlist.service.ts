import { Injectable, computed, signal } from '@angular/core';
import { STORAGE_KEYS, storageGet, storageSet } from '../utils/helpers';

/** MOCK BOUNDARY: persist wishlist against authenticated customer later. */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly ids = signal<string[]>(storageGet<string[]>(STORAGE_KEYS.wishlist, []));
  readonly list = computed(() => this.ids());
  readonly count = computed(() => this.ids().length);

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): boolean {
    const next = this.has(id) ? this.ids().filter((x) => x !== id) : [...this.ids(), id];
    this.ids.set(next);
    storageSet(STORAGE_KEYS.wishlist, next);
    return next.includes(id);
  }

  remove(id: string): void {
    const next = this.ids().filter((x) => x !== id);
    this.ids.set(next);
    storageSet(STORAGE_KEYS.wishlist, next);
  }
}
