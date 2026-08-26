import type { Address, Bilingual, Order, Review } from '../types';
import { images } from './images';

export const trustPoints: Array<{icon: 'truck' | 'shield' | 'rotate' | 'headset';title: Bilingual;body: Bilingual;}> = [
{
  icon: 'truck',
  title: { ar: 'توصيل في نفس اليوم', en: 'Same-day delivery' },
  body: { ar: 'في الرياض وجدة والدمام على الطلبات قبل الرابعة عصراً.', en: 'In Riyadh, Jeddah and Dammam on orders placed before 4pm.' }
},
{
  icon: 'shield',
  title: { ar: 'أصالة مضمونة', en: 'Guaranteed authentic' },
  body: { ar: 'كل دفعة موثّقة من البستان أو المونة، بتاريخ حصاد واضح.', en: 'Every batch traced to the grove or pantry, with a clear harvest date.' }
},
{
  icon: 'rotate',
  title: { ar: 'إرجاع مجاني ١٤ يوماً', en: 'Free 14-day returns' },
  body: { ar: 'نجمع الطلب من بابك دون أي رسوم.', en: 'We collect from your door at no cost.' }
},
{
  icon: 'headset',
  title: { ar: 'خدمة عملاء حقيقية', en: 'Real human care' },
  body: { ar: 'فريق سعودي يجيب خلال دقيقتين، عربي وإنجليزي.', en: 'A local team answering within two minutes, in Arabic or English.' }
}];


export const testimonials: Array<{name: Bilingual;role: Bilingual;quote: Bilingual;rating: number;}> = [
{
  name: { ar: 'نورة العتيبي', en: 'Noura Al-Otaibi' },
  role: { ar: 'الرياض · عميلة منذ ٢٠٢٣', en: 'Riyadh · Customer since 2023' },
  quote: {
    ar: 'زيت المحصول المحفوظ صار الزيت الوحيد في المطبخ. التغليف محكم والطعم كما وُصف، بلا مبالغة.',
    en: 'The reserve oil is now the only oil in the kitchen. Tight packaging, and the taste matches the description — no exaggeration.'
  },
  rating: 5
},
{
  name: { ar: 'خالد المطيري', en: 'Khalid Al-Mutairi' },
  role: { ar: 'جدة · عميل منذ ٢٠٢٢', en: 'Jeddah · Customer since 2022' },
  quote: {
    ar: 'طلبت تنكة العائلة ومكدوس في شحنة واحدة. وصل بارد، والبرطمانات محكمة كما لو خرجت من المونة.',
    en: 'I ordered the family tin and makdous in one shipment. It arrived cool, jars sealed as if they left a home pantry.'
  },
  rating: 5
},
{
  name: { ar: 'ريم الحربي', en: 'Reem Al-Harbi' },
  role: { ar: 'الخبر · عميلة منذ ٢٠٢٤', en: 'Khobar · Customer since 2024' },
  quote: {
    ar: 'اللفت المخلل لونه من الشمندر فعلاً، والخيار يقرمش بعد أسبوع من الفتح. هذا مخلل بيت.',
    en: 'The pickled turnip really is coloured by beet, and the cucumber still crunches a week after opening. This is house pickle.'
  },
  rating: 5
}];


export const collections: Array<{title: Bilingual;subtitle: Bilingual;image: string;span: 'wide' | 'tall' | 'normal';}> = [
{
  title: { ar: 'موسم العصرة', en: 'Press Season' },
  subtitle: { ar: 'زيوت المحصول الجديد', en: 'New-harvest oils' },
  image: images.cat['olive-oil'],
  span: 'wide'
},
{
  title: { ar: 'مائدة الزيتون', en: 'The Olive Table' },
  subtitle: { ar: 'أخضر وأسود ومحشي', en: 'Green, black and stuffed' },
  image: images.cat['table-olives'],
  span: 'normal'
},
{
  title: { ar: 'مخلل البيت', en: 'House Pickles' },
  subtitle: { ar: 'خيار ولفت ومشكل', en: 'Cucumber, turnip, mixed' },
  image: images.cat.pickles,
  span: 'normal'
},
{
  title: { ar: 'مونة الشتاء', en: 'Winter Pantry' },
  subtitle: { ar: 'مكدوس وورق عنب', en: 'Makdous and vine leaves' },
  image: images.cat.stuffed,
  span: 'tall'
}];


