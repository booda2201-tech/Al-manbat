import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export function apiUrl(path: string): string {
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  let suffix = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && (suffix === '/api' || suffix.startsWith('/api/'))) {
    suffix = suffix.slice(4) || '/';
  }
  return `${base}${suffix}`;
}

export function isApiRequest(url: string): boolean {
  if (url.includes('/api/')) return true;
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  return !!base && url.startsWith(base);
}

export function isDeniedAccess(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}

function stripBearer(value: string): string {
  return value.replace(/^Bearer\s+/i, '').trim();
}

export function cleanAuthToken(value: string): string {
  return stripBearer(value.trim().replace(/^["']+|["']+$/g, ''));
}

export function looksLikeJwt(value: string): boolean {
  const parts = cleanAuthToken(value).split('.');
  return parts.length === 3 && parts[0].length > 8 && parts[1].length > 8 && parts[2].length > 8;
}

export function extractToken(body: unknown, depth = 0): string | null {
  if (body == null || depth > 8) return null;
  if (typeof body === 'string') {
    const trimmed = cleanAuthToken(body);
    if (looksLikeJwt(trimmed)) return trimmed;
    return looksLikeToken(trimmed) ? trimmed : null;
  }
  if (typeof body !== 'object') return null;
  if (Array.isArray(body)) {
    for (const item of body) {
      const nested = extractToken(item, depth + 1);
      if (nested) return nested;
    }
    return null;
  }
  const record = body as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== 'string') continue;
    const trimmed = cleanAuthToken(value);
    if (!looksLikeToken(trimmed)) continue;
    if (isTokenKey(key) || looksLikeJwt(trimmed)) return trimmed;
  }
  for (const value of Object.values(record)) {
    const nested = extractToken(value, depth + 1);
    if (nested) return nested;
  }
  return null;
}

function isTokenKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[_-]/g, '');
  return (
    k === 'token' ||
    k === 'accesstoken' ||
    k === 'jwttoken' ||
    k === 'jwt' ||
    k === 'bearertoken' ||
    k === 'authtoken' ||
    k === 'sessiontoken' ||
    k === 'idtoken'
  );
}

function looksLikeToken(value: string): boolean {
  return value.length > 12;
}

export function extractAuthMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const text = body.replace(/\s+/g, ' ').trim();
    if (text && !looksLikeJwt(text) && !/<[a-z!/]/i.test(text)) return text.slice(0, 220);
    return null;
  }
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const failed =
    record['isSuccess'] === false ||
    record['success'] === false ||
    record['isAuthenticated'] === false ||
    record['authenticated'] === false;
  const raw = record['message'] ?? record['title'] ?? record['error'] ?? record['detail'];
  const message = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  if (failed && message) return message.slice(0, 220);
  if (message && !extractToken(body) && !looksLikeJwt(message)) return message.slice(0, 220);
  return failed ? 'تعذر تسجيل الدخول.' : null;
}

export function authPhoneVariants(raw: string): string[] {
  const trimmed = (raw || '').trim().replace(/\s+/g, '');
  const canonical = normalizeAuthPhone(raw);
  const digits = canonical.replace(/\D/g, '');
  const out: string[] = [];
  const add = (value: string) => {
    if (value && !out.includes(value)) out.push(value);
  };
  add(canonical);
  add(trimmed);
  add(digits);
  if (/^01\d{9}$/.test(digits)) {
    add(`20${digits.slice(1)}`);
    add(`+20${digits.slice(1)}`);
  }
  if (/^05\d{8}$/.test(digits)) {
    add(`966${digits.slice(1)}`);
    add(`+966${digits.slice(1)}`);
  }
  return out;
}

export function parseAuthBody(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) return null;
  if (text.startsWith('{') || text.startsWith('[') || (text.startsWith('"') && text.endsWith('"'))) {
    try {
      return JSON.parse(text);
    } catch {
      /* raw JWT or plain text */
    }
  }
  if (looksLikeJwt(text)) return cleanAuthToken(text);
  return text;
}

