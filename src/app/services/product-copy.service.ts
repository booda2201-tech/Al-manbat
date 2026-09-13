import type { ApiCategory, ApiProduct } from '../api/api.models';

export interface ProductCopyDraft {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  categoryId: number;
  deliveryAr: string;
  deliveryEn: string;
  sizeAr: string;
  sizeEn: string;
  originAr: string;
  originEn: string;
  varietyAr: string;
  varietyEn: string;
  acidity: number | null;
  harvestAr: string;
  harvestEn: string;
  highlightsAr: string;
  highlightsEn: string;
  discountPercent: number;
  discountDays: number;
  hasOffer: boolean;
  isNew: boolean;
  isAvailable: boolean;
}

export interface ProductCopySuggestion {
  id: string;
  key: keyof ProductCopyDraft | 'images';
  labelAr: string;
  labelEn: string;
  previewAr: string;
  previewEn: string;
  value?: string | number | boolean | null;
  extra?: Partial<ProductCopyDraft>;
}

export interface ProductCopyResult {
  draft: Partial<ProductCopyDraft>;
  summaryAr: string;
  summaryEn: string;
  suggestions: ProductCopySuggestion[];
}

const WORD: Array<[RegExp, string]> = [
  [/زيتون/g, 'olive'],
  [/زيت/g, 'oil'],
  [/بكر ممتاز|اكسترا فيرجن|إكسترا فيرجن/g, 'extra virgin'],
  [/معصور على البارد|عصر بارد/g, 'cold-pressed'],
  [/مخلل|مخللات/g, 'pickled'],
  [/عسل/g, 'honey'],
  [/تمر/g, 'dates'],
  [/طماطم|بندورة/g, 'tomato'],
  [/ثوم/g, 'garlic'],
  [/ليمون/g, 'lemon'],
  [/فلفل/g, 'pepper'],
  [/ملح/g, 'salt'],
  [/هدية|هديه|بوكس/g, 'gift'],
  [/تنك|تانك/g, 'tin'],
  [/صفيحة/g, 'can'],
  [/زجاجة|قنينة/g, 'bottle'],
  [/مجموعة/g, 'set'],
  [/يوم[يى]/g, 'everyday'],
  [/حصاد/g, 'harvest'],
  [/موسم/g, 'season'],
];

const VARIETIES: Array<{ test: RegExp; ar: string; en: string }> = [
  { test: /كوراتينا|koroneiki/i, ar: 'كوراتينا', en: 'Koroneiki' },
  { test: /أربيكينا|اربيكينا|arbequina/i, ar: 'أربيكينا', en: 'Arbequina' },
  { test: /بيكوال|picual/i, ar: 'بيكوال', en: 'Picual' },
  { test: /صوري|صوريّ|suri/i, ar: 'صوري', en: 'Soury' },
  { test: /كلاماتا|كالاماتا|kalamata/i, ar: 'كالاماتا', en: 'Kalamata' },
  { test: /نبالي|nabali/i, ar: 'نبالي', en: 'Nabali' },
  { test: /مانزانيلا|manzanilla/i, ar: 'مانزانيلا', en: 'Manzanilla' },
  { test: /فرانتويو|frantoio/i, ar: 'فرانتويو', en: 'Frantoio' },
];

type DumpTarget =
  | keyof ProductCopyDraft
  | 'name'
  | 'description'
  | 'size'
  | 'origin'
  | 'variety'
  | 'harvest'
  | 'delivery'
  | 'highlights'
  | 'category';

const LABEL_RULES: Array<[RegExp, DumpTarget]> = [
  [/^(الاسمبالانجليزي|الاسمالانجليزي|الاسمانجليزي|englishname|nameen)$/, 'nameEn'],
  [/^(الاسمبالعربي|الاسمالعربي|الاسمعربي|arabicname|namear)$/, 'nameAr'],
  [/^(الاسم|اسمالمنتج|المنتج|name|title|product)$/, 'name'],
  [/^(الوصفبالانجليزي|الوصفالانجليزي|الوصفانجليزي|englishdescription|descriptionen|descen)$/, 'descriptionEn'],
  [/^(الوصفبالعربي|الوصفالعربي|الوصفعربي|arabicdescription|descriptionar|descar)$/, 'descriptionAr'],
  [/^(الوصف|التفاصيل|النبذه|النبذة|description|details|copy)$/, 'description'],
  [/^(الحجمبالانجليزي|الحجمالانجليزي|الحجمانجليزي|englishsize|sizeen)$/, 'sizeEn'],
  [/^(الحجمبالعربي|الحجمالعربي|الحجمعربي|arabicSize|sizear)$/, 'sizeAr'],
  [/^(الحجم|العبوه|العبوة|الوزن|المقاس|size|weight|volume)$/, 'size'],
  [/^(المنشابالانجليزي|المنشاالانجليزي|المنشاانجليزي|englishorigin|originen)$/, 'originEn'],
  [/^(المنشابالعربي|المنشاالعربي|المنشاعربي|arabicorigin|originar)$/, 'originAr'],
  [/^(المنشا|المصدر|البلد|origin|source)$/, 'origin'],
  [/^(الصنفبالانجليزي|الصنفالانجليزي|الصنفانجليزي|englishvariety|varietyen)$/, 'varietyEn'],
  [/^(الصنفبالعربي|الصنفالعربي|الصنفعربي|arabicvariety|varietyar)$/, 'varietyAr'],
  [/^(الصنف|النوع|variety|cultivar)$/, 'variety'],
  [/^(الحصادبالانجليزي|الحصادالانجليزي|الحصادانجليزي|englishharvest|harvesten)$/, 'harvestEn'],
  [/^(الحصادبالعربي|الحصادالعربي|الحصادعربي|arabicharvest|harvestar)$/, 'harvestAr'],
  [/^(الحصاد|الموسم|موسمالحصاد|harvest|season)$/, 'harvest'],
  [/^(التوصيلبالانجليزي|التوصيلالانجليزي|التوصيلانجليزي|englishdelivery|deliveryen)$/, 'deliveryEn'],
  [/^(التوصيلبالعربي|التوصيلالعربي|التوصيلعربي|arabicdelivery|deliveryar)$/, 'deliveryAr'],
  [/^(التوصيل|الشحن|التسليم|delivery|shipping)$/, 'delivery'],
  [/^(المميزاتبالانجليزي|المميزاتالانجليزي|المميزاتانجليزي|englishhighlights|highlightsen)$/, 'highlightsEn'],
  [/^(المميزاتبالعربي|المميزاتالعربي|المميزاتعربي|arabichighlights|highlightsar)$/, 'highlightsAr'],
  [/^(المميزات|الميزات|النقاط|highlights|bullets|features)$/, 'highlights'],
  [/^(الحموضه|الحموضة|acidity|acid)$/, 'acidity'],
  [/^(السعر|الثمن|price|cost)$/, 'price'],
  [/^(القسم|التصنيف|الفئه|الفئة|category)$/, 'category'],
  [/^(نسبهالعرض|نسبةالعرض|الخصم|نسبهالخصم|خصم|discount|offerpercent|sale)$/, 'discountPercent'],
  [/^(مدهالعرض|مدةالعرض|ايامالعرض|أيامالعرض|offerdays|discountdays)$/, 'discountDays'],
  [/^(متوفر|التوفر|available|instock|stock)$/, 'isAvailable'],
  [/^(جديد|isnew|newarrival)$/, 'isNew'],
  [/^(عليهعرض|فيهعرض|hasoffer|onoffer)$/, 'hasOffer'],
  [/^(عرض)$/, 'hasOffer'],
];

