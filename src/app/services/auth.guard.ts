import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  session.dropIfExpired();
  if (session.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

export const accountGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  session.dropIfExpired();
  if (!session.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }
  if (session.isAdmin()) return router.createUrlTree(['/admin']);
  return true;
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  session.dropIfExpired();
  if (!session.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }
  if (!session.isAdmin()) return router.createUrlTree(['/account']);
  return true;
};

/** Old /admin/:tab bookmarks → /admin?tab= */
export const adminLegacyTabGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const tab = route.paramMap.get('tab') || 'overview';
  return router.createUrlTree(['/admin'], {
    queryParams: tab !== 'overview' ? { tab } : {},
  });
};
