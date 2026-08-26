import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-sort-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  host: { class: 'relative z-20 inline-block w-full min-w-0 sm:w-auto' },
  template: `
    <button
      type="button"
      class="sort-trigger"
      [ngClass]="triggerClass()"
      [attr.aria-expanded]="open"
      aria-haspopup="listbox"
      [attr.aria-label]="locale.ui('sortBy')"
      (click)="toggle()"
    >
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-gold-400">
        <app-icon name="sort" [size]="15"></app-icon>
      </span>
      <span class="min-w-0 flex-1 text-start">
        <span class="block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{{ locale.ui('sortBy') }}</span>
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
  `,
})
export class SortSelectComponent {
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

  toggle(): void {
    this.open = !this.open;
  }

  pick(next: string): void {
    this.value = next;
    this.valueChange.emit(next);
    this.open = false;
  }

  triggerClass(): string {
    return this.open ? 'is-open' : '';
  }

  chevronClass(): string {
    return this.open ? 'rotate-180' : '';
  }

  optionClass(opt: string): string {
    return opt === this.value ? 'is-active' : '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }
}
