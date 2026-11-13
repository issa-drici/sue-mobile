import { ENV } from '../../config/env';
import { formatAvatarUrl } from '../avatar';

const root = ENV.API_BASE_URL.replace(/\/api\/?$/, '');

describe('formatAvatarUrl', () => {
  it.each([null, undefined, ''])('%p → null', (url) => {
    expect(formatAvatarUrl(url as any)).toBeNull();
  });

  it.each([
    'file:///var/photo.jpg',
    'ph://ABC',
    'assets-library://asset/1.JPG',
    'http://cdn.test/a.png',
    'https://cdn.test/a.png',
  ])('garde tel quel « %s »', (url) => {
    expect(formatAvatarUrl(url)).toBe(url);
  });

  it('chemin relatif → URL absolue sur la racine du backend (sans /api)', () => {
    expect(formatAvatarUrl('/storage/a.png')).toBe(`${root}/storage/a.png`);
    expect(formatAvatarUrl('storage/a.png')).toBe(`${root}/storage/a.png`);
    expect(formatAvatarUrl('storage/a.png')).not.toContain('/api/');
  });
});
