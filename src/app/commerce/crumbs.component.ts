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
    <nav class="crumbs" aria-label="breadcrumb">
      <ol class="crumbs__list">
        <li *ngFor="let c of trail; let last = last; trackBy: trackCrumb" class="crumbs__item">
          <a *ngIf="c.to && !last" [routerLink]="c.to" class="crumbs__link">{{ c.label }}</a>
          <span *ngIf="!c.to || last" class="crumbs__current" [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span>
          <app-icon *ngIf="!last" name="chevron-right" [size]="12" class="crumbs__sep"></app-icon>
        </li>
      </ol>
    </nav>
  `,
})
export class CrumbsComponent {
  @Input() trail: Crumb[] = [];

  trackCrumb(_: number, crumb: Crumb): string {
    return `${crumb.to ?? ''}::${crumb.label}`;
  }
}
