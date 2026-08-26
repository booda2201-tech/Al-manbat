import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-sort-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  host: { class: 'relative z-20 inline-block w-full min-w-0 lg:w-auto' },
  template: `
    <button
      type="button"
      class="sort-trigger"
      [ngClass]="triggerClass()"
      [attr.aria-expanded]="open"
      aria-haspopup="listbox"
      [attr.aria-label]="locale.ui('sortBy')"
      (click)="toggle($event)"
    >
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-gold-400">
        <app-icon name="sort" [size]="15"></app-icon>
      </span>
      <span class="min-w-0 flex-1 text-start">
        <span class="sort-trigger__kicker" [ngClass]="kickerClass()">{{ locale.ui('sortBy') }}</span>
        <span class="mt-0.5 block truncate text-[13px] font-medium text-olive-800">{{ currentLabel }}</span>
      </span>
      <app-icon name="chevron-down" [size]="16" class="shrink-0 text-olive-800/50 transition-transform duration-200 ease-premium" [ngClass]="chevronClass()"></app-icon>
    </button>

    <ul *ngIf="open" class="sort-menu" role="listbox" [attr.aria-label]="locale.ui('sortBy')">
      <li *ngFor="let opt of keys">
        <button
          type="button"
          role="option"
          class="sort-option"
          [ngClass]="optionClass(opt)"
          [attr.aria-selected]="opt === value"
          (click)="pick(opt)"
        >
          <span>{{ optionLabel(opt) }}</span>
          <app-icon *ngIf="opt === value" name="check" [size]="15" class="text-gold-400"></app-icon>
        </button>
      </li>
    </ul>

    <ng-container *ngIf="open">
      <div class="sort-sheet-scrim" (click)="close()"></div>
      <div class="sort-sheet" role="dialog" [attr.aria-label]="locale.ui('sortBy')" (click)="$event.stopPropagation()">
        <div class="sort-sheet__grab" aria-hidden="true"></div>
        <header class="sort-sheet__head">
          <h2>{{ locale.ui('sortBy') }}</h2>
          <button type="button" class="sort-sheet__close" [attr.aria-label]="locale.isAr() ? 'إغلاق' : 'Close'" (click)="close()">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </header>
        <ul class="sort-sheet__list" role="listbox">
          <li *ngFor="let opt of keys">
            <button
              type="button"
              role="option"
              class="sort-option"
              [ngClass]="optionClass(opt)"
              [attr.aria-selected]="opt === value"
              (click)="pick(opt)"
            >
              <span>{{ optionLabel(opt) }}</span>
              <app-icon *ngIf="opt === value" name="check" [size]="16" class="text-gold-400"></app-icon>
            </button>
          </li>
        </ul>
      </div>
    </ng-container>
  `,
})
export class SortSelectComponent implements OnDestroy {
  @Input() value = 'popular';
  @Output() valueChange = new EventEmitter<string>();
  open = false;
  readonly keys = ['popular', 'newest', 'price-asc', 'price-desc', 'rating'];

  constructor(public locale: LocaleService, private host: ElementRef<HTMLElement>) {}

  optionLabel(key: string): string {
    const ar = this.locale.isAr();
    if (key === 'newest') return ar ? 'الأحدث' : 'Newest';
    if (key === 'price-asc') return ar ? 'السعر: الأقل أولاً' : 'Price: low to high';
    if (key === 'price-desc') return ar ? 'السعر: الأعلى أولاً' : 'Price: high to low';
    if (key === 'rating') return ar ? 'الأعلى تقييماً' : 'Top rated';
    return ar ? 'الأكثر شعبية' : 'Most popular';
  }

  get currentLabel(): string {
    return this.optionLabel(this.value);
  }

  toggle(ev?: Event): void {
    ev?.stopPropagation();
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  pick(next: string): void {
    this.value = next;
    this.valueChange.emit(next);
    this.open = false;
  }

  triggerClass(): string {
    return this.open ? 'is-open' : '';
  }

  kickerClass(): string {
    return this.locale.isAr() ? '' : 'is-en';
  }

  chevronClass(): string {
    return this.open ? 'rotate-180' : '';
  }

  optionClass(opt: string): string {
    return opt === this.value ? 'is-active' : '';
  }

  ngOnDestroy(): void {
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open || this.isCompact()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }

  private isCompact(): boolean {
    return window.matchMedia('(max-width: 1023px)').matches;
  }
}
