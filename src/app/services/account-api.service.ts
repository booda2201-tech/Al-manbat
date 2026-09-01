import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { apiErrorMessage, apiUrl, extractEntityId, isGeneratedUserName, pickDisplayName, unwrapList, unwrapPayload } from '../api/api.util';
import type { Address, ApiOrderStatus, Order, OrderSnap } from '../types';

export interface AddressRequest {
  label?: string;
  street?: string;
  city?: string;
  governorate?: string;
  postalCode?: string;
  notes?: string;
}

export interface AccountProfile {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt?: string;
  addresses: Address[];
}

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<AccountProfile | null> {
    return this.http.get(apiUrl('/api/Profile')).pipe(
      map((body) => mapProfile(body)),
      catchError(() => of(null))
    );
  }

  updateProfile(profile: AccountProfile): Observable<AccountProfile> {
    const dto = {
      fullName: pickDisplayName(`${profile.firstName} ${profile.lastName}`.trim(), profile.userName) || profile.userName,
      phone: profile.phone,
    };
    return this.http.put(apiUrl('/api/Profile'), dto).pipe(
      map((body) => {
        const mapped = mapProfile(body);
        if (!mapped) return profile;
        const display = pickDisplayName(
          `${mapped.firstName} ${mapped.lastName}`.trim(),
          mapped.userName,
          dto.fullName,
          profile.userName
        );
        const parts = display.split(/\s+/).filter(Boolean);
        return {
          ...mapped,
          userName: display,
          firstName: mapped.firstName || parts[0] || profile.firstName,
          lastName: mapped.lastName || parts.slice(1).join(' ') || profile.lastName,
        };
      }),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'PROFILE'))))
    );
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get(apiUrl('/api/Profile/addresses/GetAddresses')).pipe(
      map((body) => {
        const rows = unwrapList(body);
        const mapped = (rows.length ? rows : [unwrapPayload(body)]).map((row, i) => mapAddress(row, i));
        return mapped.filter((a): a is Address => !!a);
      }),
      catchError(() => of([]))
    );
  }

  addAddress(dto: AddressRequest): Observable<Address> {
    return this.http.post(apiUrl('/api/Profile/addresses/AddAddress'), dto).pipe(
      map((body) => mapAddress(body, 0) ?? fallbackAddress(body, dto)),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'ADDRESS'))))
    );
  }

  updateAddress(id: string, dto: AddressRequest): Observable<Address> {
    return this.http.put(apiUrl(`/api/Profile/addresses/UpdateAddress/${id}`), dto).pipe(
      map((body) => mapAddress(body, 0) ?? fallbackAddress(body, dto, id)),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'ADDRESS'))))
    );
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete(apiUrl(`/api/Profile/addresses/DeleteAddress/${id}`)).pipe(
      map(() => undefined),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'ADDRESS'))))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const dto = {
      currentPassword,
      oldPassword: currentPassword,
      newPassword,
      password: newPassword,
      confirmPassword: newPassword,
      reEnterPassword: newPassword,
    };
    return this.http.post(apiUrl('/api/Auth/ChangePassword'), dto).pipe(
      catchError(() => this.http.post(apiUrl('/api/Profile/ChangePassword'), dto)),
      map(() => undefined),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'PASSWORD'))))
    );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get(apiUrl('/api/Orders/GetMyOrders')).pipe(
      map((body) => unwrapList(body).map(mapOrder).filter((o): o is Order => !!o)),
      switchMap((orders) => hydrateLiveOrders(this.http, orders)),
      catchError(() => of([]))
    );
  }

  getOrder(id: string): Observable<Order | null> {
    return this.http.get(apiUrl(`/api/Orders/GetOrder/${id}`)).pipe(
      map((body) => mapOrder(body)),
      catchError(() => of(null))
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function lookup(record: Record<string, unknown> | null, key: string): unknown {
  if (!record) return undefined;
  if (key in record) return record[key];
  const want = key.toLowerCase();
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

function pickString(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) return '';
  for (const key of keys) {
    const value = lookup(record, key);
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function pickNumber(record: Record<string, unknown> | null, keys: string[]): number {
  if (!record) return 0;
  for (const key of keys) {
    const value = lookup(record, key);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function bilingual(value: string): { ar: string; en: string } {
  return { ar: value, en: value };
}

export function mapProfile(body: unknown): AccountProfile | null {
  const record = asRecord(unwrapPayload(body));
  if (!record) return null;
  const user = asRecord(record['user']) ?? record;
  const explicit =
    pickString(user, ['fullName', 'displayName', 'name']) ||
    pickString(record, ['fullName', 'displayName']);
  const firstRaw = pickString(user, ['firstName', 'givenName']);
  const lastRaw = pickString(user, ['lastName', 'familyName']);
  const loginName = pickString(user, ['userName', 'username', 'UserName']);
  const display = pickDisplayName(explicit, `${firstRaw} ${lastRaw}`.trim(), loginName);
  const parts = display.split(/\s+/).filter(Boolean);
  const first = (firstRaw && !isGeneratedUserName(firstRaw) ? firstRaw : parts[0]) || '';
  const last =
    (lastRaw && !isGeneratedUserName(lastRaw) ? lastRaw : parts.slice(1).join(' ')) || '';
  const nested = unwrapList(user['addresses'] ?? record['addresses']);
  return {
    userName: display,
    firstName: first,
    lastName: last,
    email: pickString(user, ['email', 'mail', 'emailAddress']),
    phone: pickString(user, ['phone', 'phoneNumber', 'mobile', 'mobileNumber']),
    createdAt: pickString(user, ['createdAt', 'memberSince', 'joinedAt', 'registerDate']) || undefined,
    addresses: nested.map(mapAddress).filter((a): a is Address => !!a),
  };
}

export function mapAddress(raw: unknown, index: number): Address | null {
  const record = asRecord(unwrapPayload(raw));
  if (!record) return null;
  const label = pickString(record, ['label', 'title', 'name', 'type']) || 'Home';
  const line = pickString(record, ['line', 'street', 'Street', 'address', 'addressLine', 'addressLine1', 'details']);
  const city = pickString(record, ['city', 'City', 'cityName', 'area']);
  const phone =
    pickString(record, ['phone', 'phoneNumber', 'mobile']) || pickString(record, ['notes', 'Notes']);
  if (!line && !city) return null;
  const id = pickString(record, ['id', 'addressId']) || extractEntityId(raw) || `addr-${index}`;
  const isDefault = record['isDefault'] === true || record['isDefaultAddress'] === true || index === 0;
  return {
    id,
    label: bilingual(label),
    line: bilingual(line),
    city: bilingual(city),
    phone,
    isDefault,
  };
}

function fallbackAddress(body: unknown, dto: AddressRequest, id?: string): Address {
  const resolved = extractEntityId(body) || id || '';
  return {
    id: resolved,
    label: bilingual(dto.label || 'Home'),
    line: bilingual(dto.street || ''),
    city: bilingual(dto.city || ''),
    phone: '',
    isDefault: false,
  };
}

function mapStatus(raw: unknown): Order['status'] {
  const api = parseApiStatus(raw);
  if (api === 'Delivered') return 'delivered';
  if (api === 'Shipped') return 'in_transit';
  if (api === 'Cancelled') return 'cancelled';
  return 'processing';
}

const API_STATUSES: ApiOrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_RANK: Record<ApiOrderStatus, number> = {
  Pending: 0,
  Confirmed: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: 4,
};

export function parseApiStatus(raw: unknown): ApiOrderStatus | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const i = Math.trunc(raw);
    if (i >= 0 && i < API_STATUSES.length) return API_STATUSES[i];
    return undefined;
  }
  const s = String(raw ?? '').trim();
  if (!s) return undefined;
  const named = API_STATUSES.find((n) => n.toLowerCase() === s.toLowerCase());
  if (named) return named;
  if (/^\d+$/.test(s)) {
    const i = Number(s);
    if (i >= 0 && i < API_STATUSES.length) return API_STATUSES[i];
  }
  const lower = s.toLowerCase();
  if (/confirm|مؤكد|تأكيد/.test(lower)) return 'Confirmed';
  if (/ship|transit|way|طريق|شحن/.test(lower)) return 'Shipped';
  if (/deliver|تسليم|مستلم/.test(lower)) return 'Delivered';
  if (/cancel|ملغي|الغاء|إلغاء/.test(lower)) return 'Cancelled';
  if (/pending|انتظار|جديد/.test(lower)) return 'Pending';
  if (/process|تجهيز/.test(lower)) return 'Pending';
  return undefined;
}

export function resolveApiStatus(order: Pick<Order, 'apiStatus' | 'status'> | null | undefined): ApiOrderStatus {
  if (!order) return 'Pending';
  if (order.apiStatus) return order.apiStatus;
  const fromCoarse =
    order.status === 'delivered'
      ? 'Delivered'
      : order.status === 'in_transit'
        ? 'Shipped'
        : order.status === 'cancelled'
          ? 'Cancelled'
          : parseApiStatus(order.status);
  return fromCoarse || 'Pending';
}

export function orderTrackStep(order: Pick<Order, 'apiStatus' | 'status'> | null | undefined): number {
  const api = resolveApiStatus(order);
  if (api === 'Delivered') return 3;
  if (api === 'Shipped') return 2;
  if (api === 'Confirmed') return 1;
  return 0;
}

export function mapOrder(raw: unknown): Order | null {
  const record = unwrapOrderRecord(raw);
  if (!record) return null;
  const id = pickString(record, ['id', 'orderId', 'orderNumber', 'number', 'code', 'orderNo', 'reference']);
  if (!id) return null;
  const rawStatus = pickOrderStatus(record) || 'Pending';
  const status = mapStatus(rawStatus);
  const date = pickString(record, ['date', 'createdAt', 'orderDate', 'placedAt']) || new Date().toISOString();
  const etaText = pickString(record, ['eta', 'estimatedDelivery', 'deliveryDate', 'deliveryEstimate']);
  const rows = unwrapList(
    lookup(record, 'items') ??
      lookup(record, 'orderItems') ??
      lookup(record, 'products') ??
      lookup(record, 'lines')
  );
  const snapshots: Record<string, OrderSnap> = {};
  const itemIds: string[] = [];
  rows.forEach((row, i) => {
    const item = asRecord(row);
    const product = asRecord(lookup(item, 'product'));
    const pid =
      pickString(item, ['productId', 'id']) ||
      pickString(product, ['id', 'productId']) ||
      `${id}-${i}`;
    itemIds.push(pid);
    const name =
      pickString(item, ['name', 'nameAr', 'productName', 'title']) ||
      pickString(product, ['name', 'nameAr', 'nameEn']);
    const image = firstImageUrl(item, product);
    const qty = pickNumber(item, ['quantity', 'qty', 'count']) || 1;
    const unit =
      pickNumber(item, ['finalUnitPrice', 'unitPrice', 'price', 'finalPrice']) ||
      pickNumber(product, ['price', 'finalPrice']);
    const lineTotal = pickNumber(item, ['lineTotal', 'total', 'totalPrice']);
    snapshots[pid] = {
      name: name || pid,
      image,
      price: unit || (lineTotal && qty ? lineTotal / qty : lineTotal) || undefined,
      qty,
    };
  });
  const listedTotal = pickNumber(record, [
    'total',
    'grandTotal',
    'totalPrice',
    'amount',
    'finalTotal',
    'totalAmount',
    'orderTotal',
    'subTotal',
    'subtotal',
  ]);
  const summed = itemIds.reduce((sum, pid) => {
    const snap = snapshots[pid];
    return sum + (snap?.price || 0) * (snap?.qty || 1);
  }, 0);
  const rawNotes = pickString(record, ['notes', 'note', 'comment', 'orderNotes']);
  const parsedNotes = parseCheckoutSnapshot(rawNotes);
  const contact = mergeContact(
    pickOrderContact(record),
    contactFromTree(raw),
    parsedNotes.contact
  );
  return {
    id,
    date: date.slice(0, 10),
    status,
    apiStatus: parseApiStatus(rawStatus),
    total: listedTotal || summed,
    itemIds,
    snapshots,
    eta: etaText ? bilingual(etaText) : undefined,
    paymentMethod: pickString(record, ['paymentMethod', 'payment', 'payMethod']),
    customerName: contact.name,
    customerPhone: contact.phone,
    customerAddress: contact.address,
    orderNotes: parsedNotes.extra,
  };
}

function scalarStatus(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  const rec = asRecord(value);
  if (!rec) return '';
  return pickString(rec, ['name', 'value', 'status', 'orderStatus']);
}

function pickOrderStatus(record: Record<string, unknown>): string {
  const keys = ['orderStatus', 'currentStatus', 'fulfillmentStatus', 'status', 'state'];
  const candidates: string[] = [];
  for (const key of keys) {
    const raw = scalarStatus(lookup(record, key));
    if (raw && !candidates.includes(raw)) candidates.push(raw);
  }
  let bestRaw = candidates[0] || '';
  let bestRank = -1;
  for (const candidate of candidates) {
    const api = parseApiStatus(candidate);
    if (!api) continue;
    const rank = STATUS_RANK[api];
    const named = API_STATUSES.some((n) => n.toLowerCase() === candidate.toLowerCase());
    if (rank > bestRank || (rank === bestRank && named)) {
      bestRank = rank;
      bestRaw = candidate;
    }
  }
  return bestRaw;
}

function hydrateLiveOrders(http: HttpClient, orders: Order[]): Observable<Order[]> {
  const live = orders.filter((order) => {
    const api = resolveApiStatus(order);
    return api === 'Pending' || api === 'Confirmed' || api === 'Shipped';
  });
  if (!live.length) return of(orders);
  return forkJoin(
    live.map((order) =>
      http.get(apiUrl(`/api/Orders/GetOrder/${order.id}`)).pipe(
        map((body) => mapOrder(body)),
        catchError(() => of(null))
      )
    )
  ).pipe(
    map((details) => {
      const byId = new Map<string, Order>();
      details.forEach((detail) => {
        if (detail) byId.set(detail.id, detail);
      });
      return orders.map((order) => {
        const detail = byId.get(order.id);
        return detail ? mergeOrderFresh(order, detail) : order;
      });
    })
  );
}

function mergeOrderFresh(base: Order, detail: Order): Order {
  const api =
    STATUS_RANK[detail.apiStatus || 'Pending'] >= STATUS_RANK[base.apiStatus || 'Pending']
      ? detail.apiStatus || base.apiStatus
      : base.apiStatus || detail.apiStatus;
  return {
    ...base,
    ...detail,
    apiStatus: api,
    status: api ? mapStatus(api) : detail.status || base.status,
    itemIds: detail.itemIds.length ? detail.itemIds : base.itemIds,
    snapshots: { ...(base.snapshots || {}), ...(detail.snapshots || {}) },
    total: detail.total || base.total,
    customerName: detail.customerName || base.customerName,
    customerPhone: detail.customerPhone || base.customerPhone,
    customerAddress: detail.customerAddress || base.customerAddress,
    orderNotes: detail.orderNotes || base.orderNotes,
    paymentMethod: detail.paymentMethod || base.paymentMethod,
  };
}

function firstImageUrl(
  item: Record<string, unknown> | null,
  product: Record<string, unknown> | null
): string {
  const direct =
    pickString(item, ['image', 'imageUrl', 'thumbnail', 'photo']) ||
    pickString(product, ['image', 'imageUrl', 'thumbnail', 'coverImage']);
  if (direct) return direct;
  for (const rec of [item, product]) {
    if (!rec) continue;
    const urls = lookup(rec, 'imageUrls') ?? lookup(rec, 'images');
    if (!Array.isArray(urls) || !urls.length) continue;
    for (const entry of urls) {
      if (typeof entry === 'string' && entry.trim()) return entry.trim();
      const row = asRecord(entry);
      const fromObj = pickString(row, ['url', 'imageUrl', 'src', 'path']);
      if (fromObj) return fromObj;
    }
  }
  return '';
}

function unwrapOrderRecord(raw: unknown): Record<string, unknown> | null {
  const outer = asRecord(unwrapPayload(raw)) ?? asRecord(raw);
  if (!outer) return null;
  const nested = asRecord(lookup(outer, 'order')) ?? asRecord(lookup(outer, 'orderDetails'));
  if (nested && (lookup(nested, 'id') != null || lookup(nested, 'orderId') != null)) return nested;
  return outer;
}

function pickRelated(record: Record<string, unknown> | null, keys: string[]): Record<string, unknown> | null {
  if (!record) return null;
  for (const key of keys) {
    const nested = asRecord(lookup(record, key));
    if (nested) return nested;
  }
  return null;
}

function pickScalar(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) return '';
  for (const key of keys) {
    const value = lookup(record, key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function looksLikeGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

function firstAddressRecord(
  record: Record<string, unknown>,
  user: Record<string, unknown> | null
): Record<string, unknown> | null {
  const direct = pickRelated(record, [
    'address',
    'shippingAddress',
    'deliveryAddress',
    'userAddress',
    'customerAddress',
    'shipping',
  ]);
  if (direct) return direct;
  const fromUser = pickRelated(user, ['address', 'shippingAddress', 'defaultAddress']);
  if (fromUser) return fromUser;
  const listed = unwrapList(
    lookup(record, 'addresses') ?? lookup(user, 'addresses') ?? lookup(record, 'userAddresses')
  );
  return asRecord(listed[0]);
}

function formatAddress(address: Record<string, unknown> | null, record: Record<string, unknown>): string {
  if (!address) {
    return pickScalar(record, [
      'customerAddress',
      'addressText',
      'shippingAddressText',
      'deliveryAddress',
      'shippingAddress',
      'address',
    ]);
  }
  const notes = pickString(address, ['notes']);
  const parts = [
    pickString(address, ['label', 'title']),
    pickString(address, ['street', 'line', 'address', 'addressLine', 'addressLine1', 'details']),
    pickString(address, ['city', 'cityName', 'area']),
    pickString(address, ['governorate', 'state', 'region']),
    pickString(address, ['postalCode', 'zip', 'zipCode']),
  ].filter(Boolean);
  if (notes && !looksLikePhone(notes)) parts.push(notes);
  return (
    parts.join(' · ') ||
    pickScalar(record, ['customerAddress', 'addressText', 'shippingAddress', 'deliveryAddress', 'address'])
  );
}

function pickOrderContact(record: Record<string, unknown>): { name: string; phone: string; address: string } {
  const user = pickRelated(record, [
    'user',
    'customer',
    'buyer',
    'client',
    'profile',
    'account',
    'applicationUser',
    'owner',
  ]);
  const address = firstAddressRecord(record, user);
  const sources = [record, user, address].filter((row): row is Record<string, unknown> => !!row);
  const first = pickString(user, ['firstName', 'givenName']);
  const last = pickString(user, ['lastName', 'familyName']);
  const loginName =
    pickString(user, ['userName', 'username', 'displayName', 'fullName']) ||
    pickScalar(record, ['userName', 'customerName', 'clientName', 'buyerName', 'fullName']);
  const composed = pickDisplayName(`${first} ${last}`.trim());
  let name = pickDisplayName(
    pickString(record, ['customerName', 'clientName', 'buyerName', 'fullName', 'customerFullName']),
    pickString(user, ['fullName', 'displayName']),
    composed,
    loginName
  );
  if (!name && loginName && !looksLikeGuid(loginName) && !looksLikePhone(loginName) && !isGeneratedUserName(loginName)) {
    name = loginName;
  }
  const phoneKeys = [
    'customerPhone',
    'phone',
    'phoneNumber',
    'mobile',
    'mobileNumber',
    'userPhone',
    'contactPhone',
  ];
  let phone = '';
  for (const src of sources) {
    phone = pickString(src, phoneKeys);
    if (phone) break;
  }
  const addressNotes = pickString(address, ['notes']);
  if (!phone && addressNotes) phone = normalizePhone(addressNotes);
  if (!phone && loginName) phone = normalizePhone(loginName);
  phone = normalizePhone(phone);
  const addressText = formatAddress(address, record);
  return { name, phone, address: addressText };
}

const CONTACT_SKIP = new Set([
  'items',
  'orderitems',
  'products',
  'lines',
  'product',
  'reviews',
  'images',
  'imageurls',
  'highlights',
]);

type ContactBits = { name: string; phone: string; address: string };

function emptyContact(): ContactBits {
  return { name: '', phone: '', address: '' };
}

function mergeContact(...parts: ContactBits[]): ContactBits {
  const out = emptyContact();
  for (const part of parts) {
    if (!out.name && part.name) out.name = part.name;
    if (!out.phone && part.phone) out.phone = normalizePhone(part.phone) || part.phone;
    if (!out.address && part.address && !/^\d+$/.test(part.address)) out.address = part.address;
  }
  if (out.phone) out.phone = normalizePhone(out.phone);
  return out;
}

function normalizePhone(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  const generated = trimmed.match(/^user(\d{8,15})$/i);
  const digits = (generated ? generated[1] : trimmed.replace(/\D/g, ''));
  if (digits.length < 8 || digits.length > 15) return /^user/i.test(trimmed) ? '' : looksLikePhone(trimmed) ? trimmed : '';
  if (digits.startsWith('20')) return `+${digits}`;
  return digits;
}

function parseCheckoutSnapshot(raw: string): { contact: ContactBits; extra: string } {
  const contact = emptyContact();
  if (!raw) return { contact, extra: '' };
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const extra: string[] = [];
  for (const line of lines) {
    if (!line.startsWith('ALM|')) {
      extra.push(line);
      continue;
    }
    const parts = line.split('|');
    contact.name = pickDisplayName(parts[1] || '');
    contact.phone = normalizePhone(parts[2] || '');
    contact.address = (parts.slice(3).join('|') || '').trim();
  }
  return { contact, extra: extra.join('\n') };
}

function contactFromTree(raw: unknown): ContactBits {
  const bag = {
    first: '',
    last: '',
    full: '',
    phone: '',
    street: '',
    city: '',
    label: '',
    governorate: '',
    notes: '',
  };
  walkContact(raw, bag, 0);
  return {
    name: pickDisplayName(bag.full, `${bag.first} ${bag.last}`.trim()),
    phone: normalizePhone(bag.phone) || (looksLikePhone(bag.notes) ? normalizePhone(bag.notes) : ''),
    address: [bag.label, bag.street, bag.city, bag.governorate].filter(Boolean).join(' · '),
  };
}

function walkContact(
  node: unknown,
  bag: {
    first: string;
    last: string;
    full: string;
    phone: string;
    street: string;
    city: string;
    label: string;
    governorate: string;
    notes: string;
  },
  depth: number
): void {
  if (depth > 6 || node == null) return;
  const rec = asRecord(node);
  if (!rec) return;
  for (const [key, value] of Object.entries(rec)) {
    const k = key.toLowerCase();
    if (CONTACT_SKIP.has(k)) continue;
    if (typeof value === 'string' && value.trim()) {
      const v = value.trim();
      if (k === 'fullname' || k === 'displayname' || k === 'customername' || k === 'customerfullname') {
        if (!bag.full) bag.full = v;
      } else if (k === 'firstname' || k === 'givenname') {
        if (!bag.first) bag.first = v;
      } else if (k === 'lastname' || k === 'familyname') {
        if (!bag.last) bag.last = v;
      } else if (
        k === 'phone' ||
        k === 'phonenumber' ||
        k === 'mobile' ||
        k === 'mobilenumber' ||
        k === 'customerphone' ||
        k === 'userphone'
      ) {
        if (!bag.phone) bag.phone = v;
      } else if (k === 'username' || k === 'user') {
        const phone = normalizePhone(v);
        if (phone && !bag.phone) bag.phone = phone;
      } else if (k === 'street' || k === 'line' || k === 'addressline' || k === 'addressline1' || k === 'details') {
        if (!bag.street) bag.street = v;
      } else if (k === 'city' || k === 'cityname' || k === 'area') {
        if (!bag.city) bag.city = v;
      } else if (k === 'governorate' || k === 'state' || k === 'region') {
        if (!bag.governorate) bag.governorate = v;
      } else if (k === 'label' || k === 'title') {
        if (!bag.label && v.length < 40) bag.label = v;
      } else if (k === 'notes' && looksLikePhone(v) && !bag.phone) {
        bag.notes = v;
      } else if (
        (k === 'address' || k === 'shippingaddress' || k === 'customeraddress' || k === 'deliveryaddress') &&
        !/^\d+$/.test(v) &&
        v.length > 4 &&
        !bag.street
      ) {
        bag.street = v;
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      walkContact(value, bag, depth + 1);
    }
  }
}
