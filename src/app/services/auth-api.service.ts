import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, retry, switchMap, tap, throwError } from 'rxjs';
import {
  apiErrorMessage,
  apiUrl,
  extractAuthMessage,
  extractBearer,
  extractNameFromToken,
  extractToken,
  extractUserName,
  normalizeAuthPhone,
  parseAuthBody,
  pickDisplayName,
} from '../api/api.util';
import { AccountApiService, mapProfile } from './account-api.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(
    private http: HttpClient,
    private session: SessionService,
    private account: AccountApiService
  ) {}

  login(phone: string, password: string): Observable<void> {
    const mobile = normalizeAuthPhone(phone) || phone.trim();
    return this.authenticate(mobile, password).pipe(
      switchMap(() => this.hydrateProfile(this.session.phone() || mobile)),
      catchError((err) => {
        if (err?.message === 'NO_TOKEN') return throwError(() => new Error('NO_TOKEN'));
        if (err instanceof Error && err.message && err.message !== 'LOGIN') {
          return throwError(() => err);
        }
        return throwError(() => new Error(apiErrorMessage(err, 'LOGIN')));
      })
    );
  }

  register(data: { userName: string; displayName?: string; phone: string; password: string }): Observable<void> {
    const shownName = pickDisplayName(data.displayName, data.userName) || data.displayName || data.userName;
    const phone = normalizeAuthPhone(data.phone) || data.phone.trim();
    const body = {
      userName: data.userName,
      phone,
      password: data.password,
      reEnterPassword: data.password,
    };
    return this.http.post(apiUrl('/api/Auth/register'), body, { observe: 'response' }).pipe(
      switchMap((res) => {
        const signedIn = this.tryCommit(res, phone, shownName);
        const afterAuth = signedIn
          ? of(undefined)
          : this.authenticate(phone, data.password).pipe(
              tap(() => this.session.setProfile({ userName: shownName, phone }))
            );
        return afterAuth.pipe(switchMap(() => this.saveFullName(shownName, phone)));
      }),
      catchError((err) => {
        if (err instanceof Error && err.message && err.message !== 'REGISTER') {
          return throwError(() => err);
        }
        return throwError(() => new Error(apiErrorMessage(err, 'REGISTER')));
      })
    );
  }

  refreshProfile(): Observable<void> {
    if (!this.session.isLoggedIn()) return of(undefined);
    return this.hydrateProfile(this.session.phone() || '');
  }

  logout(): Observable<void> {
    return this.http.post(apiUrl('/api/Auth/logout'), {}).pipe(
      catchError(() => of(null)),
      tap(() => this.session.clear()),
      map(() => undefined)
    );
  }

  private authenticate(phone: string, password: string): Observable<void> {
    const mobile = normalizeAuthPhone(phone) || phone.trim();
    return this.http
      .post(apiUrl('/api/Auth/login'), { phone: mobile, password }, {
        observe: 'response',
        responseType: 'text',
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          if (this.tryCommit(res, mobile)) return;
          throw new Error(extractAuthMessage(parseAuthBody(res.body)) || 'NO_TOKEN');
        })
      );
  }

  private tryCommit(res: HttpResponse<unknown>, phone: string, userName?: string): boolean {
    const body = parseAuthBody(res.body);
    const token =
      extractToken(body) ||
      extractBearer(res.headers.get('Authorization')) ||
      extractBearer(res.headers.get('X-Token')) ||
      extractBearer(res.headers.get('X-Access-Token')) ||
      extractBearer(res.headers.get('token'));
    if (!token) return false;
    const payload =
      body && typeof body === 'object' && !Array.isArray(body)
        ? { ...(body as Record<string, unknown>), token }
        : { token };
    const ok = this.session.applyLogin(payload, phone);
    const shown = pickDisplayName(userName, extractNameFromToken(token), extractUserName(payload));
    if (ok && shown) this.session.setProfile({ userName: shown, phone });
    return ok;
  }

  private saveFullName(fullName: string, phone: string): Observable<void> {
    const name = pickDisplayName(fullName);
    if (!name) return this.hydrateProfile(phone);
    this.session.setProfile({ userName: name, phone });
    return this.http.put(apiUrl('/api/Profile'), { fullName: name, phone }).pipe(
      retry(1),
      catchError(() => of(null)),
      switchMap(() => this.hydrateProfile(phone, name))
    );
  }

  private hydrateProfile(phone: string, fallbackName?: string): Observable<void> {
    if (this.session.isAdmin()) return of(undefined);
    const kept = pickDisplayName(
      fallbackName,
      this.session.userName(),
      extractNameFromToken(this.session.token())
    );
    if (kept) this.session.setProfile({ userName: kept, phone });
    return this.http.get(apiUrl('/api/Profile'), { responseType: 'text' }).pipe(
      map((raw) => {
        const body = parseAuthBody(raw);
        const mapped = mapProfile(body);
        const name = pickDisplayName(
          mapped ? `${mapped.firstName} ${mapped.lastName}` : '',
          mapped?.userName,
          extractUserName(body),
          kept
        );
        this.session.setProfile({
          userName: name || kept || undefined,
          phone: mapped?.phone || phone,
          email: mapped?.email,
        });
        return name || kept || '';
      }),
      switchMap((name) => (name ? of(undefined) : this.recoverLegacyName(phone))),
      catchError(() => this.recoverLegacyName(phone)),
      map(() => undefined)
    );
  }

  private recoverLegacyName(phone: string): Observable<void> {
    return this.account.getMyOrders().pipe(
      catchError(() => of([])),
      map((orders) => {
        for (const order of orders) {
          const name = pickDisplayName(order.customerName);
          if (name) return name;
        }
        return '';
      }),
      switchMap((name) => (name ? this.saveFullName(name, phone) : of(undefined))),
      catchError(() => of(undefined))
    );
  }
}
