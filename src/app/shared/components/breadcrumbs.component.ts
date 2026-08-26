import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="crumbs" aria-label="مسار الصفحة">
      <ol>
        <li><a routerLink="/">الرئيسية</a></li>
        <li *ngFor="let c of items; let last = last">
          <a *ngIf="c.link && !last" [routerLink]="c.link">{{ c.label }}</a>
          <span *ngIf="!c.link || last" aria-current="page">{{ c.label }}</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      ol {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        list-style: none;
        padding: 0;
        margin: 0 0 16px;
        color: var(--color-text-muted);
        font-size: 13px;
      }
      li:not(:last-child)::after {
        content: '‹';
        margin-inline-start: 6px;
      }
      [aria-current] {
        color: var(--color-primary);
        font-weight: 700;
      }
    `,
  ],
})
export class BreadcrumbsComponent {
  @Input() items: Crumb[] = [];
}
