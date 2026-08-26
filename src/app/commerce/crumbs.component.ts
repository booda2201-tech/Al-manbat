import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../ui/icon.component';

export interface Crumb {
  label: string;
  to?: string;
}

@Component({
  selector: 'app-crumbs',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <nav class="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted" aria-label="breadcrumb">
      <span *ngFor="let c of trail; let last = last" class="flex items-center gap-1.5">
        <a *ngIf="c.to && !last" [routerLink]="c.to" class="transition-colors duration-150 ease-premium hover:text-olive-700">{{ c.label }}</a>
        <span *ngIf="!c.to || last" class="text-ink-soft">{{ c.label }}</span>
        <app-icon *ngIf="!last" name="chevron-right" [size]="12" class="text-sand-300 rtl:rotate-180"></app-icon>
      </span>
    </nav>
  `,
})
export class CrumbsComponent {
  @Input() trail: Crumb[] = [];
}
