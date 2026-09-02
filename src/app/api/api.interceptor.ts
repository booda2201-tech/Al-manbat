import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isApiRequest, cleanAuthToken } from './api.util';
import { LocaleService } from '../services/locale.service';
import { SessionService } from '../services/session.service';

const PUBLIC_AUTH = /\/api\/Auth\/(login|register|register-admin)(\?|$)/i;
const ROLE_GATED = /\/api\/(Profile\b|Cart\b|Wishlist\b|Orders\b|Auth\/logout\b)/i;

let signingOut = false;

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) return next(req);

  const locale = inject(LocaleService);
  const session = inject(SessionService);
  const router = inject(Router);
  const lang = locale.locale();
  const skipAuth = PUBLIC_AUTH.test(req.url);

  if (!skipAuth) session.dropIfExpired();

  let headers = req.headers.set('Accept-Language', lang);
  const token = skipAuth ? null : session.token();
  const rawToken = token ? cleanAuthToken(token) : '';
  const auth = rawToken ? `Bearer ${rawToken}` : '';
  if (auth) {
    headers = headers
      .set('Authorization', auth)
      .set('X-Authorization', auth)
      .set('X-Token', rawToken);
  } else if (headers.has('Authorization')) {
    headers = headers.delete('Authorization');
  }
  if (req.body instanceof FormData) {
    headers = headers.delete('Content-Type');
  } else if (req.body && typeof req.body === 'object' && !headers.has('Content-Type')) {
    headers = headers.set('Content-Type', 'application/json');
  }

  let params = req.params;
  if (!params.has('lang')) params = params.set('lang', lang);

  return next(req.clone({ headers, params, withCredentials: true })).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        token &&
        !skipAuth &&
        err.status === 401 &&
        !ROLE_GATED.test(req.url)
      ) {
        sendToLogin(session, router);
      }
      return throwError(() => err);
    })
  );
};

function sendToLogin(session: SessionService, router: Router): void {
  if (signingOut) return;
  signingOut = true;
  session.clear();
  const path = router.url.split('?')[0];
  const onAuth = path === '/login' || path === '/signup';
  const go = onAuth
    ? Promise.resolve(true)
    : router.navigate(['/login'], { queryParams: { redirect: router.url } });
  void Promise.resolve(go).finally(() => {
    signingOut = false;
  });
}
