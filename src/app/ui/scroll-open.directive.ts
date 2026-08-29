import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

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

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  get panel(): boolean {
    return this.appScrollOpen === 'panel';
  }

  ngAfterViewInit(): void {
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

      gsap.set(el, { clipPath: fromClip });
      if (media) gsap.set(media, { scale: compact ? 1.14 : 1.22, transformOrigin: '50% 50%' });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: mode === 'panel' ? 'top 92%' : 'top 96%',
          end: mode === 'panel' ? (compact ? 'top 36%' : 'top 26%') : compact ? 'top 52%' : 'top 46%',
          scrub: mode === 'panel' ? (compact ? 0.85 : 1.05) : compact ? 0.65 : 0.8,
          invalidateOnRefresh: true,
        },
      });

      tl.to(el, { clipPath: toClip, duration: 1 }, 0);
      if (media) tl.to(media, { scale: 1, duration: 1 }, 0);

      el.querySelectorAll('img').forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.mm?.revert();
  }
}