export function completeProductCopy(
  draft: ProductCopyDraft,
  prompt: string,
  products: ApiProduct[],
  categories: ApiCategory[],
  options?: { hasImages?: boolean }
): ProductCopyResult {
  const parsed = parseProductDump(prompt, categories);
  const dump = isDataDump(prompt, parsed);
  const name = (
    parsed.nameAr ||
    parsed.nameEn ||
    (!dump ? prompt : '') ||
    draft.nameAr ||
    draft.nameEn ||
    ''
  ).trim();
  const cat =
    categories.find((c) => c.id === parsed.categoryId) ||
    categories.find((c) => c.id === draft.categoryId) ||
    guessCategory(name || prompt, categories);
  const kind = detectKind(`${name} ${prompt}`, cat);
  const detectedVariety = detectVariety(`${name} ${prompt}`);
  const variety =
    parsed.varietyAr || parsed.varietyEn
      ? { ar: parsed.varietyAr || detectedVariety?.ar || '', en: parsed.varietyEn || detectedVariety?.en || '' }
      : detectedVariety;
  const size =
    detectSize(`${parsed.sizeAr || ''} ${parsed.sizeEn || ''}`) ||
    detectSize(`${name} ${prompt}`) ||
    detectSize(`${draft.sizeAr} ${draft.sizeEn}`);
  const similar = nearestProduct(name, kind, products, cat?.id);
  const origin =
    (parsed.originAr || parsed.originEn
      ? { ar: parsed.originAr || pickOrigin(name, similar).ar, en: parsed.originEn || pickOrigin(name, similar).en }
      : pickOrigin(`${name} ${prompt}`, similar));
  const harvest = parsed.harvestAr || parsed.harvestEn
    ? { ar: parsed.harvestAr || parsed.harvestEn || '', en: parsed.harvestEn || parsed.harvestAr || '' }
    : pickHarvest(similar);
  const delivery = parsed.deliveryAr || parsed.deliveryEn
    ? { ar: parsed.deliveryAr || parsed.deliveryEn || '', en: parsed.deliveryEn || parsed.deliveryAr || '' }
    : pickDelivery(similar);
  const acidity =
    parsed.acidity ??
    (kind === 'oil' ? similarAcidity(similar) ?? 0.4 : draft.acidity);
  const nameEn = parsed.nameEn || draft.nameEn.trim() || (name ? translateName(name, variety, size) : '');
  const nameAr = parsed.nameAr || draft.nameAr.trim() || name;
  const highlights = {
    ar: parsed.highlightsAr || '',
    en: parsed.highlightsEn || '',
  };
  if (!highlights.ar || !highlights.en) {
    const built = buildHighlights(kind, variety, size, origin);
    highlights.ar = highlights.ar || built.ar;
    highlights.en = highlights.en || built.en;
  }
  const desc = {
    ar: parsed.descriptionAr || '',
    en: parsed.descriptionEn || '',
  };
  if (!desc.ar || !desc.en) {
    const built = buildDescription(nameAr, nameEn, kind, variety, size, origin);
    desc.ar = desc.ar || built.ar;
    desc.en = desc.en || built.en;
  }

  const filled: string[] = [];
  const next: Partial<ProductCopyDraft> = {};
  const put = (
    key: keyof ProductCopyDraft,
    value: ProductCopyDraft[keyof ProductCopyDraft],
    label: string,
    force = false
  ) => {
    if (value == null || value === '') return;
    const current = (next[key] as ProductCopyDraft[keyof ProductCopyDraft] | undefined) ?? draft[key];
    const empty = current == null || current === '' || current === 0;
    if (!force && !empty) return;
    (next as Record<string, unknown>)[key] = value;
    if (!filled.includes(label)) filled.push(label);
  };

  put('nameAr', nameAr, 'الاسم عربي', !!parsed.nameAr);
  put('nameEn', nameEn, 'الاسم إنجليزي', !!parsed.nameEn);
  if (cat) put('categoryId', cat.id, 'القسم', !!parsed.categoryId);
  put('descriptionAr', desc.ar, 'الوصف عربي', !!parsed.descriptionAr);
  put('descriptionEn', desc.en, 'الوصف إنجليزي', !!parsed.descriptionEn);
  put('sizeAr', parsed.sizeAr || size?.ar || '', 'الحجم عربي', !!parsed.sizeAr);
  put('sizeEn', parsed.sizeEn || size?.en || '', 'الحجم إنجليزي', !!parsed.sizeEn);
  put('originAr', origin.ar, 'المنشأ عربي', !!parsed.originAr);
  put('originEn', origin.en, 'المنشأ إنجليزي', !!parsed.originEn);
  put('varietyAr', parsed.varietyAr || variety?.ar || kindLabel(kind).ar, 'الصنف عربي', !!parsed.varietyAr);
  put('varietyEn', parsed.varietyEn || variety?.en || kindLabel(kind).en, 'الصنف إنجليزي', !!parsed.varietyEn);
  put('harvestAr', harvest.ar, 'الحصاد عربي', !!parsed.harvestAr);
  put('harvestEn', harvest.en, 'الحصاد إنجليزي', !!parsed.harvestEn);
  put('deliveryAr', delivery.ar, 'التوصيل عربي', !!parsed.deliveryAr);
  put('deliveryEn', delivery.en, 'التوصيل إنجليزي', !!parsed.deliveryEn);
  if (kind === 'oil' || parsed.acidity != null) put('acidity', acidity, 'الحموضة', parsed.acidity != null);
  put('highlightsAr', highlights.ar, 'المميزات عربي', !!parsed.highlightsAr);
  put('highlightsEn', highlights.en, 'المميزات إنجليزي', !!parsed.highlightsEn);
  if (parsed.price != null) put('price', parsed.price, 'السعر', true);
  else if (!draft.price && similar?.price) put('price', Number(similar.price) || 0, 'السعر المقترح');
  if (parsed.discountPercent != null) {
    put('discountPercent', parsed.discountPercent, 'نسبة العرض', true);
    if (parsed.discountPercent > 0) put('hasOffer', true, 'عرض', true);
  }
  if (parsed.discountDays != null) put('discountDays', parsed.discountDays, 'مدة العرض', true);
  if (parsed.hasOffer != null) put('hasOffer', parsed.hasOffer, 'عرض', true);
  if (parsed.isNew != null) put('isNew', parsed.isNew, 'جديد', true);
  if (parsed.isAvailable != null) put('isAvailable', parsed.isAvailable, 'التوفر', true);

  const merged: ProductCopyDraft = { ...draft, ...next };
  const suggestions = buildSuggestions(merged, {
    kind,
    similar,
    products,
    hasImages: !!options?.hasImages,
  });
  const gapAr = uniqueLabels(suggestions.map((item) => item.labelAr));
  const gapEn = uniqueLabels(suggestions.map((item) => item.labelEn));
  const gapNoteAr = gapAr.length ? `\nلسه ناقص: ${gapAr.join('، ')}. اضغط الاقتراح تحت عشان تكمّل.` : '';
  const gapNoteEn = gapEn.length ? `\nStill missing: ${gapEn.join(', ')}. Tap a suggestion below to fill it.` : '';

  const summaryAr = filled.length
    ? dump
      ? `وزّعت البيانات على الخانات: ${filled.join('، ')}. راجع السعر والصورة قبل الحفظ.${gapNoteAr}`
      : `تمام. عبّيت: ${filled.join('، ')}. راجع السعر والصورة قبل الحفظ.${gapNoteAr}`
    : gapNoteAr
      ? `الحقول الأساسية متعبّية.${gapNoteAr}`
      : 'الحقول متعبّية. غيّر النص لو حابب نسخة تانية.';
  const summaryEn = filled.length
    ? dump
      ? `Mapped your details into: ${filled.join(', ')}. Check the price and photo before saving.${gapNoteEn}`
      : `Filled: ${filled.join(', ')}. Check the price and photo before saving.${gapNoteEn}`
    : gapNoteEn
      ? `The main fields are filled.${gapNoteEn}`
      : 'The fields are already filled. Change the text if you want a new draft.';

  return { draft: next, summaryAr, summaryEn, suggestions };
}

