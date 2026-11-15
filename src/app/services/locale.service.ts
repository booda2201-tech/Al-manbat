import { Injectable, computed, effect, signal } from '@angular/core';
import type { Bilingual, Locale } from '../types';
import { copy } from '../data/copy';
import { latinDigits } from '../utils/format';

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
    return latinDigits(copy[key][this.locale()]);
  }

  tr(value: Bilingual): string {
    return latinDigits(value[this.locale()] || '');
  }

  digits(value: string | null | undefined): string {
    return latinDigits(value || '');
  }

  toggle(): void {
    this.locale.set(this.locale() === 'ar' ? 'en' : 'ar');
  }
}
