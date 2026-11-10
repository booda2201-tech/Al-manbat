import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Wheel } from 'spin-wheel';
import { LocaleService } from '../services/locale.service';
import { ShopApiService, WheelPrizeRow, WheelSpinRow } from '../services/shop-api.service';
import { StoreService } from '../services/store.service';
import { IconComponent } from './icon.component';

interface SpinSlice {
  id: number;
  ar: string;
  en: string;
  detailAr: string;
  detailEn: string;
  kind: string;
  percent: number | null;
  ink: string;
  token?: string;
}

@Component({
  selector: 'app-spin-wheel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="spin-scrim" (click)="close()"></div>
    <div class="spin-dialog" role="dialog" aria-modal="true" [attr.aria-label]="locale.isAr() ? 'العب واكسب' : 'Play and win'" (click)="$event.stopPropagation()">
      <button type="button" class="spin-close" (click)="close()" [attr.aria-label]="locale.isAr() ? 'إغلاق' : 'Close'">
        <app-icon name="close" [size]="16"></app-icon>
      </button>
      <p class="spin-kicker">{{ locale.isAr() ? 'لفّة حظ' : 'A lucky spin' }}</p>
      <h2 class="spin-title font-displayAr">{{ locale.isAr() ? 'العب واكسب' : 'Play and win' }}</h2>

      <div class="spin-stage">
        <span class="spin-pointer" aria-hidden="true"></span>
        <div #wheelHost class="spin-host"></div>
        <div #labelLayer class="spin-labels">
          <span *ngFor="let slice of slices; let i = index" class="spin-label" [style.color]="slice.ink" [style.transform]="labelTransform(i)">
            <span>{{ locale.isAr() ? slice.ar : slice.en }}</span>
          </span>
        </div>
        <button type="button" class="spin-hub" (click)="spin()" [disabled]="spinning || !!result || !slices.length">
          {{ spinning ? '…' : (locale.isAr() ? 'دور' : 'Spin') }}
        </button>
      </div>

      <div *ngIf="result" class="spin-result">
        <p class="spin-result__kicker">{{ locale.isAr() ? 'وقفت على' : 'You landed on' }}</p>
        <p class="spin-result__title font-displayAr">{{ locale.isAr() ? result.ar : result.en }}</p>
        <p class="spin-result__detail">{{ locale.isAr() ? result.detailAr : result.detailEn }}</p>
        <button *ngIf="result.token" type="button" class="spin-apply" (click)="applyPrize()">
          {{ locale.isAr() ? 'استخدم الجائزة' : 'Use this prize' }}
        </button>
      </div>
      <p *ngIf="!result" class="spin-hint">{{ hint }}</p>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; overflow: hidden; }
    .spin-scrim { position: absolute; inset: 0; background: rgba(24, 28, 8, 0.62); }
    .spin-dialog {
      position: relative;
      width: min(440px, calc(100vw - 1.5rem));
      overflow: hidden;
      border-radius: 28px;
      border: 1px solid rgba(168, 137, 55, 0.45);
      background:
        radial-gradient(120% 70% at 50% -8%, rgba(168, 137, 55, 0.2), transparent 52%),
        #fbf8ee;
      padding: 1.45rem 1.35rem 1.3rem;
      text-align: center;
      box-shadow: 0 28px 70px rgba(24, 28, 8, 0.38);
    }
    .spin-close {
      position: absolute;
      top: 0.85rem;
      inset-inline-end: 0.85rem;
      z-index: 2;
      display: grid;
      place-items: center;
      width: 2.1rem;
      height: 2.1rem;
      border: 0;
      border-radius: 999px;
      background: #efe6cc;
      color: #2e3310;
      cursor: pointer;
    }
    .spin-kicker {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.22em;
      color: #a88937;
    }
    .spin-title { margin: 0.2rem 0 0; font-size: 2.15rem; line-height: 1.15; color: #2e3310; }
    .spin-stage {
      position: relative;
      width: min(348px, 100%);
      aspect-ratio: 1;
      margin: 1.35rem auto 1rem;
    }
    .spin-pointer {
      position: absolute;
      top: -14px;
      left: 50%;
      z-index: 5;
      transform: translateX(-50%);
      border-left: 11px solid transparent;
      border-right: 11px solid transparent;
      border-top: 18px solid #a88937;
      filter: drop-shadow(0 2px 0 #2e3310);
    }
    .spin-host {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }
    .spin-labels {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }
    .spin-label {
      position: absolute;
      left: 50%;
      top: 50%;
      display: flex;
      width: 4.6rem;
      height: 40%;
      margin-left: -2.3rem;
      margin-top: -40%;
      align-items: flex-start;
      justify-content: center;
      padding-top: 22px;
      transform-origin: center bottom;
      font-family: Tajawal, sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
    }
    .spin-label span { display: block; max-width: 4.3rem; }
    .spin-hub {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 4;
      width: 4.4rem;
      height: 4.4rem;
      transform: translate(-50%, -50%);
      border: 5px solid #fbf8ee;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #d7bc6e, #a88937 48%, #866d28);
      color: #2e3310;
      font-size: 1.05rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 0 0 6px #2e3310, 0 8px 16px rgba(46, 51, 16, 0.28);
    }
    .spin-hub:disabled { cursor: default; }
    .spin-hint { margin: 0.15rem 0 0; font-size: 13px; color: #6d684e; }
    .spin-result { margin-top: 0.35rem; }
    .spin-result__kicker { margin: 0; font-size: 11px; letter-spacing: 0.16em; color: #a88937; }
    .spin-result__title { margin: 0.15rem 0 0; font-size: 1.7rem; color: #2e3310; }
    .spin-result__detail { margin: 0.3rem auto 0; max-width: 20rem; font-size: 14px; line-height: 1.55; color: #3c4124; }
    .spin-apply {
      margin-top: 0.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: 12px;
      background: #3f5d2a;
      padding: 0 1.25rem;
      color: #fbf8ee;
      font-weight: 700;
      cursor: pointer;
    }
  `],
})
export class SpinWheelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('wheelHost') wheelHost?: ElementRef<HTMLElement>;
  @ViewChild('labelLayer') labelLayer?: ElementRef<HTMLElement>;
  spinning = false;
  result: SpinSlice | null = null;
  slices: SpinSlice[] = [];
  private loaded = false;
  private viewReady = false;
  private wheel: Wheel | null = null;
  private followId = 0;

  constructor(
    public locale: LocaleService,
    private store: StoreService,
    private shop: ShopApiService,
    private zone: NgZone
  ) {
    this.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.shop.getWheelPrizes().subscribe({
      next: (rows) => {
        this.slices = (rows ?? []).map((row, index) => this.toSlice(row, index));
        this.loaded = true;
        this.mountWheel();
      },
      error: () => {
        this.loaded = true;
        this.slices = [];
      },
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.mountWheel();
  }

  ngOnDestroy(): void {
    if (this.followId) cancelAnimationFrame(this.followId);
    this.wheel?.remove();
    document.body.style.overflow = this.bodyOverflow;
  }

  get hint(): string {
    if (!this.loaded) return this.locale.isAr() ? 'بنحمّل العجلة.' : 'Loading the wheel.';
    if (!this.slices.length) return this.locale.isAr() ? 'العجلة مش متاحة دلوقتي.' : 'The wheel is not available right now.';
    return this.locale.isAr() ? 'اضغط دور وخلي العجلة تقف لوحدها.' : 'Press spin and let the wheel stop.';
  }

  close(): void {
    this.closed.emit();
  }

  spin(): void {
    if (this.spinning || this.result || !this.slices.length || !this.wheel) return;
    this.spinning = true;
    this.shop.spinWheel().subscribe({
      next: (spin) => {
        const found = this.slices.findIndex((item) => item.id === spin.prizeId);
        const index = found >= 0 ? found : Math.max(0, Math.min(spin.index, this.slices.length - 1));
        this.pendingSpin = spin;
        this.wheel?.spinToItem(index, 4600, true, 5, 1);
      },
      error: () => {
        this.spinning = false;
        this.store.pushToast({
          tone: 'warning',
          title: this.locale.isAr() ? 'العجلة متعطلتش. حاول تاني.' : 'The wheel did not spin. Try again.',
        });
      },
    });
  }

  private rested(): void {
    if (!this.spinning || !this.pendingSpin) return;
    this.spinning = false;
    const spin = this.pendingSpin;
    this.pendingSpin = null;
    if (spin.kind === 'TryAgain') return;
    const slice = this.slices.find((item) => item.id === spin.prizeId) ?? this.slices[spin.index];
    if (!slice || !spin.token) return;
    this.result = {
      ...slice,
      ar: spin.labelAr || slice.ar,
      en: spin.labelEn || slice.en,
      detailAr: spin.detailAr || slice.detailAr,
      detailEn: spin.detailEn || slice.detailEn,
      kind: spin.kind,
      percent: spin.percent ?? null,
      token: spin.token,
    };
  }

  applyPrize(): void {
    const prize = this.result;
    if (!prize?.token) return;
    if (prize.kind !== 'Percent' && prize.kind !== 'FreeShipping' && prize.kind !== 'Gift') return;
    this.store.holdWheel({
      token: prize.token,
      kind: prize.kind,
      percent: prize.percent,
      labelAr: prize.ar,
      labelEn: prize.en,
      detailAr: prize.detailAr,
      detailEn: prize.detailEn,
    });
    this.store.pushToast({
      tone: 'success',
      title: this.locale.isAr() ? 'الجائزة هتروح مع الطلب' : 'The prize will go with the order',
    });
    this.close();
  }

  private mountWheel(): void {
    if (this.wheel || !this.viewReady || !this.slices.length || !this.wheelHost) return;
    this.wheel = new Wheel(this.wheelHost.nativeElement, {
      items: this.slices.map((_, index) => ({
        label: '',
        backgroundColor: FILLS[index % FILLS.length],
      })),
      isInteractive: false,
      borderColor: '#a88937',
      borderWidth: 8,
      lineColor: '#fbf8ee',
      lineWidth: 8,
      radius: 0.96,
      pointerAngle: 0,
      onRest: () => this.zone.run(() => this.rested()),
    });
    document.fonts?.ready.then(() => this.wheel?.resize());
    this.followWheel();
  }

  labelTransform(index: number): string {
    const slice = 360 / (this.slices.length || 1);
    return `rotate(${index * slice + slice / 2}deg)`;
  }

  private followWheel = (): void => {
    const wheel = this.wheel;
    const layer = this.labelLayer?.nativeElement;
    if (wheel && layer) {
      const turn = Number(wheel.rotation) || 0;
      layer.style.transform = `rotate(${turn}deg)`;
      const slice = 360 / (this.slices.length || 1);
      layer.querySelectorAll<HTMLElement>(':scope > span > span').forEach((node, index) => {
        const angle = (((index * slice + slice / 2 + turn) % 360) + 360) % 360;
        node.style.transform = angle > 90 && angle < 270 ? 'rotate(180deg)' : '';
      });
    }
    this.followId = requestAnimationFrame(this.followWheel);
  };

  private toSlice(row: WheelPrizeRow, index: number): SpinSlice {
    return {
      id: row.id,
      ar: row.labelAr,
      en: row.labelEn,
      detailAr: row.detailAr || '',
      detailEn: row.detailEn || '',
      kind: row.kind,
      percent: row.percent ?? null,
      ink: DARK.has(FILLS[index % FILLS.length]) ? '#fbf8ee' : '#2e3310',
    };
  }

  private pendingSpin: WheelSpinRow | null = null;
  private bodyOverflow = '';
}

const FILLS = ['#243012', '#f4e7c2', '#3d5a28', '#fbf6ea', '#6d5522', '#e7d7a6'];
const DARK = new Set(['#243012', '#3d5a28', '#6d5522']);
