import { Injectable, signal } from '@angular/core';
import {
  extractRoleFromToken,
  extractToken,
  isAdminRole,
  isTokenExpired,
  pickDisplayName,
  pickSessionRole,
  extractUserName,
} from '../api/api.util';

const STORAGE_KEY = 'almanbat.session';
const NAMES_KEY = 'almanbat.displayNames';

interface SessionState {
  token: string | null;
  userName: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
}

interface StoredSession {
  token: string | null;
  phone: string | null;
  role: string | null;
}

function emptySession(): SessionState {
  return { token: null, userName: null, phone: null, email: null, role: null };
}

function readSession(): SessionState {
  try {
    localStorage.removeItem(NAMES_KEY);
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as StoredSession & { userName?: string; email?: string };
    const token = parsed.token ?? null;
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem(STORAGE_KEY);
      return emptySession();
    }
    return {
      token,
      userName: null,
      phone: parsed.phone ?? null,
      email: null,
      role: extractRoleFromToken(token) || parsed.role || null,
    };
  } catch {
    return emptySession();
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly state = signal<SessionState>(readSession());

  readonly token = () => this.liveToken();
  readonly userName = () => this.state().userName;
  readonly phone = () => this.state().phone;
  readonly email = () => this.state().email;
  readonly role = () => this.state().role;
  readonly isLoggedIn = () => !!this.liveToken();
  readonly isAdmin = () => {
    const token = this.liveToken();
    if (!token) return false;
    return isAdminRole(extractRoleFromToken(token)) || isAdminRole(this.state().role);
  };

  private liveToken(): string | null {
    const token = this.state().token;
    if (!token || isTokenExpired(token)) return null;
    return token;
  }

  dropIfExpired(): boolean {
    const token = this.state().token;
    if (token && !this.liveToken()) {
      this.clear();
      return true;
    }
    return false;
  }

  applyLogin(body: unknown, phone: string): boolean {
    const token = extractToken(body);
    if (!token) return false;
    this.commit({
      token,
      userName: pickDisplayName(extractUserName(body)) || null,
      phone,
      email: null,
      role: pickSessionRole(token, body),
    });
    return true;
  }

  markAdmin(): void {
    if (this.isAdmin()) return;
    this.commit({ ...this.state(), role: 'Admin' });
  }

  setProfile(patch: Partial<Pick<SessionState, 'userName' | 'phone' | 'email'>>): void {
    this.commit({
      ...this.state(),
      ...patch,
      userName: pickDisplayName(patch.userName, this.state().userName) || null,
      phone: patch.phone ?? this.state().phone,
    });
  }

  clear(): void {
    try {
      localStorage.removeItem(NAMES_KEY);
    } catch {
      /* ignore */
    }
    this.commit(emptySession());
  }

  private commit(next: SessionState): void {
    this.state.set(next);
    try {
      const stored: StoredSession = {
        token: next.token,
        phone: next.phone,
        role: next.role,
      };
      if (next.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore quota */
    }
  }
}
