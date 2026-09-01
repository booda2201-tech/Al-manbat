import type { Category, Product, Review, Subcategory } from '../types';
import type { ApiCategory, ApiProduct } from './api.models';

const ACCENTS: Category['accent'][] = ['olive', 'gold', 'clay', 'dark'];
const FALLBACK_IMAGE = 'assets/catalog/cat-oil-banner.png';

export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'item';
}

export function categorySlugFromApi(dto: ApiCategory): string {
  return slugify(dto.nameEn || dto.name || `category-${dto.id}`);
}

function bilingual(ar?: string | null, en?: string | null, fallback = ''): { ar: string; en: string } {
  const arabic = (ar || en || fallback).trim();
  const english = (en || ar || fallback).trim();
  return { ar: arabic, en: english };
}

function parseDeliveryDays(text?: string | null): number {
  const match = text?.match(/(\d+)/);
  return match ? Number(match[1]) : 3;
}

function isFreeShipping(ar?: string | null, en?: string | null): boolean {
  const hay = `${ar ?? ''} ${en ?? ''}`.toLowerCase();
  return /free|مجاني/.test(hay);
}

function zipHighlights(ar?: string[] | null, en?: string[] | null): Product['highlights'] {
  const a = ar?.filter(Boolean) ?? [];
  const e = en?.filter(Boolean) ?? [];
  const len = Math.max(a.length, e.length);
  const out: Product['highlights'] = [];
  for (let i = 0; i < len; i++) {
    out.push(bilingual(a[i], e[i]));
  }
  return out;
}

export function mapProduct(
  dto: ApiProduct,
  categorySlug: string,
  extras?: { bestSellerIds?: Set<number> }
): Product {
  const name = bilingual(dto.nameAr, dto.nameEn, dto.name || `Product ${dto.id}`);
  const finalPrice = dto.finalPrice ?? dto.price;
  const listPrice = dto.price;
  const onOffer = !!dto.hasOffer && listPrice > finalPrice;
  const images = (dto.imageUrls ?? []).filter(Boolean);
  const image = images[0] || FALLBACK_IMAGE;
  const varietySlug = slugify(dto.varietyEn || dto.varietyAr || dto.sizeEn || 'all');
  const badges: Product['badges'] = [];
  if (dto.isNew) badges.push('new');
  if (onOffer) badges.push('deal');
  if (extras?.bestSellerIds?.has(dto.id)) badges.push('bestseller');
  const organicHay = `${dto.categoryNameEn ?? ''} ${dto.categoryNameAr ?? ''} ${dto.nameEn ?? ''}`.toLowerCase();
  if (/organic|عضوي/.test(organicHay)) badges.push('organic');

  const specs: Product['specs'] = [];
  if (dto.sizeEn || dto.sizeAr) {
    specs.push({ label: { ar: 'الحجم', en: 'Volume' }, value: bilingual(dto.sizeAr, dto.sizeEn) });
  }
  if (dto.originEn || dto.originAr) {
    specs.push({ label: { ar: 'المنشأ', en: 'Origin' }, value: bilingual(dto.originAr, dto.originEn) });
  }
  if (dto.varietyEn || dto.varietyAr) {
    specs.push({ label: { ar: 'الصنف', en: 'Varietal' }, value: bilingual(dto.varietyAr, dto.varietyEn) });
  }
  if (dto.acidity != null) {
    specs.push({
      label: { ar: 'الحموضة', en: 'Acidity' },
      value: { ar: `${dto.acidity}%`, en: `${dto.acidity}%` },
    });
  }
  if (dto.harvestEn || dto.harvestAr) {
    specs.push({ label: { ar: 'الحصاد', en: 'Harvest' }, value: bilingual(dto.harvestAr, dto.harvestEn) });
  }

  return {
    id: String(dto.id),
    slug: `${slugify(dto.nameEn || dto.nameAr || name.en)}-${dto.id}`,
    name,
    brand: bilingual(dto.originAr, dto.originEn, 'Almanbat'),
    category: categorySlug,
    subcategory: varietySlug,
    price: finalPrice,
    compareAt: onOffer ? listPrice : undefined,
    rating: dto.averageRating ?? 0,
    reviews: dto.reviewsCount ?? 0,
    stock: dto.isAvailable === false ? 0 : 24,
    image,
    gallery: images.length ? images : [image],
    badges,
    deliveryDays: parseDeliveryDays(dto.deliveryEn || dto.deliveryAr || dto.delivery),
    freeShipping: isFreeShipping(dto.deliveryAr, dto.deliveryEn),
    highlights: zipHighlights(dto.highlightsAr, dto.highlightsEn),
    specs,
    description: bilingual(dto.descriptionAr, dto.descriptionEn, dto.description || ''),
  };
}

export function mapCategory(dto: ApiCategory, index: number, products: Product[]): Category {
  const slug = categorySlugFromApi(dto);
  const inCat = products.filter((p) => p.category === slug);
  const varietyMap = new Map<string, Subcategory>();
  for (const p of inCat) {
    const key = p.subcategory;
    const existing = varietyMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      const spec = p.specs.find((s) => s.label.en === 'Varietal');
      varietyMap.set(key, {
        slug: key,
        name: spec?.value ?? { ar: p.subcategory, en: p.subcategory },
        count: 1,
      });
    }
  }
  const story = bilingual(dto.descriptionAr, dto.descriptionEn, dto.description || '');
  return {
    slug,
    name: bilingual(dto.nameAr, dto.nameEn, dto.name || slug),
    tagline: story,
    story,
    image: dto.imageUrl || FALLBACK_IMAGE,
    accent: ACCENTS[index % ACCENTS.length],
    subcategories: Array.from(varietyMap.values()),
  };
}

export function mapReview(raw: unknown): Review | null {
  if (!raw || typeof raw !== 'object') return null;
  const dto = raw as Record<string, unknown>;
  const rating = Number(dto['rating'] ?? dto['stars']);
  if (!Number.isFinite(rating) || rating < 1) return null;
  const id = dto['id'] ?? dto['reviewId'];
  const name = String(dto['userName'] ?? dto['author'] ?? dto['fullName'] ?? '').trim() || 'Almanbat';
  const comment = String(dto['comment'] ?? dto['body'] ?? dto['text'] ?? '').trim();
  const created = String(dto['createdAt'] ?? dto['date'] ?? '');
  const parts = comment.split(/\n\n+/);
  const title = parts.length > 1 ? parts[0] : '';
  const body = parts.length > 1 ? parts.slice(1).join('\n\n') : comment;
  return {
    id: id != null && String(id) ? String(id) : `r-${name}-${created || rating}`,
    author: { ar: name, en: name },
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    date: created.slice(0, 10),
    title: { ar: title, en: title },
    body: { ar: body, en: body },
    verified: true,
  };
}

export function hydrateCatalog(
  apiProducts: ApiProduct[],
  apiCategories: ApiCategory[],
  bestSellers: ApiProduct[]
): { products: Product[]; categories: Category[] } {
  const slugById = new Map<number, string>();
  for (const cat of apiCategories) {
    slugById.set(cat.id, categorySlugFromApi(cat));
  }
  const bestSellerIds = new Set(bestSellers.map((p) => p.id));
  const products = apiProducts.map((dto) =>
    mapProduct(dto, slugById.get(dto.categoryId) || slugify(dto.categoryNameEn || `category-${dto.categoryId}`), {
      bestSellerIds,
    })
  );
  const categories = apiCategories.map((dto, i) => mapCategory(dto, i, products));
  return { products, categories };
}