export const reviews: Review[] = [
{
  id: 'r1',
  author: { ar: 'سارة ع.', en: 'Sarah A.' },
  rating: 5,
  date: '2026-08-02',
  title: { ar: 'يستحق كل ريال', en: 'Worth every riyal' },
  body: {
    ar: 'استخدمته أسبوعين والفرق واضح. التغليف ممتاز والتوصيل وصل قبل الموعد بيوم.',
    en: 'Two weeks in and the difference is clear. Excellent packaging and it arrived a day early.'
  },
  verified: true
},
{
  id: 'r2',
  author: { ar: 'عبدالله م.', en: 'Abdullah M.' },
  rating: 4,
  date: '2026-07-21',
  title: { ar: 'جيد جداً مع ملاحظة صغيرة', en: 'Very good, with one note' },
  body: {
    ar: 'الجودة عالية، لكن كنت أتمنى عبوة أكبر بنفس السعر.',
    en: 'High quality overall, though I’d have liked a larger size at the same price.'
  },
  verified: true
},
{
  id: 'r3',
  author: { ar: 'منى ح.', en: 'Mona H.' },
  rating: 5,
  date: '2026-07-08',
  title: { ar: 'أعدت الطلب مرتين', en: 'Reordered twice already' },
  body: { ar: 'صار من أساسيات البيت عندي. خدمة العملاء متعاونة جداً.', en: 'It’s become a household staple. Customer care was very helpful.' },
  verified: true
}];


export const ratingBreakdown = [
{ stars: 5, percent: 78 },
{ stars: 4, percent: 14 },
{ stars: 3, percent: 5 },
{ stars: 2, percent: 2 },
{ stars: 1, percent: 1 }];


export const orders: Order[] = [
{
  id: 'ALM-24817',
  date: '2026-08-22',
  status: 'in_transit',
  total: 197,
  itemIds: ['oil-reserve', 'pkl-cucumber'],
  eta: { ar: 'يصل غداً قبل ٦ مساءً', en: 'Arriving tomorrow before 6pm' }
},
{
  id: 'ALM-24102',
  date: '2026-08-04',
  status: 'delivered',
  total: 156,
  itemIds: ['oil-tin', 'olv-stuffed']
},
{
  id: 'ALM-23640',
  date: '2026-07-11',
  status: 'delivered',
  total: 68,
  itemIds: ['stf-makdous']
},
{
  id: 'ALM-23188',
  date: '2026-06-28',
  status: 'cancelled',
  total: 38,
  itemIds: ['olv-lemon']
}];


export const addresses: Address[] = [
{
  id: 'a1',
  label: { ar: 'المنزل', en: 'Home' },
  line: { ar: 'حي الياسمين، شارع الأمير سلطان، مبنى ١٢', en: 'Al Yasmin, Prince Sultan St, Building 12' },
  city: { ar: 'الرياض', en: 'Riyadh' },
  phone: '+966 55 014 2288',
  isDefault: true
},
{
  id: 'a2',
  label: { ar: 'المكتب', en: 'Office' },
  line: { ar: 'برج المنبت، طريق الملك فهد، الطابق ٩', en: 'Almanbat Tower, King Fahd Rd, Floor 9' },
  city: { ar: 'الرياض', en: 'Riyadh' },
  phone: '+966 55 014 2288',
  isDefault: false
}];


