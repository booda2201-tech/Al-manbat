import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brandPillars, faqs } from '../data/content';
import { images } from '../data/images';
import { LocaleService } from '../services/locale.service';
import { CatalogService } from '../services/catalog.service';
import { StoreService } from '../services/store.service';
import { LogoComponent } from '../ui/logo.component';
import { ScrollOpenDirective } from '../ui/scroll-open.directive';
import { ProductRailComponent, SectionHeaderComponent, TrustStripComponent } from '../commerce/commerce.component';
import { CrumbsComponent } from '../commerce/crumbs.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent, TrustStripComponent, ScrollOpenDirective],
  template: `
    <div class="about-page">
      <section class="about-hero">
        <img [src]="images.hero" alt="" class="about-hero__img" />
        <div class="about-hero__scrim"></div>
        <div class="about-hero__copy">
          <div class="mx-auto w-full max-w-shell px-4 lg:px-10">
            <div class="max-w-2xl">
              <span class="about-hero__logo"><app-logo tone="light" size="lg"></app-logo></span>
              <h1 class="about-hero__title font-displayAr">{{ locale.isAr() ? 'بدأنا من بستان واحد' : 'We began with one grove' }}</h1>
              <p class="about-hero__lede">{{ locale.isAr() ? 'المنبت بيت للزيتون والمخلل. بدأنا من بستان واحد في مصر، وسألنا سؤالاً واحداً: لماذا يصعب أن تجد زيتاً تعرف مصدره، وزيتوناً يُملّح كما يجب، ومخللاً يقرمش بعد أسبوع من الفتح؟' : 'Almanbat is a house of olives and pickles. We began with one grove in Egypt, and one question: why is it so hard to find oil you can trace, olives cured properly, and pickle that still crunches a week after opening?' }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section mx-auto max-w-shell px-4 lg:px-10">
        <div class="grid min-w-0 gap-8 xl:grid-cols-[1fr_1.1fr] xl:gap-20">
          <div>
            <p class="text-2xs uppercase tracking-[0.22em] text-gold-400">{{ locale.isAr() ? 'ما نؤمن به' : 'What we hold to' }}</p>
            <h2 class="about-heading mt-3 font-displayAr text-olive-800">{{ locale.isAr() ? 'ثلاثة مبادئ تحكم كل قرار' : 'Three principles behind every decision' }}</h2>
          </div>
          <div class="about-pillars">
            <div *ngFor="let p of pillars; let last = last" class="about-pillar" [class.is-last]="last">
              <h3 class="font-display text-[22px] text-olive-700 md:text-2xl">{{ locale.tr(p.title) }}</h3>
              <p class="mt-2 text-[14px] leading-relaxed text-ink-soft md:mt-3 md:text-[15px]">{{ locale.tr(p.body) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="grain relative bg-olive-800">
        <div class="mx-auto max-w-shell px-4 lg:px-10">
          <dl class="about-stats">
            <div *ngFor="let item of numbers" class="about-stat">
              <dt>{{ locale.tr(item.label) }}</dt>
              <dd class="font-display">{{ item.value }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="about-section mx-auto max-w-shell px-4 lg:px-10">
        <div class="grid min-w-0 items-center gap-8 xl:grid-cols-2 xl:gap-16">
          <div appScrollOpen class="overflow-hidden rounded-2xl">
            <span class="scroll-open__media block">
              <img [src]="images.campaign" alt="" class="aspect-[4/3] w-full object-cover" />
            </span>
          </div>
          <div class="min-w-0">
            <h2 class="about-heading font-displayAr text-olive-800">{{ locale.isAr() ? 'كيف نختار ما نعرضه' : 'How we decide what to list' }}</h2>
            <ol class="about-steps">
              <li *ngFor="let step of steps; let i = index">
                <span>{{ i + 1 }}</span>
                <p>{{ locale.isAr() ? step.ar : step.en }}</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section class="border-y border-olive-800/10 bg-sand-100/50 py-8 md:py-12">
        <div class="mx-auto max-w-shell px-4 lg:px-10">
          <app-trust-strip></app-trust-strip>
        </div>
      </section>

      <section class="about-section mx-auto max-w-shell px-4 lg:px-10">
        <h2 class="about-heading font-displayAr text-olive-800">{{ locale.isAr() ? 'ابدأ من هنا' : 'Start here' }}</h2>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
          <a *ngFor="let c of categories" [routerLink]="['/category', c.slug]" appScrollOpen class="group relative flex h-32 items-end overflow-hidden rounded-lg p-4 md:h-36">
            <span class="scroll-open__media absolute inset-0">
              <img [src]="c.image" alt="" class="h-full w-full object-cover transition-transform duration-[700ms] ease-premium group-hover:scale-105" />
            </span>
            <span class="absolute inset-0 bg-olive-900/55 transition-colors duration-500 ease-premium group-hover:bg-olive-900/40"></span>
            <span class="relative font-displayAr text-lg leading-tight text-sand-50">{{ locale.tr(c.name) }}</span>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class AboutPageComponent {
  images = images;
  pillars = brandPillars;
  numbers = [
    { value: '2019', label: { ar: 'سنة التأسيس', en: 'Founded' } },
    { value: '48', label: { ar: 'صنفاً مختاراً', en: 'Curated SKUs' } },
    { value: '38', label: { ar: 'مورّد معتمد', en: 'Vetted suppliers' } },
    { value: '96%', label: { ar: 'رضا العملاء', en: 'Customer satisfaction' } },
  ];
  steps = [
    { ar: 'نزور البستان أو المونة قبل أي اتفاق.', en: 'We visit the grove or the pantry before any agreement.' },
    { ar: 'نتذوق كل دفعة في بيوتنا لأسبوعين على الأقل.', en: 'We taste every batch in our own kitchens for at least two weeks.' },
    { ar: 'نثبت الحموضة وتاريخ الحصاد ورقم الدفعة على العبوة.', en: 'We print acidity, harvest date and batch number on the pack.' },
    { ar: 'نكتب الوصف بأنفسنا، بما فيه العيوب إن وُجدت.', en: 'We write the description ourselves — including the drawbacks.' },
  ];
  constructor(public locale: LocaleService, public catalog: CatalogService) {}
  get categories() {
    return this.catalog.categories();
  }
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, CrumbsComponent],
  template: `
    <div class="mx-auto max-w-4xl px-4 py-9">
      <app-crumbs [trail]="trail"></app-crumbs>
      <h1 class="mt-5 font-displayAr text-4xl text-olive-800">{{ locale.ui('faq') }}</h1>
      <div class="mt-8 divide-y divide-olive-800/10 border-y">
        <div *ngFor="let f of faqs; let i = index" class="py-4">
          <button type="button" class="w-full text-start font-medium text-olive-800" (click)="open = open === i ? null : i">{{ locale.tr(f.q) }}</button>
          <p *ngIf="open === i" class="mt-2 text-sm text-ink-muted">{{ locale.tr(f.a) }}</p>
        </div>
      </div>
    </div>
  `,
})
export class FaqPageComponent {
  faqs = faqs;
  open: number | null = 0;
  constructor(public locale: LocaleService) {}
  get trail() {
    return [{ label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' }, { label: this.locale.ui('faq') }];
  }
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductRailComponent, SectionHeaderComponent],
  template: `
    <div class="mx-auto max-w-shell px-4 py-16 lg:px-10 text-center">
      <p class="font-display text-[80px] text-gold-400">404</p>
      <h1 class="mt-4 font-displayAr text-4xl text-olive-800">{{ locale.isAr() ? 'هذه الصفحة غير موجودة' : 'This page doesn’t exist' }}</h1>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" class="h-12 rounded-md bg-olive-600 px-6 text-sand-50" (click)="store.searchOpen.set(true)">{{ locale.ui('search') }}</button>
        <a routerLink="/" class="inline-flex h-12 items-center rounded-md border px-6">{{ locale.isAr() ? 'الصفحة الرئيسية' : 'Back home' }}</a>
      </div>
      <ul class="mt-10 flex flex-wrap justify-center gap-2">
        <li *ngFor="let c of categories"><a [routerLink]="['/category', c.slug]" class="inline-flex h-9 items-center rounded-full border px-3.5 text-[13px]">{{ locale.tr(c.name) }}</a></li>
      </ul>
      <div class="mt-16 text-start"><app-section-header [title]="locale.ui('bestSellers')"></app-section-header><app-product-rail [products]="more"></app-product-rail></div>
    </div>
  `,
})
export class NotFoundPageComponent {
  constructor(public locale: LocaleService, public store: StoreService, public catalog: CatalogService) {}
  get categories() {
    return this.catalog.categories();
  }
  get more() {
    return this.catalog.all().slice(0, 6);
  }
}

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  template: `
    <div class="grain relative flex min-h-[70vh] items-center justify-center bg-olive-800 px-4 py-20">
      <div class="max-w-xl text-center">
        <div class="flex justify-center"><app-logo tone="light" size="lg"></app-logo></div>
        <h1 class="mt-6 font-displayAr text-4xl text-sand-50">{{ locale.isAr() ? 'نعود بعد قليل' : 'We’ll be right back' }}</h1>
        <p class="mt-4 text-sand-100/75">{{ locale.isAr() ? 'نُحدّث المتجر لتحسين سرعة التصفح والدفع.' : 'We’re updating the store to make browsing and checkout faster.' }}</p>
      </div>
    </div>
  `,
})
export class MaintenancePageComponent {
  constructor(public locale: LocaleService) {}
}
