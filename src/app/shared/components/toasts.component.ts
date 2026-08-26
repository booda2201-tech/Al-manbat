import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="host" aria-live="polite">
      <div class="toast" *ngFor="let t of toast.toasts()" [class]="t.type">
        <div>
          <strong>{{ t.title }}</strong>
          <p *ngIf="t.message">{{ t.message }}</p>
          <a *ngIf="t.actionLink" [routerLink]="t.actionLink">{{ t.actionLabel }}</a>
        </div>
        <button type="button" (click)="toast.dismiss(t.id)" aria-label="إغلاق التنبيه">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .host {
        position: fixed;
        bottom: 16px;
        inset-inline-start: 16px;
        z-index: var(--z-toast);
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(360px, calc(100% - 32px));
      }
      .toast {
        background: var(--color-deep-olive);
        color: var(--color-soft-ivory);
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        box-shadow: var(--shadow-olive-hover);
      }
      .toast.error {
        background: var(--color-danger);
      }
      a {
        color: var(--color-olive-gold);
        font-weight: 700;
      }
    `,
  ],
})
export class ToastsComponent {
  constructor(public toast: ToastService) {}
}