function uniqueLabels(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))];
}

function isBlank(value: unknown): boolean {
  return value == null || value === '' || value === 0;
}

function buildSuggestions(
  draft: ProductCopyDraft,
  ctx: { kind: ProductKind; similar?: ApiProduct; products: ApiProduct[]; hasImages: boolean }
): ProductCopySuggestion[] {
  const out: ProductCopySuggestion[] = [];
  if (!ctx.hasImages) {
    out.push({
      id: 'images',
      key: 'images',
      labelAr: 'الصورة',
      labelEn: 'Photo',
      previewAr: 'ضيف صورة',
      previewEn: 'Add a photo',
    });
  }
  if (isBlank(draft.price)) {
    for (const price of priceOptions(ctx.products, draft.categoryId, ctx.similar)) {
      out.push({
        id: `price-${price}`,
        key: 'price',
        labelAr: 'السعر',
        labelEn: 'Price',
        previewAr: `${price} ج.م`,
        previewEn: `EGP ${price}`,
        value: price,
        extra: { price },
      });
    }
    if (!out.some((item) => item.key === 'price')) {
      out.push({
        id: 'price-ask',
        key: 'price',
        labelAr: 'السعر',
        labelEn: 'Price',
        previewAr: 'حدد السعر',
        previewEn: 'Set the price',
      });
    }
  }
  if (isBlank(draft.sizeAr) && isBlank(draft.sizeEn)) {
    for (const size of sizeOptions(ctx.kind).slice(0, 3)) {
      out.push({
        id: `size-${size.en}`,
        key: 'sizeAr',
        labelAr: 'الحجم',
        labelEn: 'Size',
        previewAr: size.ar,
        previewEn: size.en,
        extra: { sizeAr: size.ar, sizeEn: size.en },
      });
    }
  } else if (isBlank(draft.sizeEn) && draft.sizeAr) {
    const size = detectSize(draft.sizeAr);
    if (size) {
      out.push({
        id: 'size-en',
        key: 'sizeEn',
        labelAr: 'الحجم إنجليزي',
        labelEn: 'English size',
        previewAr: size.en,
        previewEn: size.en,
        extra: { sizeEn: size.en },
      });
    }
  }
  if (isBlank(draft.nameEn) && draft.nameAr) {
    const nameEn = translateName(draft.nameAr, detectVariety(draft.nameAr), detectSize(draft.sizeAr || draft.nameAr));
    if (nameEn) {
      out.push({
        id: 'name-en',
        key: 'nameEn',
        labelAr: 'الاسم إنجليزي',
        labelEn: 'English name',
        previewAr: nameEn,
        previewEn: nameEn,
        extra: { nameEn },
      });
    }
  }
  if (isBlank(draft.originAr) && isBlank(draft.originEn)) {
    const origin = pickOrigin(draft.nameAr || draft.nameEn, ctx.similar);
    out.push({
      id: 'origin',
      key: 'originAr',
      labelAr: 'المنشأ',
      labelEn: 'Origin',
      previewAr: origin.ar,
      previewEn: origin.en,
      extra: { originAr: origin.ar, originEn: origin.en },
    });
  }
  if (isBlank(draft.harvestAr) && isBlank(draft.harvestEn)) {
    const harvest = pickHarvest(ctx.similar);
    out.push({
      id: 'harvest',
      key: 'harvestAr',
      labelAr: 'الحصاد',
      labelEn: 'Harvest',
      previewAr: harvest.ar,
      previewEn: harvest.en,
      extra: { harvestAr: harvest.ar, harvestEn: harvest.en },
    });
  }
  if (isBlank(draft.deliveryAr) && isBlank(draft.deliveryEn)) {
    const delivery = pickDelivery(ctx.similar);
    out.push({
      id: 'delivery',
      key: 'deliveryAr',
      labelAr: 'التوصيل',
      labelEn: 'Delivery',
      previewAr: delivery.ar,
      previewEn: delivery.en,
      extra: { deliveryAr: delivery.ar, deliveryEn: delivery.en },
    });
  }
  if (ctx.kind === 'oil' && isBlank(draft.acidity)) {
    out.push({
      id: 'acidity',
      key: 'acidity',
      labelAr: 'الحموضة',
      labelEn: 'Acidity',
      previewAr: '0.4٪',
      previewEn: '0.4%',
      extra: { acidity: 0.4 },
    });
  }
  if (isBlank(draft.highlightsAr) && isBlank(draft.highlightsEn)) {
    const variety = detectVariety(`${draft.nameAr} ${draft.varietyAr}`) || (draft.varietyAr ? { ar: draft.varietyAr, en: draft.varietyEn } : null);
    const size = detectSize(`${draft.sizeAr} ${draft.sizeEn}`);
    const origin = { ar: draft.originAr || 'الجوف', en: draft.originEn || 'Al-Jouf' };
    const highlights = buildHighlights(ctx.kind, variety, size, origin);
    out.push({
      id: 'highlights',
      key: 'highlightsAr',
      labelAr: 'المميزات',
      labelEn: 'Highlights',
      previewAr: 'أضف المميزات',
      previewEn: 'Add highlights',
      extra: { highlightsAr: highlights.ar, highlightsEn: highlights.en },
    });
  }
  if (isBlank(draft.descriptionAr) && (draft.nameAr || draft.nameEn)) {
    const desc = buildDescription(
      draft.nameAr || draft.nameEn,
      draft.nameEn || draft.nameAr,
      ctx.kind,
      detectVariety(`${draft.nameAr} ${draft.varietyAr}`),
      detectSize(`${draft.sizeAr} ${draft.sizeEn}`),
      { ar: draft.originAr || 'الجوف', en: draft.originEn || 'Al-Jouf' }
    );
    out.push({
      id: 'description',
      key: 'descriptionAr',
      labelAr: 'الوصف',
      labelEn: 'Description',
      previewAr: 'أضف الوصف',
      previewEn: 'Add description',
      extra: { descriptionAr: desc.ar, descriptionEn: desc.en },
    });
  }
  return out.slice(0, 8);
}

