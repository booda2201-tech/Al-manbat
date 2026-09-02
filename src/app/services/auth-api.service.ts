import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, retry, switchMap, tap, throwError } from 'rxjs';
import { apiErrorMessage, apiUrl, extractBearer, extractToken, extractUserName, normalizeAuthPhone, pickDisplayName } from '../api/api.util';
import { mapProfile } from './account-api.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient, private session: SessionService) {}

  login(phone: string, password: string): Observable<void> {
    const mobile = normalizeAuthPhone(phone) || phone.trim();
    return this.authenticate(mobile, password).pipe(
      switchMap(() => this.hydrateProfile(mobile)),
      catchError((err) => {
        if (err?.message === 'NO_TOKEN') return throwError(() => new Error('NO_TOKEN'));
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
    return this.http.post(apiUrl('/api/Auth/login'), { phone, password }, { observe: 'response' }).pipe(
      map((res) => this.commitSession(res, phone))
    );
  }

  private commitSession(res: HttpResponse<unknown>, phone: string, userName?: string): void {
    if (!this.tryCommit(res, phone, userName)) {
      throw new Error('NO_TOKEN');
    }
  }

  private tryCommit(res: HttpResponse<unknown>, phone: string, userName?: string): boolean {
    const token =
      extractToken(res.body) ||
      extractBearer(res.headers.get('Authorization')) ||
      extractBearer(res.headers.get('X-Token')) ||
      extractBearer(res.headers.get('token'));
    if (!token) return false;
    const payload =
      res.body && typeof res.body === 'object' && !Array.isArray(res.body)
        ? { ...(res.body as Record<string, unknown>), token }
        : { token };
    this.session.applyLogin(payload, phone);
    if (userName) this.session.setProfile({ userName, phone });
    return this.session.isLoggedIn();
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
    if (fallbackName) this.session.setProfile({ userName: fallbackName, phone });
    return this.http.get(apiUrl('/api/Profile')).pipe(
      tap((body) => {
        const mapped = mapProfile(body);
        const name = pickDisplayName(
          mapped ? `${mapped.firstName} ${mapped.lastName}` : '',
          mapped?.userName,
          extractUserName(body),
          fallbackName
        );
        if (name) {
          this.session.setProfile({
            userName: name,
            phone: mapped?.phone || phone,
            email: mapped?.email,
          });
        }
      }),
      catchError(() => of(null)),
      map(() => undefined)
    );
  }
}
