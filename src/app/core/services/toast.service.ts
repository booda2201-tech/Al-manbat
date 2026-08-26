import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  actionLabel?: string;
  actionLink?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { ...toast, id }]);
    window.setTimeout(() => this.dismiss(id), 4200);
  }

  success(title: string, message?: string, action?: { label: string; link: string }): void {
    this.show({ type: 'success', title, message, actionLabel: action?.label, actionLink: action?.link });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
