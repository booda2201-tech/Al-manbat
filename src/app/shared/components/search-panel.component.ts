import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { SearchHistoryService, UiService } from '../../core/services/ui.service';
import { EgpPipe } from '../pipes/egp.pipe';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, EgpPipe],
  template: `
    <ng-container *ngIf="ui.searchOpen()">
      <div class="overlay" (click)="ui.searchOpen.set(false)"></div>
      <div class="panel" role="dialog" aria-label="البحث">
        <form class="bar" (submit)="submit()">
          <app-icon name="search"></app-icon>
          <input
            #q
            type="search"
            [(ngModel)]="query"
            name="q"
            placeholder="ابحث عن منتج، قسم، أو علامة تجارية"
            (ngModelChange)="onType()"
            (keydown)="onKey($event)"
            autofocus
          />
          <button type="button" *ngIf="query" (click)="query = ''; matches = []" aria-label="مسح البحث">
            <app-icon name="close" [size]="18"></app-icon>
          </button>
        </form>
        <div class="body">
          <section *ngIf="!query">
            <h3>عمليات بحث أخيرة</h3>
            <p *ngIf="!recent.length" class="muted">لا توجد عمليات بحث بعد.</p>
            <button type="button" class="chip-btn" *ngFor="let r of recent" (click)="use(r)">{{ r }}</button>
            <h3>أقسام شائعة</h3>
            <a routerLink="/category/groceries" (click)="close()">مواد غذائية</a>
            <a routerLink="/category/beauty" (click)="close()">تجميل وعناية</a>
            <a routerLink="/category/appliances" (click)="close()">أجهزة كهربائية</a>
            <a routerLink="/category/electronics" (click)="close()">إلكترونيات</a>
          </section>
          <section *ngIf="query && matches.length">
            <h3>منتجات مطابقة</h3>
            <a
              class="hit"
              *ngFor="let p of matches; let i = index"
              [class.on]="i === active"
              [routerLink]="['/product', p.slug]"
              (click)="close()"
            >
              <img [src]="p.images[0]" [alt]="p.nameAr" />
              <span>{{ p.nameAr }}</span>
              <strong>{{ p.price | egp }}</strong>
            </a>
          </section>
          <section *ngIf="query && !matches.length">
            <p>لا توجد نتائج لـ «{{ query }}». جرّب كلمة أقصر أو قسماً مختلفاً.</p>
          </section>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .panel {
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: min(720px, calc(100% - 24px));
        background: var(--color-surface);
        z-index: var(--z-modal);
        border-radius: 16px;
        box-shadow: var(--shadow-olive-hover);
        max-height: 80vh;
        overflow: auto;
      }
      .bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--color-border);
      }
      input {
        flex: 1;
        border: 0;
        background: transparent;
        min-height: 44px;
      }
      .body {
        padding: 16px;
      }
      h3 {
        font-size: 13px;
        margin: 12px 0 8px;
        color: var(--color-primary);
      }
      .chip-btn,
      a {
        display: inline-block;
        margin: 0 0 8px 8px;
        padding: 6px 10px;
        background: var(--color-surface-raised);
        border-radius: 999px;
      }
      .hit {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        gap: 10px;
        align-items: center;
        background: transparent;
        border-radius: 10px;
        padding: 8px;
        width: 100%;
      }
      .hit.on,
      .hit:hover {
        background: var(--color-surface-raised);
      }
      .hit img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 8px;
      }
    `,
  ],
})
export class SearchPanelComponent {
  query = '';
  matches: Product[] = [];
  active = 0;
  recent: string[] = [];

  constructor(
    public ui: UiService,
    private catalog: CatalogService,
    private history: SearchHistoryService,
    private router: Router
  ) {
    this.recent = this.history.list();
  }

  onType(): void {
    this.matches = this.catalog.searchPreview(this.query, 6);
    this.active = 0;
  }

  onKey(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.active = Math.min(this.active + 1, this.matches.length - 1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.active = Math.max(this.active - 1, 0);
    } else if (ev.key === 'Escape') {
      this.close();
    }
  }

  use(q: string): void {
    this.query = q;
    this.submit();
  }

  submit(): void {
    const q = this.query.trim();
    if (!q) return;
    this.history.add(q);
    this.close();
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  close(): void {
    this.ui.searchOpen.set(false);
  }
}
