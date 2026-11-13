import { formatPhoneDisplay, normalizeFrenchPhone } from '../phone';

describe('normalizeFrenchPhone', () => {
  it.each([
    ['06 12 34 56 78', '+33612345678'],
    ['0612345678', '+33612345678'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['0033612345678', '+33612345678'],
    ['33612345678', '+33612345678'],
    ['612345678', '+33612345678'],
    ['07.12.34.56.78', '+33712345678'],
  ])('« %s » → %s', (input, expected) => {
    expect(normalizeFrenchPhone(input)).toBe(expected);
  });

  it.each(['', '0612', '06123456789', '0012345678', 'abc'])('refuse « %s »', (input) => {
    expect(normalizeFrenchPhone(input)).toBeNull();
  });
});

describe('formatPhoneDisplay', () => {
  it('affiche un numéro français à la française, avec des espaces insécables', () => {
    expect(formatPhoneDisplay('+33612345678')).toBe('06 12 34 56 78');
  });

  it('laisse un numéro étranger tel quel et gère l’absence de numéro', () => {
    expect(formatPhoneDisplay('+32470123456')).toBe('+32470123456');
    expect(formatPhoneDisplay(null)).toBe('');
    expect(formatPhoneDisplay(undefined)).toBe('');
  });
});
