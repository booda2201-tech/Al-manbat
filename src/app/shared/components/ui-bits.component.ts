import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EgpPipe } from '../pipes/egp.pipe';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rating" [attr.aria-label]="'التقييم ' + value + ' من 5، عدد التقييمات ' + count">
      <span class="stars" aria-hidden="true">
        <span *ngFor="let s of stars" [class.filled]="s <= rounded">★</span>
      </span>
      <span class="meta">{{ value | number : '1.1-1' }} ({{ count }})</span>
    </span>
  `,
  styles: [
    `
      .rating {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-olive-gold);
        font-size: 13px;
      }
      .stars span {
        opacity: 0.35;
      }
      .stars .filled {
        opacity: 1;
      }
      .meta {
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class RatingComponent {
  @Input() value = 0;
  @Input() count = 0;
  stars = [1, 2, 3, 4, 5];
  get rounded(): number {
    return Math.round(this.value);
  }
}

@Component({
  selector: 'app-qty',
  standalone: true,
  template: `
    <div class="qty">
      <button type="button" (click)="change(-1)" [disabled]="value <= min" [attr.aria-label]="'إنقاص الكمية'">−</button>
      <input [value]="value" readonly [attr.aria-label]="'الكمية ' + value" />
      <button type="button" (click)="change(1)" [disabled]="value >= max" [attr.aria-label]="'زيادة الكمية'">+</button>
    </div>
  `,
  styles: [
    `
      .qty {
        display: inline-flex;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        overflow: hidden;
        height: 44px;
      }
      button,
      input {
        width: 44px;
        border: 0;
        background: var(--color-surface-highest);
        text-align: center;
        font-weight: 700;
      }
      button:disabled {
        color: var(--color-disabled-text);
        cursor: not-allowed;
      }
    `,
  ],
})
export class QtyComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 99;
  @Output() valueChange = new EventEmitter<number>();

  change(delta: number): void {
    const next = this.value + delta;
    if (next < this.min || next > this.max) return;
    this.valueChange.emit(next);
  }
}

@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty">
      <img src="assets/brand/logo.png" alt="" class="mark" />
      <h2>{{ title }}</h2>
      <p class="muted">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        padding: 48px 16px;
      }
      .mark {
        width: 120px;
        margin: 0 auto 16px;
        border-radius: 16px;
      }
      h2 {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() title = 'لا توجد عناصر';
  @Input() message = '';
}

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [EgpPipe, CommonModule],
  template: `
    <div class="row">
      <span class="price">{{ price | egp }}</span>
      <span class="price-old" *ngIf="oldPrice">{{ oldPrice | egp }}</span>
    </div>
  `,
  styles: [
    `
      .row {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
    `,
  ],
})
export class PriceComponent {
  @Input() price = 0;
  @Input() oldPrice?: number;
}
