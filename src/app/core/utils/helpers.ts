import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/** MOCK BOUNDARY: replace with real HTTP latency / interceptors. */
export function mockDelay<T>(value: T, ms = 380): Observable<T> {
  return of(value).pipe(delay(ms));
}

export function formatEgp(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export const STORAGE_KEYS = {
  cart: 'almanbat.cart',
  wishlist: 'almanbat.wishlist',
  auth: 'almanbat.auth',
  customers: 'almanbat.customers',
  orders: 'almanbat.orders',
  searches: 'almanbat.recent-searches',
  viewed: 'almanbat.recently-viewed',
  announce: 'almanbat.announce-dismissed',
  addresses: 'almanbat.addresses',
};