function sizeOptions(kind: ProductKind): Array<{ ar: string; en: string }> {
  if (kind === 'oil') {
    return [
      { ar: '250 مل', en: '250 ml' },
      { ar: '500 مل', en: '500 ml' },
      { ar: '750 مل', en: '750 ml' },
      { ar: '1 لتر', en: '1 L' },
    ];
  }
  if (kind === 'olive' || kind === 'pickle') {
    return [
      { ar: '250 جم', en: '250 g' },
      { ar: '500 جم', en: '500 g' },
      { ar: '1 كجم', en: '1 kg' },
    ];
  }
  if (kind === 'honey') {
    return [
      { ar: '250 جم', en: '250 g' },
      { ar: '350 جم', en: '350 g' },
      { ar: '500 جم', en: '500 g' },
    ];
  }
  if (kind === 'gift') {
    return [
      { ar: 'علبة واحدة', en: '1 box' },
      { ar: 'مجموعة', en: 'Gift set' },
    ];
  }
  return [
    { ar: '250 جم', en: '250 g' },
    { ar: '500 جم', en: '500 g' },
    { ar: '1 كجم', en: '1 kg' },
  ];
}

function priceOptions(products: ApiProduct[], categoryId: number, similar?: ApiProduct): number[] {
  const nums = products
    .filter((product) => !categoryId || product.categoryId === categoryId)
    .map((product) => Number(product.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const unique = [...new Set(nums)].sort((a, b) => a - b);
  const similarPrice = Number(similar?.price);
  if (Number.isFinite(similarPrice) && similarPrice > 0) {
    const nearby = unique.filter((price) => price !== similarPrice).slice(0, 2);
    return [similarPrice, ...nearby].slice(0, 3);
  }
  if (!unique.length) return [];
  const mid = unique[Math.floor(unique.length / 2)];
  return [...new Set([unique[0], mid, unique[unique.length - 1]])].slice(0, 3);
}

export function parseProductDump(prompt: string, categories: ApiCategory[]): Partial<ProductCopyDraft> {
  const text = foldDigits(prompt).replace(/\u200f|\u200e/g, '').trim();
  const out: Partial<ProductCopyDraft> = {};
  if (!text) return out;

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const unlabeled: string[] = [];
  let lastTarget: DumpTarget | null = null;

  for (const line of lines) {
    const labeled = splitLabeledLine(line);
    if (labeled) {
      lastTarget = labeled.target;
      assignDumpValue(out, labeled.target, labeled.value, categories);
      continue;
    }
    if (lastTarget && isContinuation(line, lastTarget)) {
      assignDumpValue(out, lastTarget, line, categories, true);
      continue;
    }
    lastTarget = null;
    unlabeled.push(line);
  }

  scanLooseFacts(out, text, categories);

  for (const line of unlabeled) {
    if (
      !out.nameAr &&
      !out.nameEn &&
      line.length <= 80 &&
      !detectSize(line)?.ar &&
      !/(جنيه|ج\.?\s*م|egp|حموض|خصم|٪|%)/i.test(line)
    ) {
      assignDumpValue(out, 'name', line, categories);
      continue;
    }
    const bullets = line.match(/^[•\-\*]\s*(.+)$/);
    if (bullets) {
      assignDumpValue(out, 'highlights', bullets[1], categories, true);
      continue;
    }
    if (line.length >= 40) {
      assignDumpValue(out, 'description', line, categories, true);
      continue;
    }
    if (!out.sizeAr && !out.sizeEn && detectSize(line)) {
      assignDumpValue(out, 'size', line, categories);
      continue;
    }
    if (!out.originAr && !out.originEn && statedOrigin(line)) {
      assignDumpValue(out, 'origin', line, categories);
    }
  }

  const size = detectSize(`${out.sizeAr || ''} ${out.sizeEn || ''} ${text}`);
  if (size) {
    out.sizeAr = out.sizeAr || size.ar;
    out.sizeEn = out.sizeEn || size.en;
  }
  const variety = detectVariety(text);
  if (variety) {
    out.varietyAr = out.varietyAr || variety.ar;
    out.varietyEn = out.varietyEn || variety.en;
  }
  return out;
}

function isDataDump(prompt: string, parsed: Partial<ProductCopyDraft>): boolean {
  const lines = prompt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2) return true;
  if (Object.keys(parsed).length >= 2) return true;
  return /[:：=]/.test(prompt) && /(اسم|سعر|وصف|حجم|منشا|صنف|حصاد|توصيل|حموض|ميز|قسم|خصم|عرض|price|size|origin|desc)/i.test(prompt);
}

function splitLabeledLine(line: string): { target: DumpTarget; value: string } | null {
  const colon = line.match(/^(.{1,42}?)[:：=]\s*(.+)$/);
  if (colon) {
    const target = matchDumpLabel(colon[1]);
    if (target && colon[2].trim()) return { target, value: colon[2].trim() };
  }
  const spaced = line.match(/^(.{2,28}?)\s{1,}(.+)$/);
  if (spaced) {
    const target = matchDumpLabel(spaced[1]);
    if (target && spaced[2].trim() && target !== 'isNew') return { target, value: spaced[2].trim() };
  }
  return null;
}

function matchDumpLabel(label: string): DumpTarget | null {
  const key = canonLabel(label);
  if (!key) return null;
  for (const [re, target] of LABEL_RULES) {
    if (re.test(key)) return target;
  }
  return null;
}

function canonLabel(label: string): string {
  return foldDigits(label)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}٪%]+/gu, '')
    .toLowerCase();
}

