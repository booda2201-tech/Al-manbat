import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M20 20l-3.5-3.5"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'user'">
          <circle cx="12" cy="8" r="3.2"></circle>
          <path d="M5 19c1.4-3 4-4.5 7-4.5S17.6 16 19 19"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'heart'">
          <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'cart'">
          <path d="M6 7h15l-1.5 8.5H8L6 7z"></path>
          <path d="M6 7 5 4H2"></path>
          <circle cx="9" cy="20" r="1.2"></circle>
          <circle cx="17" cy="20" r="1.2"></circle>
        </ng-container>
        <ng-container *ngSwitchCase="'menu'">
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'close'">
          <path d="M6 6l12 12M18 6L6 18"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'star'">
          <path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9 9.4 9z"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'chevron'">
          <path d="M14 6l-6 6 6 6"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'truck'">
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"></path>
          <circle cx="7" cy="18" r="1.4"></circle>
          <circle cx="17" cy="18" r="1.4"></circle>
        </ng-container>
        <ng-container *ngSwitchCase="'shield'">
          <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6z"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'leaf'">
          <path d="M5 19c8-1 13-8 14-14-6 1-13 6-14 14z"></path>
          <path d="M8 12c2 2 4 3 7 4"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'check'">
          <path d="M5 12.5 10 17l9-10"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'plus'">
          <path d="M12 5v14M5 12h14"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'minus'">
          <path d="M5 12h14"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'filter'">
          <path d="M4 6h16M7 12h10M10 18h4"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'eye'">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </ng-container>
        <ng-container *ngSwitchCase="'mail'">
          <rect x="3" y="5" width="18" height="14" rx="2"></rect>
          <path d="M3 7l9 7 9-7"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'phone'">
          <path d="M7 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L18 13l5 2v4c0 1-1 2-2 2C9 21 3 15 3 5c0-1 1-2 2-2z"></path>
        </ng-container>
        <ng-container *ngSwitchCase="'pin'">
          <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>
          <circle cx="12" cy="10" r="2.2"></circle>
        </ng-container>
        <ng-container *ngSwitchCase="'lock'">
          <rect x="5" y="11" width="14" height="10" rx="2"></rect>
          <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
        </ng-container>
      </ng-container>
    </svg>
  `,
})
export class IconComponent {
  @Input() name = 'search';
  @Input() size = 22;
}
