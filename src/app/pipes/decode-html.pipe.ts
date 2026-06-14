import { Pipe, PipeTransform } from '@angular/core';
import * as he from 'he';

@Pipe({
  name: 'decodeHtml',
  standalone: true,
})
export class DecodeHtmlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }
    return he.decode(value);
  }
}