function isContinuation(line: string, target: DumpTarget): boolean {
  if (matchDumpLabel(line.split(/[:：=]/)[0] || '')) return false;
  return (
    target === 'description' ||
    target === 'descriptionAr' ||
    target === 'descriptionEn' ||
    target === 'highlights' ||
    target === 'highlightsAr' ||
    target === 'highlightsEn'
  );
}

function assignDumpValue(
  out: Partial<ProductCopyDraft>,
  target: DumpTarget,
  raw: string,
  categories: ApiCategory[],
  append = false
): void {
  const value = raw.replace(/^[•\-\*]\s*/, '').trim();
  if (!value) return;

  if (target === 'category') {
    const cat = matchCategory(value, categories);
    if (cat) out.categoryId = cat.id;
    return;
  }
  if (target === 'price') {
    const n = parseNumber(value);
    if (n != null) out.price = n;
    return;
  }
  if (target === 'acidity') {
    const n = parseNumber(value);
    if (n != null) out.acidity = n;
    return;
  }
  if (target === 'discountPercent') {
    const n = parseNumber(value);
    if (n != null) {
      out.discountPercent = n;
      if (n > 0) out.hasOffer = true;
    }
    return;
  }
  if (target === 'discountDays') {
    const n = parseNumber(value);
    if (n != null) out.discountDays = n;
    return;
  }
  if (target === 'isAvailable') {
    const flag = parseBool(value);
    if (flag != null) out.isAvailable = flag;
    return;
  }
  if (target === 'isNew') {
    const flag = parseBool(value);
    out.isNew = flag ?? true;
    return;
  }
  if (target === 'hasOffer') {
    const n = parseNumber(value);
    if (n != null && /%|٪/.test(value)) {
      out.discountPercent = n;
      out.hasOffer = n > 0;
      return;
    }
    const flag = parseBool(value);
    out.hasOffer = flag ?? true;
    return;
  }

  const pairTargets: Array<[DumpTarget, keyof ProductCopyDraft, keyof ProductCopyDraft]> = [
    ['name', 'nameAr', 'nameEn'],
    ['description', 'descriptionAr', 'descriptionEn'],
    ['size', 'sizeAr', 'sizeEn'],
    ['origin', 'originAr', 'originEn'],
    ['variety', 'varietyAr', 'varietyEn'],
    ['harvest', 'harvestAr', 'harvestEn'],
    ['delivery', 'deliveryAr', 'deliveryEn'],
    ['highlights', 'highlightsAr', 'highlightsEn'],
  ];
  const pair = pairTargets.find((row) => row[0] === target);
  if (pair) {
    const split = splitBilingual(value);
    setText(out, pair[1], split.ar, append);
    setText(out, pair[2], split.en, append);
    return;
  }

  if (target in out || isDraftKey(target)) {
    const key = target as keyof ProductCopyDraft;
    if (typeof out[key] === 'number' || key === 'acidity') {
      const n = parseNumber(value);
      if (n != null) (out as Record<string, unknown>)[key] = n;
      return;
    }
    setText(out, key, value, append);
  }
}

