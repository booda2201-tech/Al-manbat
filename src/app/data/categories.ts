import type { Category } from '../types';
import { images } from './images';

export const categories: Category[] = [
  {
    slug: 'olive-oil',
    name: { ar: 'زيوت الزيتون', en: 'Olive Oils' },
    tagline: { ar: 'معصور على البارد، من البستان إلى الزجاجة', en: 'Cold-pressed, from grove to bottle' },
    story: {
      ar: 'نعصر زيتون الجوف خلال ساعات الحصاد، في زجاج داكن يحفظ النكهة. حموضة منخفضة، ودفعة محدودة لكل موسم.',
      en: 'We press Al-Jouf olives within hours of harvest, in dark glass that holds the flavour. Low acidity, limited batches each season.',
    },
    image: images.cat['olive-oil'],
    accent: 'olive',
    subcategories: [
      { slug: 'extra-virgin', name: { ar: 'بكر ممتاز', en: 'Extra Virgin' }, count: 18 },
      { slug: 'virgin', name: { ar: 'بكر', en: 'Virgin' }, count: 8 },
      { slug: 'infused', name: { ar: 'منكّه بالأعشاب', en: 'Infused' }, count: 6 },
      { slug: 'tins', name: { ar: 'تنك العائلة', en: 'Family tins' }, count: 5 },
    ],
  },
  {
    slug: 'table-olives',
    name: { ar: 'زيتون المائدة', en: 'Table Olives' },
    tagline: { ar: 'أخضر، أسود، محشي — معتّق كما يجب', en: 'Green, black, stuffed — properly cured' },
    story: {
      ar: 'نختار حبات متساوية الحجم، نملّحها في محلول نظيف، ونعبّئها بزيتوننا أو بزيتون كلاماتا حين يستحق الاسم.',
      en: 'Even fruit, a clean brine, packed in our own oil — or true Kalamata when the name is earned.',
    },
    image: images.cat['table-olives'],
    accent: 'gold',
    subcategories: [
      { slug: 'green', name: { ar: 'أخضر بلدي', en: 'Green' }, count: 12 },
      { slug: 'black', name: { ar: 'أسود معتّق', en: 'Cured black' }, count: 9 },
      { slug: 'stuffed', name: { ar: 'محشي', en: 'Stuffed' }, count: 7 },
      { slug: 'sliced', name: { ar: 'شرائح', en: 'Sliced' }, count: 4 },
    ],
  },
  {
    slug: 'pickles',
    name: { ar: 'المخللات', en: 'Pickles' },
    tagline: { ar: 'خيار، مشكل، لفت، وفلفل — بملوحة متوازنة', en: 'Cucumber, mixed, turnip and pepper — a balanced brine' },
    story: {
      ar: 'مخلل البيت كما يُعمل في المونة: قرمشة تبقى، وحموضة لا تطغى. كل برطمان بتاريخ دفعة واضح.',
      en: 'Home pickles as the pantry makes them: crunch that lasts, acidity that doesn’t shout. Every jar dated by batch.',
    },
    image: images.cat.pickles,
    accent: 'clay',
    subcategories: [
      { slug: 'cucumber', name: { ar: 'خيار', en: 'Cucumber' }, count: 10 },
      { slug: 'mixed', name: { ar: 'مشكل', en: 'Mixed' }, count: 8 },
      { slug: 'turnip', name: { ar: 'لفت', en: 'Turnip' }, count: 5 },
      { slug: 'peppers', name: { ar: 'فلفل حار', en: 'Hot peppers' }, count: 6 },
    ],
  },
  {
    slug: 'stuffed',
    name: { ar: 'المحشي والمونة', en: 'Stuffed & Preserves' },
    tagline: { ar: 'مكدوس، ورق عنب، ومعجون زيتون', en: 'Makdous, vine leaves, olive paste' },
    story: {
      ar: 'مونة الشتاء: باذنجان محشي جوزاً، ورق عنب ملفوف يدوياً، ومعجون زيتون كثيف على الخبز.',
      en: 'Winter pantry: walnut-stuffed eggplant, hand-rolled vine leaves, and a dense olive paste for bread.',
    },
    image: images.cat.stuffed,
    accent: 'dark',
    subcategories: [
      { slug: 'makdous', name: { ar: 'مكدوس', en: 'Makdous' }, count: 4 },
      { slug: 'vine-leaves', name: { ar: 'ورق عنب', en: 'Vine leaves' }, count: 5 },
      { slug: 'peppers', name: { ar: 'فلفل محشي', en: 'Stuffed peppers' }, count: 3 },
      { slug: 'paste', name: { ar: 'معجون الزيتون', en: 'Olive paste' }, count: 4 },
    ],
  },
  {
    slug: 'gifts',
    name: { ar: 'التشكيلات والهدايا', en: 'Gift Sets' },
    tagline: { ar: 'صناديق تذوق وسلال ضيافة جاهزة', en: 'Tasting crates and ready hospitality trays' },
    story: {
      ar: 'نجهّز الصندوق كما نجهّز المائدة: زيت، زيتون، ومخلل في تشكيلة واحدة تُهدى دون حيرة.',
      en: 'We pack the crate the way we set a table: oil, olives and pickles in one gift, with no second-guessing.',
    },
    image: images.cat.gifts,
    accent: 'gold',
    subcategories: [
      { slug: 'tasting', name: { ar: 'تذوق الزيوت', en: 'Oil tasting' }, count: 3 },
      { slug: 'pantry', name: { ar: 'تشكيلة المونة', en: 'Pantry edit' }, count: 4 },
      { slug: 'hospitality', name: { ar: 'سلة الضيافة', en: 'Hospitality tray' }, count: 3 },
    ],
  },
];

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
