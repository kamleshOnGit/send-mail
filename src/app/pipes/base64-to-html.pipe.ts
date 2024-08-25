import { Pipe, PipeTransform } from '@angular/core';
import { decode } from 'html-entities';
import * as he from 'he';
import sanitizeHtml from 'sanitize-html';

@Pipe({
  name: 'base64ToHtml',
  standalone: true,
})
export class Base64ToHtmlPipe implements PipeTransform {
  
  transform(value: string): string {
    if (!value) {
      return '';
    }

    // Decode Base64 to a string
    const decodedString = this.base64Decode(value);

    // Decode HTML entities
    const decodedHtml = he.decode(decodedString);

    // Sanitize HTML
    const sanitizedHtml = this.sanitizeHtmlContent(decodedHtml);

    return sanitizedHtml;
  }

  private base64Decode(value: string): string {
    const binaryString = window.atob(
      value.replace(/_/g, '/').replace(/-/g, '+')
    );
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  private sanitizeHtmlContent(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']),
      allowedAttributes: {
        '*': ['href', 'class', 'id'],
        img: ['src', 'alt'],
        a: ['href'],
      },
    });
  }
}
