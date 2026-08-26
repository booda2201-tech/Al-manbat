import { Injectable, signal } from '@angular/core';
import { Address, Customer } from '../models/commerce.models';
import { STORAGE_KEYS, storageGet, storageSet, uid } from '../utils/helpers';

interface AuthState {
  customer: Customer | null;
}

/** MOCK BOUNDARY: replace with real authentication, hashing, and session cookies. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly state = signal<AuthState>(
    storageGet<AuthState>(STORAGE_KEYS.auth, { customer: null })
  );

  readonly customer = () => this.state().customer;
  readonly isLoggedIn = () => !!this.state().customer;

  login(email: string, password: string): { ok: boolean; message: string } {
    const users = storageGet<Customer[]>(STORAGE_KEYS.customers, []);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === password
    );
    if (!found) return { ok: false, message: 'البريد أو كلمة المرور غير صحيحة.' };
    this.setCustomer(found);
    return { ok: true, message: `مرحباً ${found.name}` };
  }

  register(data: { name: string; email: string; mobile: string; password: string }): {
    ok: boolean;
    message: string;
  } {
    const users = storageGet<Customer[]>(STORAGE_KEYS.customers, []);
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, message: 'هذا البريد مسجّل بالفعل.' };
    }
    const customer: Customer = {
      id: uid('cus'),
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      passwordHash: data.password,
      addresses: [],
    };
    storageSet(STORAGE_KEYS.customers, [...users, customer]);
    this.setCustomer(customer);
    return { ok: true, message: 'تم إنشاء الحساب.' };
  }

  requestReset(email: string): { ok: boolean; message: string } {
    const users = storageGet<Customer[]>(STORAGE_KEYS.customers, []);
    if (!users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { ok: false, message: 'لا يوجد حساب مرتبط بهذا البريد.' };
    }
    return { ok: true, message: 'إن وُجد الحساب، ستصلك رسالة إعادة التعيين. هذه محاكاة بدون إرسال بريد فعلي.' };
  }

  updateProfile(patch: Partial<Pick<Customer, 'name' | 'email' | 'mobile'>>): void {
    const current = this.state().customer;
    if (!current) return;
    const next = { ...current, ...patch };
    this.persistCustomer(next);
  }

  updatePassword(currentPassword: string, nextPassword: string): { ok: boolean; message: string } {
    const current = this.state().customer;
    if (!current) return { ok: false, message: 'يلزم تسجيل الدخول.' };
    if (current.passwordHash !== currentPassword) {
      return { ok: false, message: 'كلمة المرور الحالية غير صحيحة.' };
    }
    this.persistCustomer({ ...current, passwordHash: nextPassword });
    return { ok: true, message: 'تم تحديث كلمة المرور.' };
  }

  saveAddress(address: Omit<Address, 'id'> & { id?: string }): void {
    const current = this.state().customer;
    if (!current) return;
    let addresses = [...current.addresses];
    if (address.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }
    if (address.id) {
      addresses = addresses.map((a) => (a.id === address.id ? { ...a, ...address, id: a.id } : a));
    } else {
      addresses.push({ ...address, id: uid('addr'), isDefault: address.isDefault || addresses.length === 0 });
    }
    this.persistCustomer({ ...current, addresses });
  }

  removeAddress(id: string): void {
    const current = this.state().customer;
    if (!current) return;
    this.persistCustomer({ ...current, addresses: current.addresses.filter((a) => a.id !== id) });
  }

  logout(): void {
    this.state.set({ customer: null });
    storageSet(STORAGE_KEYS.auth, { customer: null });
  }

  private setCustomer(customer: Customer): void {
    this.state.set({ customer });
    storageSet(STORAGE_KEYS.auth, { customer });
  }

  private persistCustomer(customer: Customer): void {
    const users = storageGet<Customer[]>(STORAGE_KEYS.customers, []);
    storageSet(
      STORAGE_KEYS.customers,
      users.map((u) => (u.id === customer.id ? customer : u))
    );
    this.setCustomer(customer);
  }
}