function isDraftKey(key: string): key is keyof ProductCopyDraft {
  return [
    'nameAr',
    'nameEn',
    'descriptionAr',
    'descriptionEn',
    'sizeAr',
    'sizeEn',
    'originAr',
    'originEn',
    'varietyAr',
    'varietyEn',
    'harvestAr',
    'harvestEn',
    'deliveryAr',
    'deliveryEn',
    'highlightsAr',
    'highlightsEn',
  ].includes(key);
}

function setText(out: Partial<ProductCopyDraft>, key: keyof ProductCopyDraft, value: string, append: boolean): void {
  if (!value) return;
  const current = String(out[key] || '');
  const next = append && current ? `${current}\n${value}` : current || value;
  (out as Record<string, unknown>)[key] = key.toString().startsWith('highlights') ? tidyHighlights(next) : next;
}

function tidyHighlights(value: string): string {
  return value
    .split(/[\n,،]+/)
    .map((item) => item.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}

function scanLooseFacts(out: Partial<ProductCopyDraft>, text: string, categories: ApiCategory[]): void {
  if (out.price == null) {
    const price = text.match(/(\d+(?:\.\d+)?)\s*(?:ج\.?\s*م|جنيه|egp)/i);
    if (price) out.price = Number(price[1]);
  }
  if (out.acidity == null) {
    const acidity = text.match(/(?:حموض[ةه]|acidity)\s*[:：]?\s*(\d+(?:\.\d+)?)/i);
    if (acidity) out.acidity = Number(acidity[1]);
  }
  if (out.discountPercent == null) {
    const offer = text.match(/(?:خصم|عرض|discount|off)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (offer) {
      out.discountPercent = Number(offer[1]);
      out.hasOffer = out.discountPercent > 0;
    }
  }
  if (out.discountDays == null) {
    const days = text.match(/(?:لمدة|لـ|for)\s*(\d+)\s*(?:يوم|أيام|ايام|day)/i);
    if (days) out.discountDays = Number(days[1]);
  }
  if (out.categoryId == null) {
    const catLine = text.match(/(?:قسم|تصنيف|category)\s*[:：]?\s*([^\n]+)/i);
    if (catLine) {
      const cat = matchCategory(catLine[1], categories);
      if (cat) out.categoryId = cat.id;
    }
  }
  if (out.isAvailable == null) {
    if (/غير\s*متوفر|out of stock/i.test(text)) out.isAvailable = false;
    else if (/\bمتوفر\b|in stock/i.test(text)) out.isAvailable = true;
  }
}

function splitBilingual(value: string): { ar: string; en: string } {
  const paren = value.match(/^(.+?)\s*[\(（]\s*([^)]+?)\s*[\)）]\s*$/);
  if (paren) return packLang(paren[1], paren[2]);
  const parts = value.split(/\s*[\/\|]\s*|\s+[–—]\s+|\s+-\s+/);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) return packLang(parts[0], parts[1]);
  if (isMostlyArabic(value)) return { ar: value.trim(), en: '' };
  return { ar: '', en: value.trim() };
}

function packLang(a: string, b: string): { ar: string; en: string } {
  const left = a.trim();
  const right = b.trim();
  if (isMostlyArabic(left) && !isMostlyArabic(right)) return { ar: left, en: right };
  if (isMostlyArabic(right) && !isMostlyArabic(left)) return { ar: right, en: left };
  if (isMostlyArabic(left)) return { ar: left, en: right };
  return { ar: right, en: left };
}

function isMostlyArabic(value: string): boolean {
  const ar = (value.match(/[\u0600-\u06FF]/g) || []).length;
  const la = (value.match(/[A-Za-z]/g) || []).length;
  return ar > 0 && ar >= la;
}

function parseNumber(value: string): number | null {
  const m = foldDigits(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function parseBool(value: string): boolean | undefined {
  const v = canonLabel(value);
  if (/^(نعم|متوفر|متاح|true|yes|1|on)$/.test(v)) return true;
  if (/^(لا|غيرمتوفر|غيرمتاح|false|no|0|off)$/.test(v)) return false;
  return undefined;
}

function matchCategory(text: string, categories: ApiCategory[]): ApiCategory | undefined {
  const n = canonLabel(text);
  if (!n) return undefined;
  let best: ApiCategory | undefined;
  let score = 0;
  for (const category of categories) {
    for (const name of [category.nameAr, category.nameEn, category.name]) {
      const nn = canonLabel(name || '');
      if (!nn) continue;
      if (n === nn || n.includes(nn) || nn.includes(n)) {
        if (nn.length > score) {
          score = nn.length;
          best = category;
        }
      }
    }
  }
  return best;
}

function foldDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06F0));
}

