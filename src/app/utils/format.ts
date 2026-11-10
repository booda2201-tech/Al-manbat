import type { Bilingual, Locale } from '../types';

export function t(value: Bilingual, locale: Locale): string {
  return value[locale];
}

export function formatPrice(amount: number, locale: Locale): string {
  const value = amount.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return locale === 'ar' ? `${value} ج.م` : `EGP ${value}`;
}

export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((compareAt - price) / compareAt * 100);
}

export function offerWindowLabel(
  days: number | null | undefined,
  endsAt: string | null | undefined,
  locale: Locale
): string {
  const ar = locale === 'ar';
  const parts: string[] = [];
  if (days != null && Number.isFinite(days)) {
    if (days <= 0) parts.push(ar ? 'ينتهي اليوم' : 'Ends today');
    else parts.push(ar ? `متبقي ${days} يوم` : `${days} day${days === 1 ? '' : 's'} left`);
  }
  if (endsAt) {
    const date = new Date(endsAt);
    if (!Number.isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
      parts.push(ar ? `حتى ${formatted}` : `until ${formatted}`);
    }
  }
  return parts.join(' · ');
}

export function formatCount(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}