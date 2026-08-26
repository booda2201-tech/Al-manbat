import { Pipe, PipeTransform } from '@angular/core';
import { formatEgp } from '../../core/utils/helpers';

@Pipe({ name: 'egp', standalone: true })
export class EgpPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '';
    return formatEgp(value);
  }
}
