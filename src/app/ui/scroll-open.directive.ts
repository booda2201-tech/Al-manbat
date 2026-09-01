import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { scheduleScrollRefresh } from './gsap-setup';

export type ScrollOpenMode = 'card' | 'panel';

@Directive({
  selector: '[appScrollOpen]',
  standalone: true,
  host: {
    class: 'scroll-open',
    '[class.scroll-open--panel]': 'panel',
  },
})
export class ScrollOpenDirective implements AfterViewInit, OnDestroy {
  /** `card` = image unmask. `panel` = full block opens from a thin horizontal slit. */
  @Input() appScrollOpen: ScrollOpenMode | '' = 'card';

  private mm?: ReturnType<typeof gsap.matchMedia>;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  get panel(): boolean {
    return this.appScrollOpen === 'panel';
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.bind());
  }

  private bind(): void {
    const el = this.host.nativeElement;
    const media =
      (el.querySelector('.scroll-open__media') as HTMLElement | null) ??
      (el.querySelector('img') as HTMLElement | null);

    const mode: ScrollOpenMode = this.appScrollOpen === 'panel' ? 'panel' : 'card';
    const radius =
      getComputedStyle(el).borderTopLeftRadius || (mode === 'panel' ? '24px' : '12px');

    this.mm = gsap.matchMedia();
    this.mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(el, { clipPath: 'none', clearProps: 'clipPath' });
      if (media) gsap.set(media, { scale: 1, clearProps: 'transform' });
    });
    this.mm.add('(prefers-reduced-motion: no-preference)', () => {
      const compact = window.matchMedia('(max-width: 1023px)').matches;
      const fromClip =
        mode === 'panel'
          ? `inset(${compact ? 40 : 46}% 0% ${compact ? 40 : 46}% 0% round ${radius})`
          : `inset(${compact ? 12 : 18}% ${compact ? 7 : 10}% ${compact ? 12 : 18}% ${compact ? 7 : 10}% round ${radius})`;
      const toClip = `inset(0% 0% 0% 0% round ${radius})`;

      gsap.set(el, { clipPath: fromClip, force3D: true });
      if (media) gsap.set(media, { scale: compact ? 1.14 : 1.22, transformOrigin: '50% 50%', force3D: true });

      const tl = gsap.timeline({
        defaults: { ease: 'none', force3D: true },
        scrollTrigger: {
          trigger: el,
          start: mode === 'panel' ? 'top 92%' : 'top 96%',
          end: mode === 'panel' ? (compact ? 'top 36%' : 'top 26%') : compact ? 'top 52%' : 'top 46%',
          scrub: mode === 'panel' ? (compact ? 0.45 : 1.05) : compact ? 0.35 : 0.8,
          fastScrollEnd: compact,
          invalidateOnRefresh: true,
        },
      });

      tl.to(el, { clipPath: toClip, duration: 1 }, 0);
      if (media) tl.to(media, { scale: 1, duration: 1 }, 0);

      el.querySelectorAll('img').forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', () => scheduleScrollRefresh(), { once: true });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
