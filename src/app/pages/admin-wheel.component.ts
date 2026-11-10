import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, ApiWheelPrize, WheelPrizeDraft } from '../services/admin-api.service';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { IconComponent } from '../ui/icon.component';

const KINDS = [
  { id: 'Percent', ar: 'خصم', en: 'Discount' },
  { id: 'FreeShipping', ar: 'توصيل مجاني', en: 'Free delivery' },
  { id: 'Gift', ar: 'هدية', en: 'Gift' },
  { id: 'TryAgain', ar: 'جرب تاني', en: 'Spin again' },
];

@Component({
  selector: 'app-admin-wheel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="admin-bar">
      <p class="admin-bar__note">{{ locale.isAr() ? 'قطع العجلة اللي العميل ممكن يقف عليها. الخصم والتوصيل المجاني والهدية بتمشي مع الطلب.' : 'Slices the customer can land on. Discounts, free delivery, and gifts go with the order.' }}</p>
      <button type="button" class="admin-bar__add" (click)="openNew()">
        <app-icon name="plus" [size]="16"></app-icon>
        <span>{{ locale.isAr() ? 'قطعة جديدة' : 'New slice' }}</span>
      </button>
    </div>

    <div *ngIf="loading" class="admin-panel p-8 text-center text-sm text-ink-muted">{{ locale.ui('loading') }}</div>
    <p *ngIf="!loading && loadError" class="admin-empty">{{ loadError }}</p>

    <form *ngIf="!loading && formOpen" class="admin-panel admin-editor mb-5 p-4 sm:p-6" (submit)="save($event)">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="auth-label" for="wheel-ar"><span>الكلام على العجلة</span><span>Arabic label</span></label>
          <input id="wheel-ar" name="wheelAr" class="field-input !mt-1.5" [(ngModel)]="draft.labelAr" />
        </div>
        <div>
          <label class="auth-label" for="wheel-en"><span>الكلام بالإنجليزي</span><span>English label</span></label>
          <input id="wheel-en" name="wheelEn" class="field-input !mt-1.5" dir="ltr" [(ngModel)]="draft.labelEn" />
        </div>
        <div>
          <label class="auth-label" for="wheel-detail-ar"><span>التفصيل</span><span>Arabic detail</span></label>
          <input id="wheel-detail-ar" name="wheelDetailAr" class="field-input !mt-1.5" [(ngModel)]="draft.detailAr" />
        </div>
        <div>
          <label class="auth-label" for="wheel-detail-en"><span>التفصيل إنجليزي</span><span>English detail</span></label>
          <input id="wheel-detail-en" name="wheelDetailEn" class="field-input !mt-1.5" dir="ltr" [(ngModel)]="draft.detailEn" />
        </div>
        <div>
          <label class="auth-label" for="wheel-kind"><span>النوع</span><span>Type</span></label>
          <select id="wheel-kind" name="wheelKind" class="field-input !mt-1.5" [(ngModel)]="draft.kind">
            <option *ngFor="let kind of kinds" [value]="kind.id">{{ locale.isAr() ? kind.ar : kind.en }}</option>
          </select>
        </div>
        <div *ngIf="draft.kind === 'Percent'">
          <label class="auth-label" for="wheel-percent"><span>نسبة الخصم</span><span>Percent</span></label>
          <input id="wheel-percent" name="wheelPercent" type="number" min="1" max="100" class="field-input !mt-1.5" dir="ltr" [(ngModel)]="draft.percent" />
        </div>
        <div>
          <label class="auth-label" for="wheel-sort"><span>الترتيب</span><span>Order</span></label>
          <input id="wheel-sort" name="wheelSort" type="number" class="field-input !mt-1.5" dir="ltr" [(ngModel)]="draft.sortOrder" />
        </div>
      </div>
      <label class="mt-4 flex items-center gap-2 text-sm text-olive-800">
        <input type="checkbox" name="wheelActive" [(ngModel)]="draft.isActive" />
        {{ locale.isAr() ? 'ظاهرة على العجلة' : 'Visible on the wheel' }}
      </label>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="submit" [disabled]="saving" class="inline-flex h-11 items-center justify-center rounded-xl bg-gold-400 px-6 text-sm font-semibold text-olive-900 hover:bg-gold-300 disabled:opacity-60">{{ saving ? locale.ui('loading') : locale.ui('adminSave') }}</button>
        <button type="button" class="inline-flex h-11 items-center justify-center rounded-xl border border-olive-800/20 px-5 text-sm font-medium text-olive-800" (click)="formOpen = false">{{ locale.ui('adminCancel') }}</button>
      </div>
    </form>

    <ul *ngIf="!loading && !loadError && prizes.length" class="space-y-2">
      <li *ngFor="let row of prizes" class="rounded-2xl bg-white px-4 py-3 ring-1 ring-olive-800/10">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-base font-semibold text-olive-800">{{ row.labelAr || row.labelEn }}</p>
            <p *ngIf="row.labelEn" class="mt-1 text-sm text-ink-muted" dir="ltr">{{ row.labelEn }}</p>
            <p class="mt-1 text-xs text-gold-400">{{ kindLabel(row.kind) }}<span *ngIf="row.kind === 'Percent' && row.percent"> · {{ row.percent }}%</span> · {{ row.sortOrder }}</p>
          </div>
          <span class="shrink-0 text-xs font-semibold" [class.text-state-success]="row.isActive" [class.text-ink-muted]="!row.isActive">
            {{ row.isActive ? (locale.isAr() ? 'ظاهرة' : 'Visible') : (locale.isAr() ? 'مخفية' : 'Hidden') }}
          </span>
        </div>
        <div class="mt-3 flex gap-2">
          <button type="button" class="inline-flex h-9 items-center gap-1 rounded-lg bg-gold-400 px-3 text-xs font-semibold text-olive-900" (click)="edit(row)"><app-icon name="pencil" [size]="14"></app-icon>{{ locale.isAr() ? 'تعديل' : 'Edit' }}</button>
          <button type="button" class="inline-flex h-9 items-center gap-1 rounded-lg border border-olive-800/15 px-3 text-xs font-semibold text-state-danger" (click)="remove(row)"><app-icon name="trash" [size]="14"></app-icon>{{ locale.ui('adminDelete') }}</button>
        </div>
      </li>
    </ul>
    <p *ngIf="!loading && !loadError && !prizes.length" class="admin-empty">{{ locale.isAr() ? 'لسه مفيش قطع على العجلة.' : 'No wheel slices yet.' }}</p>
  `,
})
export class AdminWheelComponent implements OnInit {
  readonly kinds = KINDS;
  prizes: ApiWheelPrize[] = [];
  draft = emptyDraft();
  formOpen = false;
  loading = true;
  saving = false;
  loadError = '';

  constructor(
    public locale: LocaleService,
    private admin: AdminApiService,
    private store: StoreService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  kindLabel(kind: string): string {
    const row = KINDS.find((item) => item.id === kind);
    if (!row) return kind;
    return this.locale.isAr() ? row.ar : row.en;
  }

  openNew(): void {
    this.draft = emptyDraft(this.prizes.length + 1);
    this.formOpen = true;
  }

  edit(row: ApiWheelPrize): void {
    this.draft = { ...row };
    this.formOpen = true;
  }

  save(ev: Event): void {
    ev.preventDefault();
    if (!this.draft.labelAr.trim() && !this.draft.labelEn.trim()) {
      this.toast(this.locale.isAr() ? 'اكتب كلام القطعة.' : 'Write the slice label.', 'warning');
      return;
    }
    if (this.draft.kind === 'Percent') {
      const percent = Number(this.draft.percent);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        this.toast(this.locale.isAr() ? 'اكتب نسبة الخصم من ١ لـ ١٠٠.' : 'Enter a discount from 1 to 100.', 'warning');
        return;
      }
    }
    this.saving = true;
    const req = this.draft.id ? this.admin.updateWheelPrize(this.draft) : this.admin.addWheelPrize(this.draft);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.toast(this.locale.isAr() ? 'تم حفظ قطعة العجلة' : 'Wheel slice saved', 'success');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast(err instanceof Error ? err.message : this.locale.isAr() ? 'تعذر الحفظ' : 'Could not save', 'warning');
      },
    });
  }

  remove(row: ApiWheelPrize): void {
    const name = row.labelAr || row.labelEn;
    if (!window.confirm(this.locale.isAr() ? `حذف «${name}»؟` : `Delete “${name}”?`)) return;
    this.saving = true;
    this.admin.deleteWheelPrize(row.id).subscribe({
      next: () => {
        this.saving = false;
        this.toast(this.locale.isAr() ? 'تم الحذف' : 'Deleted', 'success');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast(err instanceof Error ? err.message : this.locale.isAr() ? 'تعذر الحذف' : 'Could not delete', 'warning');
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';
    this.admin.getWheelPrizes().subscribe({
      next: (rows) => {
        this.prizes = [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err instanceof Error ? err.message : this.locale.isAr() ? 'تعذر تحميل العجلة' : 'Could not load the wheel';
      },
    });
  }

  private toast(title: string, tone: 'success' | 'warning'): void {
    this.store.pushToast({ tone, title });
  }
}

function emptyDraft(sortOrder = 1): WheelPrizeDraft {
  return {
    id: 0,
    labelAr: '',
    labelEn: '',
    detailAr: '',
    detailEn: '',
    kind: 'Percent',
    percent: 10,
    sortOrder,
    isActive: true,
  };
}
