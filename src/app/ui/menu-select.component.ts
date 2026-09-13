import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

export type MenuSelectValue = string | number;

export interface MenuSelectOption {
  value: MenuSelectValue;
  label: string;
}

@Component({
  selector: 'app-menu-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MenuSelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'menu-select relative z-20 block w-full min-w-0',
    '[class.is-toolbar]': 'variant === "toolbar"',
    '[class.is-open]': 'open',
  },
  template: `
    <button
      type="button"
      class="sort-trigger"
      [ngClass]="triggerClass()"
      [attr.aria-expanded]="open"
      aria-haspopup="listbox"
      [attr.aria-label]="title || placeholder"
      (click)="toggle($event)"
    >
      <span *ngIf="icon" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-gold-400">
        <app-icon [name]="icon" [size]="15"></app-icon>
      </span>
      <span class="min-w-0 flex-1 text-start">
        <span *ngIf="kicker" class="sort-trigger__kicker" [class.is-en]="kickerEn">{{ kicker }}</span>
        <span class="sort-trigger__value" [class.is-empty]="!currentLabel" [class.mt-0.5]="!!kicker">{{ currentLabel || placeholder }}</span>
      </span>
      <app-icon
        name="chevron-down"
        [size]="16"
        class="shrink-0 text-olive-800/50 transition-transform duration-200 ease-premium"
        [class.rotate-180]="open"
      ></app-icon>
    </button>

    <ul *ngIf="open" class="sort-menu" role="listbox" [attr.aria-label]="title || placeholder">
      <li *ngFor="let opt of options">
        <button
          type="button"
          role="option"
          class="sort-option"
          [class.is-active]="isActive(opt)"
          [attr.aria-selected]="isActive(opt)"
          (click)="pick(opt)"
        >
          <span>{{ opt.label }}</span>
          <app-icon *ngIf="isActive(opt)" name="check" [size]="15" class="text-gold-400"></app-icon>
        </button>
      </li>
    </ul>

    <ng-container *ngIf="open">
      <div class="sort-sheet-scrim" (click)="close()"></div>
      <div class="sort-sheet" role="dialog" [attr.aria-label]="title || placeholder" (click)="$event.stopPropagation()">
        <div class="sort-sheet__grab" aria-hidden="true"></div>
        <header class="sort-sheet__head">
          <h2>{{ title || placeholder }}</h2>
          <button type="button" class="sort-sheet__close" [attr.aria-label]="closeLabel" (click)="close()">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </header>
        <ul class="sort-sheet__list" role="listbox">
          <li *ngFor="let opt of options">
            <button
              type="button"
              role="option"
              class="sort-option"
              [class.is-active]="isActive(opt)"
              [attr.aria-selected]="isActive(opt)"
              (click)="pick(opt)"
            >
              <span>{{ opt.label }}</span>
              <app-icon *ngIf="isActive(opt)" name="check" [size]="16" class="text-gold-400"></app-icon>
            </button>
          </li>
        </ul>
      </div>
    </ng-container>
  `,
})
export class MenuSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() options: MenuSelectOption[] = [];
  @Input() value: MenuSelectValue | null = '';
  @Output() valueChange = new EventEmitter<MenuSelectValue>();
  @Input() placeholder = '';
  @Input() title = '';
  @Input() kicker = '';
  @Input() kickerEn = false;
  @Input() icon = '';
  @Input() variant: 'toolbar' | 'field' = 'field';
  @Input() closeLabel = 'إغلاق';
  open = false;

  private onChange: (value: MenuSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private host: ElementRef<HTMLElement>) {}

  get currentLabel(): string {
    return this.options.find((opt) => this.isActive(opt))?.label || '';
  }

  isActive(opt: MenuSelectOption): boolean {
    if (this.value == null || this.value === '') return false;
    return String(this.value) === String(opt.value);
  }

  triggerClass(): string {
    return [this.open ? 'is-open' : '', this.variant === 'field' ? 'is-field' : ''].filter(Boolean).join(' ');
  }

  toggle(ev?: Event): void {
    ev?.stopPropagation();
    this.open = !this.open;
    if (!this.open) this.onTouched();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.onTouched();
  }

  pick(opt: MenuSelectOption): void {
    this.value = opt.value;
    this.valueChange.emit(opt.value);
    this.onChange(opt.value);
    this.open = false;
    this.onTouched();
  }

  writeValue(value: MenuSelectValue | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: MenuSelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open || this.isCompact()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private isCompact(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  }
}
