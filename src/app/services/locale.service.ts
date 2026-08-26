import { Injectable, computed, effect, signal } from '@angular/core';
import type { Bilingual, Locale } from '../types';
import { copy } from '../data/copy';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<Locale>('ar');
  readonly dir = computed(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));
  readonly isAr = computed(() => this.locale() === 'ar');

  constructor() {
    effect(() => {
      const dir = this.dir();
      const locale = this.locale();
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', locale);
    });
  }

  ui(key: keyof typeof copy): string {
    return copy[key][this.locale()];
  }

  tr(value: Bilingual): string {
    return value[this.locale()];
  }

  toggle(): void {
    this.locale.set(this.locale() === 'ar' ? 'en' : 'ar');
  }
}
