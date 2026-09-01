import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true, nullTargetWarn: false, autoSleep: 60 });
gsap.ticker.lagSmoothing(500, 33);
ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
});

let refreshTimer = 0;

export function scheduleScrollRefresh(): void {
  if (typeof window === 'undefined') return;
  if (refreshTimer) return;
  refreshTimer = window.setTimeout(() => {
    refreshTimer = 0;
    ScrollTrigger.refresh();
  }, 160);
}