export const faqs: Array<{q: Bilingual;a: Bilingual;}> = [
{
  q: { ar: 'كم تستغرق مدة التوصيل؟', en: 'How long does delivery take?' },
  a: {
    ar: 'الطلبات داخل الرياض وجدة والدمام تُسلّم في نفس اليوم إذا طُلبت قبل الرابعة عصراً. باقي المناطق من يوم إلى ثلاثة أيام عمل. الزيوت والتنك تُشحن بعبوات تحميها من الحرارة.',
    en: 'Orders in Riyadh, Jeddah and Dammam are delivered same-day when placed before 4pm. Other regions take one to three working days. Oils and tins ship in packaging that shields them from heat.'
  }
},
{
  q: { ar: 'ما سياسة الإرجاع؟', en: 'What is the return policy?' },
  a: {
    ar: 'إرجاع مجاني خلال ١٤ يوماً على كل المنتجات غير المستخدمة بعلبتها الأصلية. نجمع الشحنة من بابك ونعيد المبلغ خلال ٣ أيام عمل.',
    en: 'Free returns within 14 days on any unused item in its original packaging. We collect from your door and refund within three working days.'
  }
},
{
  q: { ar: 'كيف أعرف أن الزيت بكر ممتاز فعلاً؟', en: 'How do I know the oil is truly extra virgin?' },
  a: {
    ar: 'كل زجاجة تحمل رقم الدفعة، نسبة الحموضة، وتاريخ الحصاد. نعصر على البارد ونختبر الحموضة قبل التعبئة. إن شككت نستبدل المنتج فوراً.',
    en: 'Every bottle carries a batch number, acidity and harvest date. We cold-press and test acidity before filling. If you ever doubt a bottle, we replace it immediately.'
  }
},
{
  q: { ar: 'هل المخلل يحتاج ثلاجة بعد الفتح؟', en: 'Do pickles need the fridge after opening?' },
  a: {
    ar: 'نعم. بعد الفتح احفظ البرطمان مغطى في الثلاجة، وتأكد أن الخضار يبقى مغموراً بالمحلول. يصلح عادةً لأربعة أسابيع.',
    en: 'Yes. After opening, keep the jar covered in the fridge, with vegetables submerged in brine. It typically keeps for four weeks.'
  }
},
{
  q: { ar: 'ما طرق الدفع المتاحة؟', en: 'Which payment methods are available?' },
  a: {
    ar: 'مدى، فيزا، ماستركارد، أبل باي، تابي وتمارا للتقسيط، والدفع عند الاستلام في مدن مختارة.',
    en: 'Mada, Visa, Mastercard, Apple Pay, Tabby and Tamara instalments, plus cash on delivery in selected cities.'
  }
}];


export const supportChannels: Array<{title: Bilingual;detail: Bilingual;action: Bilingual;href: string;}> = [
{
  title: { ar: 'محادثة فورية', en: 'Live chat' },
  detail: { ar: 'متوسط الرد دقيقتان · ٢٤/٧', en: 'Average reply 2 minutes · 24/7' },
  action: { ar: 'ابدأ المحادثة', en: 'Start chat' },
  href: '#contact-form'
},
{
  title: { ar: 'الهاتف', en: 'Phone' },
  detail: { ar: '٩٢٠٠ ١٢٣ ٤٥ · من ٨ص إلى ١١م', en: '9200 123 45 · 8am – 11pm' },
  action: { ar: 'اتصل بنا', en: 'Call us' },
  href: 'tel:+966920012345'
},
{
  title: { ar: 'البريد الإلكتروني', en: 'Email' },
  detail: { ar: 'care@almanbat.sa · رد خلال ٤ ساعات', en: 'care@almanbat.sa · reply within 4 hours' },
  action: { ar: 'أرسل رسالة', en: 'Send a message' },
  href: 'mailto:care@almanbat.sa'
}];


export const brandPillars: Array<{title: Bilingual;body: Bilingual;}> = [
{
  title: { ar: 'الجذور', en: 'Roots' },
  body: {
    ar: 'بدأنا من بستان زيتون واحد في الجوف. المصدر ليس تفصيلاً تسويقياً عندنا، بل بداية كل قرار.',
    en: 'We began with a single olive grove in Al-Jouf. Provenance isn’t a marketing detail here — it’s where every decision starts.'
  }
},
{
  title: { ar: 'الاختيار', en: 'Curation' },
  body: {
    ar: 'نرفض أكثر مما نعرض. كل زيت وكل برطمان يمر بسؤال واحد: هل نقدّمه على مائدتنا؟',
    en: 'We reject more than we list. Every oil and every jar passes one question: would we serve this at our own table?'
  }
},
{
  title: { ar: 'الوضوح', en: 'Clarity' },
  body: {
    ar: 'سعر واحد واضح، وصف صادق، ووقت توصيل نلتزم به. الثقة تُبنى بالتفاصيل الصغيرة المتكررة.',
    en: 'One clear price, an honest description, and a delivery window we keep. Trust is built in small details, repeated.'
  }
}];