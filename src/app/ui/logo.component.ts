import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../services/locale.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <a routerLink="/" class="inline-flex items-center" [attr.aria-label]="locale.tr({ ar: 'المنبت', en: 'Almanbat' })">
      <img
        src="assets/brand/logo.png"
        alt=""
        [style.height.px]="mark"
        class="w-auto rounded-md object-contain"
      />
    </a>
  `,
})
export class LogoComponent {
  @Input() tone: 'light' | 'dark' = 'dark';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  constructor(public locale: LocaleService) {}
  get mark(): number {
    return { xs: 34, sm: 40, md: 52, lg: 72 }[this.size];
  }
}
