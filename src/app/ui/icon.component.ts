import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'inline-flex shrink-0 leading-none [&>svg]:block',
  },
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [class.fill-current]="filled"
    >
      <ng-container [ngSwitch]="name">
        <path *ngSwitchCase="'search'" d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM21 21l-4.3-4.3" />
        <path *ngSwitchCase="'heart'" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
        <ng-container *ngSwitchCase="'cart'">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </ng-container>
        <ng-container *ngSwitchCase="'user'">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </ng-container>
        <path *ngSwitchCase="'menu'" d="M4 7h16M4 12h16M4 17h16" />
        <path *ngSwitchCase="'close'" d="M6 6l12 12M18 6 6 18" />
        <path *ngSwitchCase="'star'" d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 5.9L12 17.3 6.7 20l1-5.9L3.4 9.9 9.4 9z" />
        <path *ngSwitchCase="'sort'" d="M8 6v12M8 6l-3 3M8 6l3 3M16 18V6M16 18l-3-3M16 18l3-3" />
        <path *ngSwitchCase="'chevron-down'" d="M6 9l6 6 6-6" />
        <path *ngSwitchCase="'chevron-left'" d="M15 6l-6 6 6 6" />
        <path *ngSwitchCase="'chevron-right'" d="M9 6l6 6-6 6" />
        <path *ngSwitchCase="'arrow-left'" d="M19 12H5M11 6l-6 6 6 6" />
        <path *ngSwitchCase="'arrow-right'" d="M5 12h14M13 6l6 6-6 6" />
        <path *ngSwitchCase="'arrow-up-right'" d="M7 17 17 7M9 7h8v8" />
        <path *ngSwitchCase="'globe'" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        <path *ngSwitchCase="'pin'" d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        <path *ngSwitchCase="'truck'" d="M3 7h11v10H3zM14 10h4l3 3v4h-7M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        <path *ngSwitchCase="'shield'" d="M12 3 5 6v6c0 4 3 7 7 8.5C16 19 19 16 19 12V6z" />
        <path *ngSwitchCase="'lock'" d="M8 10V7a4 4 0 1 1 8 0v3M6 10h12v10H6z" />
        <ng-container *ngSwitchCase="'eye'">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </ng-container>
        <path *ngSwitchCase="'eye-off'" d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.1M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9" />
        <path *ngSwitchCase="'check'" d="M5 12.5 10 17l9-10" />
        <path *ngSwitchCase="'plus'" d="M12 5v14M5 12h14" />
        <path *ngSwitchCase="'minus'" d="M5 12h14" />
        <ng-container *ngSwitchCase="'scale'">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </ng-container>
        <path *ngSwitchCase="'zap'" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        <path *ngSwitchCase="'clock'" d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
        <path *ngSwitchCase="'phone'" d="M7 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L18 13l5 2v4c0 1-1 2-2 2C9 21 3 15 3 5c0-1 1-2 2-2z" />
        <path *ngSwitchCase="'mail'" d="M4 6h16v12H4zM4 7l8 7 8-7" />
        <path *ngSwitchCase="'headset'" d="M4 13a8 8 0 0 1 16 0M4 13v5a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2zM20 13v5a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z" />
        <path *ngSwitchCase="'chat'" d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
        <path *ngSwitchCase="'package'" d="M3 7.5 12 3l9 4.5V18l-9 4-9-4zM12 12v10M3 8l9 4 9-4" />
        <path *ngSwitchCase="'home'" d="M4 11 12 4l8 7v9H4zM9 20v-6h6v6" />
        <path *ngSwitchCase="'grid'" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        <path *ngSwitchCase="'sliders'" d="M4 7h16M4 17h16M8 4v6M16 14v6" />
        <path *ngSwitchCase="'list'" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
        <path *ngSwitchCase="'rotate'" d="M3 12a9 9 0 1 0 3-6.7M3 5v5h5" />
        <path *ngSwitchCase="'bell'" d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4" />
        <ng-container *ngSwitchCase="'card'">
          <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M3 10h18" />
        </ng-container>
        <ng-container *ngSwitchCase="'logout'">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </ng-container>
        <path *ngSwitchCase="'pencil'" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        <path *ngSwitchCase="'info'" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10v6M12 8h.01" />
        <path *ngSwitchCase="'alert'" d="M12 3 3 20h18L12 3zM12 10v5M12 18h.01" />
        <ng-container *ngSwitchCase="'trash'">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </ng-container>
        <path *ngSwitchCase="'bookmark'" d="M6 4h12v17l-6-3.5L6 21V4z" />
        <path *ngSwitchCase="'quote'" d="M7 11h4v8H5v-6a6 6 0 0 1 6-6M17 11h4v8h-6v-6a6 6 0 0 1 6-6" />
        <path *ngSwitchCase="'expand'" d="M9 4H4v5M15 4h5v5M9 20H4v-5M20 15v5h-5" />
        <ng-container *ngSwitchCase="'check-circle'">
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
          <path d="M8 12l2.5 2.5L16 9" />
        </ng-container>
        <ng-container *ngSwitchCase="'pause'">
          <path d="M8 5v14M16 5v14" />
        </ng-container>
        <ng-container *ngSwitchCase="'play'">
          <path d="M8 5v14l12-7z" />
        </ng-container>
        <ng-container *ngSwitchDefault>
          <circle cx="12" cy="12" r="8" />
        </ng-container>
      </ng-container>
    </svg>
  `,
})
export class IconComponent {
  @Input() name = 'search';
  @Input() size = 20;
  @Input() filled = false;
}