function guessCategory(name: string, categories: ApiCategory[]): ApiCategory | undefined {
  const n = name.toLowerCase();
  const score = (c: ApiCategory) => {
    const hay = `${c.nameAr || ''} ${c.nameEn || ''} ${c.name || ''}`.toLowerCase();
    let s = 0;
    if (/زيت|oil/.test(n) && /زيت|oil/.test(hay)) s += 3;
    if (/تنك|tin|صفيحة/.test(n) && /تنك|tin|كبير/.test(hay)) s += 4;
    if (/مخلل|pickle/.test(n) && /مخلل|pickle/.test(hay)) s += 4;
    if (/زيتون(?!\s*زيت)|olive/.test(n) && /زيتون|olive/.test(hay) && !/زيت/.test(hay)) s += 3;
    if (/هدية|gift|بوكس/.test(n) && /هدا|gift/.test(hay)) s += 4;
    return s;
  };
  return [...categories].sort((a, b) => score(b) - score(a))[0];
}

function detectKind(name: string, cat?: ApiCategory): ProductKind {
  const hay = `${name} ${cat?.nameAr || ''} ${cat?.nameEn || ''}`.toLowerCase();
  if (/مخلل|pickle/.test(hay)) return 'pickle';
  if (/عسل|honey/.test(hay)) return 'honey';
  if (/هدية|gift|بوكس|مجموعة/.test(hay)) return 'gift';
  if (/زيتون/.test(hay) && !/زيت/.test(hay)) return 'olive';
  if (/زيت|oil|تنك|tin/.test(hay)) return 'oil';
  if (/olive/.test(hay) && !/oil/.test(hay)) return 'olive';
  return 'pantry';
}

type ProductKind = 'oil' | 'olive' | 'pickle' | 'honey' | 'gift' | 'pantry';

function kindLabel(kind: ProductKind): { ar: string; en: string } {
  if (kind === 'oil') return { ar: 'زيت زيتون', en: 'Olive oil' };
  if (kind === 'olive') return { ar: 'زيتون المائدة', en: 'Table olives' };
  if (kind === 'pickle') return { ar: 'مخلل', en: 'Pickles' };
  if (kind === 'honey') return { ar: 'عسل', en: 'Honey' };
  if (kind === 'gift') return { ar: 'مجموعة إهداء', en: 'Gift set' };
  return { ar: 'مونة', en: 'Pantry' };
}

function detectVariety(name: string): { ar: string; en: string } | null {
  return VARIETIES.find((row) => row.test.test(name)) || null;
}

function detectSize(text: string): { ar: string; en: string } | null {
  const t = foldDigits(text);
  const liter = t.match(/(\d+(?:\.\d+)?)\s*(?:لتر|لتره|ltr|l\b)/i);
  if (liter) {
    const n = liter[1];
    return { ar: `${n} لتر`, en: `${n} L` };
  }
  const ml = t.match(/(\d+)\s*(?:مل|مللي|ml)/i);
  if (ml) {
    const n = ml[1];
    return { ar: `${n} مل`, en: `${n} ml` };
  }
  const kg = t.match(/(\d+(?:\.\d+)?)\s*(?:كجم|كيلو|kg)/i);
  if (kg) {
    const n = kg[1];
    return { ar: `${n} كجم`, en: `${n} kg` };
  }
  const g = t.match(/(\d+)\s*(?:جم|جرام|g\b)/i);
  if (g) {
    const n = g[1];
    return { ar: `${n} جم`, en: `${n} g` };
  }
  return null;
}

