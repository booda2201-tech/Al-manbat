import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { MenuSelectComponent, type MenuSelectOption, type MenuSelectValue } from './menu-select.component';

@Component({
  selector: 'app-sort-select',
  standalone: true,
  imports: [MenuSelectComponent],
  host: { class: 'relative z-20 inline-block w-full min-w-0 lg:w-auto' },
  template: `
    <app-menu-select
      variant="toolbar"
      icon="sort"
      [options]="options"
      [value]="value"
      (valueChange)="onPick($event)"
      [title]="locale.ui('sortBy')"
      [kicker]="locale.ui('sortBy')"
      [kickerEn]="!locale.isAr()"
      [closeLabel]="locale.isAr() ? 'إغلاق' : 'Close'"
    ></app-menu-select>
  `,
})
export class SortSelectComponent {
  @Input() value = 'popular';
  @Output() valueChange = new EventEmitter<string>();

  constructor(public locale: LocaleService) {}

  get options(): MenuSelectOption[] {
    const ar = this.locale.isAr();
    return [
      { value: 'popular', label: ar ? 'الأكثر شعبية' : 'Most popular' },
      { value: 'newest', label: ar ? 'الأحدث' : 'Newest' },
      { value: 'price-asc', label: ar ? 'السعر: الأقل أولاً' : 'Price: low to high' },
      { value: 'price-desc', label: ar ? 'السعر: الأعلى أولاً' : 'Price: high to low' },
      { value: 'rating', label: ar ? 'الأعلى تقييماً' : 'Top rated' },
    ];
  }

  onPick(next: MenuSelectValue): void {
    const value = String(next);
    this.value = value;
    this.valueChange.emit(value);
  }
}
