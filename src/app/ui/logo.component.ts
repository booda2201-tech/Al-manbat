import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../services/locale.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <a routerLink="/" class="inline-flex max-w-full flex-col items-center gap-1 text-center" [attr.aria-label]="ariaLabel">
      <img
        src="assets/brand/logo.png"
        alt=""
        [style.height.px]="mark"
        class="w-auto rounded-md object-contain"
      />
      <span *ngIf="caption" [ngClass]="captionClass">{{ legalName }}</span>
    </a>
  `,
})
export class LogoComponent {
  @Input() tone: 'light' | 'dark' = 'dark';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() caption = true;
  constructor(public locale: LocaleService) {}
  get mark(): number {
    return { xs: 34, sm: 40, md: 52, lg: 72 }[this.size];
  }

  get legalName(): string {
    return this.locale.isAr() ? 'حدائق المنبت للصناعات الغذائية' : 'Almanbat Gardens for Food Industries';
  }

  get captionClass(): string {
    const color = this.tone === 'light' ? 'text-sand-100/75' : 'text-olive-800/75';
    return `max-w-[13.5rem] text-[11px] font-medium leading-snug ${color}`;
  }

  get ariaLabel(): string {
    const name = this.locale.isAr() ? 'المنبت' : 'Almanbat';
    if (!this.caption) return name;
    return `${name} — ${this.legalName}`;
  }
}
