import { Base64ToHtmlPipe } from './base64-to-html.pipe';

describe('Base64ToHtmlPipe', () => {
  it('create an instance', () => {
    const pipe = new Base64ToHtmlPipe();
    expect(pipe).toBeTruthy();
  });
});
