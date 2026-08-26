import type { Bilingual, Locale } from '../types';

export function t(value: Bilingual, locale: Locale): string {
  return value[locale];
}

export function formatPrice(amount: number, locale: Locale): string {
  const value = amount.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return locale === 'ar' ? `${value} ر.س` : `SAR ${value}`;
}

export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((compareAt - price) / compareAt * 100);
}

export function formatCount(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US');
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}