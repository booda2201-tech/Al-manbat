import type { HeroAd } from '../types';
import { images } from './images';

export const HERO_AD_MS = 6500;

export const heroAds: HeroAd[] = [
  {
    id: 'harvest',
    image: images.hero,
    badge: { ar: 'حملة الموسم', en: 'Season campaign' },
    eyebrow: { ar: 'موسم الحصاد ٢٠٢٦', en: 'Harvest season 2026' },
    heading: { ar: 'من الجذور إلى بيتك', en: 'From the roots\nto your home' },
    body: {
      ar: 'زيت زيتون بكر، زيتون مائدة، ومخللات بكل أنواعها — من البستان إلى بيتك، بمعيار واحد للجودة.',
      en: 'Extra virgin oil, table olives, and pickles of every kind — from the grove to your table, held to one standard.',
    },
    primary: { label: { ar: 'تسوق الكل', en: 'Shop all' }, to: '/offers' },
    secondary: { label: { ar: 'عن المنبت', en: 'Our story' }, to: '/about' },
  },
  {
    id: 'oil',
    image: images.cat['olive-oil'],
    badge: { ar: 'موسم العصرة', en: 'Press season' },
    eyebrow: { ar: 'زيوت الزيتون', en: 'Olive oils' },
    heading: { ar: 'معصور على البارد\nمن بستان مصري', en: 'Cold-pressed\nfrom Egypt' },
    body: {
      ar: 'حموضة منخفضة، زجاج داكن، ودفعة محدودة لكل حصاد. الزيت كما يخرج من المعصرة.',
      en: 'Low acidity, dark glass, a limited lot each harvest. Oil as it leaves the press.',
    },
    primary: { label: { ar: 'تسوق الزيوت', en: 'Shop oils' }, to: '/listing/extra-virgin' },
    secondary: { label: { ar: 'المحصول المحفوظ', en: 'The reserve' }, to: '/listing/extra-virgin' },
  },
  {
    id: 'pickles',
    image: images.cat.pickles,
    badge: { ar: 'مونة البيت', en: 'House pantry' },
    eyebrow: { ar: 'المخللات', en: 'Pickles' },
    heading: { ar: 'مخلل يقرمش\nكما يُعمل في البيت', en: 'Pickle that crunches\nlike home' },
    body: {
      ar: 'خيار، لفت، مشكل وفلفل — بملوحة متوازنة وتاريخ دفعة على كل برطمان.',
      en: 'Cucumber, turnip, mixed and pepper — a balanced brine, every jar dated by batch.',
    },
    primary: { label: { ar: 'تسوق المخللات', en: 'Shop pickles' }, to: '/listing/table-olives' },
    secondary: { label: { ar: 'وصل حديثاً', en: 'New arrivals' }, to: '/new' },
  },
  {
    id: 'offers',
    image: images.pantry,
    badge: { ar: 'لفترة محدودة', en: 'Limited window' },
    eyebrow: { ar: 'عروض المنبت', en: 'Almanbat offers' },
    heading: { ar: 'خصم على دفعات\nمحدودة هذا الموسم', en: 'Discounts on\nlimited lots' },
    body: {
      ar: 'تخفيضات مختارة على دفعات هذا الموسم ومخزون محدود.',
      en: 'Chosen markdowns on this season’s lots and limited stock.',
    },
    primary: { label: { ar: 'شاهدي العروض', en: 'See offers' }, to: '/offers' },
    secondary: { label: { ar: 'الأكثر مبيعاً', en: 'Best sellers' }, to: '/listing/all' },
  },
];

export const desktopHeroAds: HeroAd[] = [
  {
    id: 'desktop-pickles',
    image: images.heroDesktop.pickles,
    badge: { ar: 'مونة البيت', en: 'House pantry' },
    eyebrow: { ar: 'المخللات', en: 'Pickles' },
    heading: { ar: 'مخلل يقرمش\nكما يُعمل في البيت', en: 'Pickle that crunches\nlike home' },
    body: {
      ar: 'مشكل وكورنيشون بملوحة متوازنة وتاريخ دفعة على كل برطمان.',
      en: 'Mixed pickles and cornichons — a balanced brine, every jar dated by batch.',
    },
    primary: { label: { ar: 'تسوق المخللات', en: 'Shop pickles' }, to: '/listing/pickles' },
    secondary: { label: { ar: 'كل الأقسام', en: 'All categories' }, to: '/listing/all' },
  },
  {
    id: 'desktop-grape',
    image: images.heroDesktop.grape,
    badge: { ar: 'من المطبخ', en: 'From the kitchen' },
    eyebrow: { ar: 'ورق العنب', en: 'Grape leaves' },
    heading: { ar: 'ورق عنب جاهز\nللحشو والمائدة', en: 'Grape leaves ready\nfor the table' },
    body: {
      ar: 'أوراق مختارة ومحفوظة بعناية — قوام طري ونكهة صافية للوصفات البيتية.',
      en: 'Selected leaves, carefully packed — tender texture and a clean flavour for home recipes.',
    },
    primary: { label: { ar: 'تسوق ورق العنب', en: 'Shop grape leaves' }, to: '/listing/grape-leaves' },
    secondary: { label: { ar: 'كل الأقسام', en: 'All categories' }, to: '/listing/all' },
  },
  {
    id: 'desktop-olives',
    image: images.heroDesktop.olives,
    badge: { ar: 'من البستان', en: 'From the grove' },
    eyebrow: { ar: 'الزيتون', en: 'Olives' },
    heading: { ar: 'أخضر، أسود،\nوكالاماتا', en: 'Green, black,\nand Kalamata' },
    body: {
      ar: 'ثلاث طرق لنفس الثمرة — كامل، شرائح، وكالاماتا على مائدتك.',
      en: 'Three ways with the same fruit — whole, sliced, and Kalamata on your table.',
    },
    primary: { label: { ar: 'تسوق الزيتون', en: 'Shop olives' }, to: '/listing/olives' },
    secondary: { label: { ar: 'كل الأقسام', en: 'All categories' }, to: '/listing/all' },
  },
  {
    id: 'desktop-pickles-range',
    image: images.heroDesktop.picklesRange,
    badge: { ar: 'تشكيلة المخلل', en: 'The pickle range' },
    eyebrow: { ar: 'المخللات', en: 'Pickles' },
    heading: { ar: 'من البرطمان\nإلى الدلو', en: 'From the jar\nto the tub' },
    body: {
      ar: 'كورنيشون، خيار سليم، وخيار شاورما — نفس المعيار، أحجام تناسب البيت والمطبخ.',
      en: 'Cornichons, whole cucumber, and shawarma pickle — the same standard, sizes for home and kitchen.',
    },
    primary: { label: { ar: 'تسوق المخللات', en: 'Shop pickles' }, to: '/listing/pickles' },
    secondary: { label: { ar: 'وصل حديثاً', en: 'New arrivals' }, to: '/new' },
  },
];