export function extractBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  const bearer = cleanAuthToken(trimmed);
  return looksLikeToken(bearer) ? bearer : null;
}

export function isGeneratedUserName(name: string | null | undefined): boolean {
  const n = (name || '').trim();
  if (!n) return true;
  if (/^user\d+$/i.test(n)) return true;
  if (/^\+?\d{8,}$/.test(n)) return true;
  if (!/\s/.test(n) && /[A-Za-z].*\d{3,}$/.test(n)) return true;
  return false;
}

export function pickDisplayName(...names: Array<string | null | undefined>): string {
  for (const name of names) {
    const n = (name || '').trim().replace(/\s+/g, ' ');
    if (n && !isGeneratedUserName(n)) return n;
  }
  return '';
}

export function extractUserName(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const preferred = ['fullName', 'FullName', 'displayName', 'name', 'userName', 'username', 'UserName'];
  for (const key of preferred) {
    const value = record[key];
    if (typeof value === 'string' && pickDisplayName(value)) return pickDisplayName(value);
  }
  for (const key of ['user', 'data', 'result', 'value']) {
    const nested = extractUserName(record[key]);
    if (nested) return nested;
  }
  return null;
}

function isRoleKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[_-]/g, '');
  return k === 'role' || k === 'roles' || k === 'userrole' || k.includes('role') || k.includes('usertype') || k.includes('accounttype');
}

function isAdminFlagKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[_-]/g, '');
  return k === 'isadmin' || k === 'admin' || k.endsWith('isadmin') || k === 'isadministrator';
}

function truthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'True' || value === 'TRUE';
}

function normalizeRole(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    const text = value.trim();
    if (looksLikeJwt(text)) return null;
    if (text.startsWith('[')) {
      try {
        return normalizeRole(JSON.parse(text));
      } catch {
        /* keep raw */
      }
    }
    return text;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
      .filter(Boolean);
    const admin = parts.find((p) => isAdminRole(p));
    return admin || parts[0] || null;
  }
  return null;
}

export function extractRole(body: unknown, depth = 0): string | null {
  if (body == null || depth > 6) return null;
  if (typeof body === 'string') {
    const text = body.trim();
    if (!text || looksLikeJwt(text) || text.length > 48) return null;
    return text;
  }
  if (typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  let fallback: string | null = null;
  for (const [key, value] of Object.entries(record)) {
    if (isAdminFlagKey(key) && truthyFlag(value)) return 'Admin';
    if (!isRoleKey(key)) continue;
    const found = normalizeRole(value);
    if (!found) continue;
    if (isAdminRole(found)) return found;
    if (!fallback) fallback = found;
  }
  for (const key of ['user', 'data', 'result', 'value', 'payload']) {
    const nested = extractRole(record[key], depth + 1);
    if (nested && isAdminRole(nested)) return nested;
    if (nested && !fallback) fallback = nested;
  }
  return fallback;
}

export function extractRoleFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return extractRole(decodeJwtPayload(token));
}

