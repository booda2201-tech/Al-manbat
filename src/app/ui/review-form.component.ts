import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../services/locale.service';
import { IconComponent } from './icon.component';

export interface ReviewDraft {
  rating: number;
  name: string;
  title: string;
  body: string;
}

export function composeReviewComment(draft: ReviewDraft): string {
  return [draft.title.trim(), draft.body.trim()].filter(Boolean).join('\n\n');
}

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-[110] flex items-end justify-center bg-olive-900/40 p-0 sm:items-center sm:p-6" (click)="close()">
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-sand-50 p-6 shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="locale.ui('writeReview')"
        (click)="stop($event)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-2xs uppercase tracking-[0.16em] text-gold-400">{{ locale.ui('writeReview') }}</p>
            <h2 class="mt-1 font-displayAr text-2xl leading-tight text-olive-800">{{ productName }}</h2>
          </div>
          <button type="button" class="rounded-full p-2 text-ink-muted transition-colors duration-150 ease-premium hover:bg-white hover:text-olive-800" [attr.aria-label]="locale.ui('close')" (click)="close()">
            <app-icon name="close" [size]="18"></app-icon>
          </button>
        </div>

        <form class="mt-6 space-y-4" (ngSubmit)="submit()">
          <div>
            <p class="text-[13px] font-medium text-ink-soft">{{ locale.ui('reviewStars') }}</p>
            <div class="mt-2 flex items-center gap-1">
              <button
                *ngFor="let i of stars"
                type="button"
                class="rounded-md p-1 transition-transform duration-150 ease-premium hover:scale-110"
                [ngClass]="starTone(i)"
                [attr.aria-label]="starAria(i)"
                [attr.aria-pressed]="i <= rating"
                (mouseenter)="hover = i"
                (mouseleave)="hover = 0"
                (click)="pick(i)"
              >
                <app-icon name="star" [size]="28" [filled]="starOn(i)"></app-icon>
              </button>
            </div>
            <p class="mt-1.5 text-xs" [ngClass]="starsError ? 'text-state-danger' : 'text-ink-muted'">{{ starsHint }}</p>
          </div>

          <div>
            <label class="text-[13px] font-medium text-ink-soft" for="rv-name">{{ locale.ui('reviewName') }}</label>
            <input id="rv-name" class="field-input" [class.is-invalid]="nameError" [(ngModel)]="name" name="name" autocomplete="name" />
            <p *ngIf="nameError" class="mt-1.5 text-xs text-state-danger">{{ locale.ui('reviewNeedName') }}</p>
          </div>

          <div>
            <label class="text-[13px] font-medium text-ink-soft" for="rv-title">{{ locale.ui('reviewTitle') }}</label>
            <input id="rv-title" class="field-input" [(ngModel)]="title" name="title" [placeholder]="titlePh" />
          </div>

          <div>
            <label class="text-[13px] font-medium text-ink-soft" for="rv-body">{{ locale.ui('reviewBody') }}</label>
            <textarea id="rv-body" class="field-input field-area" [class.is-invalid]="bodyError" [(ngModel)]="body" name="body" [placeholder]="bodyPh" rows="4"></textarea>
            <p *ngIf="bodyError" class="mt-1.5 text-xs text-state-danger">{{ locale.ui('reviewNeedBody') }}</p>
          </div>

          <button type="submit" class="inline-flex h-12 w-full items-center justify-center rounded-md bg-olive-600 px-5 text-sm font-medium text-sand-50 shadow-sm transition-colors duration-200 ease-premium hover:bg-olive-700 disabled:opacity-60" [disabled]="saving">
            {{ saving ? locale.ui('reviewPublishing') : locale.ui('reviewSubmit') }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ReviewFormComponent implements OnInit, OnDestroy {
  @Input() productName = '';
  @Input() reviewerName = '';
  @Input() saving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<ReviewDraft>();

  stars = [1, 2, 3, 4, 5];
  rating = 0;
  hover = 0;
  name = '';
  title = '';
  body = '';
  starsError = false;
  nameError = false;
  bodyError = false;

  constructor(public locale: LocaleService) {
    document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    if (this.reviewerName.trim()) this.name = this.reviewerName.trim();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  get titlePh(): string {
    return this.locale.isAr() ? 'مثلاً: زيت ممتاز للبيت' : 'e.g. Excellent oil for the kitchen';
  }

  get bodyPh(): string {
    return this.locale.isAr() ? 'أخبرنا عن الطعم، التغليف، والتوصيل…' : 'Tell us about taste, packaging, and delivery…';
  }

  get starsHint(): string {
    if (this.starsError && !(this.hover || this.rating)) return this.locale.ui('reviewNeedStars');
    const n = this.hover || this.rating;
    const ar = this.locale.isAr();
    if (n === 1) return ar ? 'ضعيف' : 'Poor';
    if (n === 2) return ar ? 'مقبول' : 'Fair';
    if (n === 3) return ar ? 'جيد' : 'Good';
    if (n === 4) return ar ? 'جيد جداً' : 'Very good';
    if (n === 5) return ar ? 'ممتاز' : 'Excellent';
    return ar ? 'اضغط على النجوم لاختيار التقييم' : 'Tap the stars to rate';
  }

  starOn(i: number): boolean {
    return i <= (this.hover || this.rating);
  }

  starTone(i: number): string {
    return this.starOn(i) ? 'text-gold-400' : 'text-sand-300';
  }

  starAria(i: number): string {
    return this.locale.isAr() ? `${i} من 5` : `${i} out of 5`;
  }

  pick(i: number): void {
    this.rating = i;
    this.starsError = false;
  }

  stop(ev: Event): void {
    ev.stopPropagation();
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.saving) return;
    this.starsError = this.rating < 1;
    this.nameError = !this.name.trim();
    this.bodyError = false;
    if (this.starsError || this.nameError) return;
    this.submitted.emit({
      rating: this.rating,
      name: this.name.trim(),
      title: this.title.trim(),
      body: this.body.trim(),
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