function translateName(name: string, variety: { ar: string; en: string } | null, size: { ar: string; en: string } | null): string {
  let out = name;
  for (const [re, en] of WORD) out = out.replace(re, en);
  if (variety?.ar && variety.en) out = out.replace(variety.ar, variety.en);
  if (size?.ar && size.en) out = out.replace(size.ar, size.en);
  out = out
    .replace(/[^\u0000-\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!out) {
    const bits = ['Olive', variety?.en, size?.en].filter(Boolean);
    return bits.join(' ');
  }
  return out.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function statedOrigin(text: string): { ar: string; en: string } | null {
  if (/جوف|al-?jouf/i.test(text)) return { ar: 'الجوف', en: 'Al-Jouf' };
  if (/شمال|syria|شامي|levant/i.test(text)) return { ar: 'بلاد الشام', en: 'Levant' };
  if (/إسبان|اسبان|spain|andalus/i.test(text)) return { ar: 'إسبانيا', en: 'Spain' };
  if (/يونان|greece/i.test(text)) return { ar: 'اليونان', en: 'Greece' };
  if (/تونس|tunisia/i.test(text)) return { ar: 'تونس', en: 'Tunisia' };
  if (/فلسطين|palestine/i.test(text)) return { ar: 'فلسطين', en: 'Palestine' };
  if (/مصر|egypt/i.test(text)) return { ar: 'مصر', en: 'Egypt' };
  return null;
}

function pickOrigin(name: string, similar?: ApiProduct): { ar: string; en: string } {
  const stated = statedOrigin(name);
  if (stated) return stated;
  const ar = similar?.originAr || similar?.origin || '';
  const en = similar?.originEn || '';
  if (ar || en) return { ar: ar || 'الجوف', en: en || 'Al-Jouf' };
  return { ar: 'الجوف', en: 'Al-Jouf' };
}

function pickHarvest(similar?: ApiProduct): { ar: string; en: string } {
  const year = new Date().getFullYear();
  const ar = similar?.harvestAr || similar?.harvest || '';
  const en = similar?.harvestEn || '';
  if (ar || en) return { ar: ar || `موسم ${year}`, en: en || `Harvest ${year}` };
  return { ar: `حصاد ${year}`, en: `Harvest ${year}` };
}

function pickDelivery(similar?: ApiProduct): { ar: string; en: string } {
  const ar = similar?.deliveryAr || similar?.delivery || '';
  const en = similar?.deliveryEn || '';
  if (ar || en) return { ar: ar || '٢–٤ أيام عمل', en: en || '2–4 working days' };
  return { ar: '٢–٤ أيام عمل · توصيل مجاني فوق ٢٥٠ ج.م', en: '2–4 working days · free delivery over EGP 250' };
}

function similarAcidity(similar?: ApiProduct): number | null {
  const n = Number(similar?.acidity);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function nearestProduct(name: string, kind: ProductKind, products: ApiProduct[], categoryId?: number): ApiProduct | undefined {
  const tokens = tokenize(name);
  let best: ApiProduct | undefined;
  let score = -1;
  for (const product of products) {
    const hay = tokenize(`${product.nameAr || ''} ${product.nameEn || ''} ${product.varietyAr || ''} ${product.varietyEn || ''}`);
    let s = 0;
    for (const token of tokens) if (hay.includes(token)) s += 2;
    if (categoryId && product.categoryId === categoryId) s += 2;
    const pKind = detectKind(`${product.nameAr || ''} ${product.nameEn || ''}`);
    if (pKind === kind) s += 2;
    if (s > score) {
      score = s;
      best = product;
    }
  }
  return score > 0 ? best : products.find((p) => p.categoryId === categoryId) || products[0];
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function buildHighlights(
  kind: ProductKind,
  variety: { ar: string; en: string } | null,
  size: { ar: string; en: string } | null,
  origin: { ar: string; en: string }
): { ar: string; en: string } {
  const ar: string[] = [];
  const en: string[] = [];
  if (kind === 'oil') {
    ar.push('عصر على البارد خلال ساعات الحصاد', 'بكر ممتاز بطعم نظيف', `منشأ ${origin.ar}`);
    en.push('Cold-pressed within hours of harvest', 'Extra virgin, clean finish', `From ${origin.en}`);
    if (variety) {
      ar.push(`صنف ${variety.ar}`);
      en.push(`${variety.en} cultivar`);
    }
  } else if (kind === 'olive') {
    ar.push('محفوظ بملحه الطبيعي', 'قوام متماسك للمائدة', `من ${origin.ar}`);
    en.push('Kept in its natural brine', 'Firm table texture', `From ${origin.en}`);
  } else if (kind === 'pickle') {
    ar.push('تخليل بيتي بدرجة ملوحة متوازنة', 'قرمشة تثبت بعد الفتح', 'بدون ألوان صناعية');
    en.push('Home-style brine, balanced salt', 'Crunch that holds after opening', 'No artificial colour');
  } else if (kind === 'gift') {
    ar.push('تجهيز للإهداء فور الطلب', 'تغليف منبت أنيق', 'يصلح للضيافة والمكتب');
    en.push('Packed for gifting', 'Almanbat wrapping', 'Fits hosting and offices');
  } else {
    ar.push('دفعة موثّقة من المنبت', 'تغليف محكم يحفظ النكهة', `من ${origin.ar}`);
    en.push('Traced Almanbat batch', 'Sealed to keep the flavour', `From ${origin.en}`);
  }
  if (size) {
    ar.push(`عبوة ${size.ar}`);
    en.push(`${size.en} pack`);
  }
  return { ar: ar.join('\n'), en: en.join('\n') };
}

function buildDescription(
  nameAr: string,
  nameEn: string,
  kind: ProductKind,
  variety: { ar: string; en: string } | null,
  size: { ar: string; en: string } | null,
  origin: { ar: string; en: string }
): { ar: string; en: string } {
  const sizeAr = size ? ` بعبوة ${size.ar}` : '';
  const sizeEn = size ? ` in a ${size.en} pack` : '';
  const varAr = variety ? ` من صنف ${variety.ar}` : '';
  const varEn = variety ? ` from the ${variety.en} cultivar` : '';
  if (kind === 'oil') {
    return {
      ar: `${nameAr}${varAr} من ${origin.ar}. معصور على البارد بطعم نظيف يناسب الخبز والسلطات والمائدة اليومية${sizeAr}.`,
      en: `${nameEn}${varEn} from ${origin.en}. Cold-pressed with a clean finish for bread, salads and everyday cooking${sizeEn}.`,
    };
  }
  if (kind === 'olive') {
    return {
      ar: `${nameAr} من ${origin.ar}${varAr}. زيتون مائدة بقوام متماسك وملوحة متزنة للضيافة والمطبخ${sizeAr}.`,
      en: `${nameEn} from ${origin.en}${varEn}. Table olives with a firm bite and balanced salt for hosting and the kitchen${sizeEn}.`,
    };
  }
  if (kind === 'pickle') {
    return {
      ar: `${nameAr} بتخليل متوازن يحفظ القرمشة. جاهز للمائدة من أول فتح${sizeAr}.`,
      en: `${nameEn} in a balanced brine that keeps the crunch. Ready for the table from the first open${sizeEn}.`,
    };
  }
  if (kind === 'gift') {
    return {
      ar: `${nameAr} مجموعة منبت جاهزة للإهداء: منتجات موثّقة وتغليف أنيق بدون ترتيب إضافي.`,
      en: `${nameEn} is an Almanbat set ready to gift: traced goods and clean wrapping, no extra arranging.`,
    };
  }
  return {
    ar: `${nameAr} من مونة المنبت. دفعة واضحة المصدر تناسب الاستخدام اليومي${sizeAr}.`,
    en: `${nameEn} from the Almanbat pantry. A clearly sourced batch for everyday use${sizeEn}.`,
  };
}