export function pickSessionRole(token: string | null | undefined, body?: unknown): string | null {
  const fromToken = extractRoleFromToken(token);
  const fromBody = extractRole(body);
  if (isAdminRole(fromToken)) return fromToken;
  if (isAdminRole(fromBody)) return fromBody;
  return fromToken || fromBody;
}

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role || looksLikeJwt(role)) return false;
  return /\b(admin|administrator|superadmin|owner|مدير|مشرف)\b/i.test(role);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = cleanAuthToken(token).split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const binary = atob(padded);
    let json = binary;
    try {
      json = decodeURIComponent(Array.from(binary, (ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    } catch {
      /* payload is already ASCII JSON */
    }
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  return !token;
}

export function unwrapPayload(body: unknown): unknown {
  const parsed = typeof body === 'string' ? parseAuthBody(body) : body;
  if (!parsed || typeof parsed !== 'object') return parsed;
  const record = parsed as Record<string, unknown>;
  for (const key of ['data', 'result', 'value', 'payload', 'content']) {
    if (record[key] != null && typeof record[key] === 'object') return record[key];
  }
  return parsed;
}

export function extractEntityId(body: unknown, depth = 0): string {
  if (depth > 5) return '';
  if (typeof body === 'number' && Number.isFinite(body)) return String(body);
  if (typeof body === 'string') {
    const trimmed = body.trim().replace(/^"|"$/g, '');
    if (trimmed && trimmed.length < 80) return trimmed;
  }
  if (!body || typeof body !== 'object') return '';
  const record = unwrapPayload(body) as Record<string, unknown>;
  if (!record || typeof record !== 'object') return '';
  for (const key of ['id', 'addressId', 'orderId', 'orderNumber', 'number', 'code']) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  for (const key of ['order', 'data', 'result', 'value']) {
    const nested = extractEntityId(record[key], depth + 1);
    if (nested) return nested;
  }
  return '';
}

export function unwrapList(body: unknown): unknown[] {
  const seen = new Set<unknown>();
  const walk = (node: unknown, depth: number): unknown[] => {
    if (node == null || depth > 6 || seen.has(node)) return [];
    if (Array.isArray(node)) return node;
    if (typeof node !== 'object') return [];
    seen.add(node);
    const record = node as Record<string, unknown>;
    for (const key of [
      '$values',
      'items',
      'orders',
      'addresses',
      'Addresses',
      'products',
      'results',
      'data',
      'reviews',
      'value',
      'list',
      'content',
    ]) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
    for (const value of Object.values(record)) {
      if (!Array.isArray(value)) continue;
      if (value.some((item) => item && typeof item === 'object')) return value;
    }
    for (const value of Object.values(record)) {
      const found = walk(value, depth + 1);
      if (found.length) return found;
    }
    return [];
  };
  return walk(typeof body === 'string' ? parseAuthBody(body) : body, 0);
}

export function normalizeAuthPhone(raw: string): string {
  let value = (raw || '').trim()
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[^\d+]/g, '');
  if (value.startsWith('00')) value = value.slice(2);
  if (value.startsWith('+')) value = value.slice(1);
  if (/^20(10|11|12|15)\d{8}$/.test(value)) return `0${value.slice(2)}`;
  if (/^9665\d{8}$/.test(value)) return `0${value.slice(3)}`;
  return value;
}

function readableApiText(value: string): string | null {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (/<[a-z!/]/i.test(text) || /عطل في الخادم/i.test(text) || /server error/i.test(text)) return null;
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body = error.error;
  if (error.status === 0) {
    return 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
  }
  if (typeof body === 'string') {
    const text = readableApiText(body);
    if (text) return text;
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['message'] === 'string') {
      const text = readableApiText(record['message']);
      if (text) return text;
    }
    const errors = record['errors'];
    if (errors && typeof errors === 'object') {
      const messages: string[] = [];
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && item.trim()) messages.push(item.trim());
          }
        } else if (typeof value === 'string' && value.trim()) {
          messages.push(value.trim());
        }
      }
      if (messages.length) return messages.join(' · ');
    }
    if (typeof record['title'] === 'string') {
      const text = readableApiText(record['title']);
      if (text) return text;
    }
  }
  if (error.status === 401 || error.status === 403) {
    return fallback === 'LOGIN'
      ? 'رقم الجوال أو كلمة المرور غير صحيحة.'
      : 'الحساب الحالي غير مصرح له بهذا الطلب.';
  }
  if (error.status === 415) {
    return 'السيرفر رفض نوع البيانات المرسلة.';
  }
  if (error.status >= 500) {
    return fallback === 'LOGIN'
      ? 'الخادم رفض تسجيل الدخول. اكتب رقم الجوال كما هو محفوظ في الحساب، بدون + أو مسافات.'
      : 'حدث عطل في الخادم. حاول مرة أخرى بعد قليل.';
  }
  return fallback;
}
