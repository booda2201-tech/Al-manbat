import { Pipe, PipeTransform } from '@angular/core';
import { formatCount, formatPrice } from '../utils/format';
import { LocaleService } from '../services/locale.service';

@Pipe({ name: 'sar', standalone: true })
export class SarPipe implements PipeTransform {
  constructor(private locale: LocaleService) {}
  transform(value: number): string {
    return formatPrice(value, this.locale.locale());
  }
}

@Pipe({ name: 'countLoc', standalone: true })
export class CountPipe implements PipeTransform {
  constructor(private locale: LocaleService) {}
  transform(value: number): string {
    return formatCount(value, this.locale.locale());
  }
}
