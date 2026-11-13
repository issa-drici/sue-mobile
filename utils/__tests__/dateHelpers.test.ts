/**
 * Formatage des dates et heures en français.
 */
import {
  debugTimeZone, formatCommentDate, formatDate, formatDateTime, formatRelativeDate, formatShortDate, formatTime,
  formatTimeFrance, formatTimeLocal, formatTimeUTC,
} from '../dateHelpers';

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  jest.useRealTimers();
});

const pad = (n: number) => String(n).padStart(2, '0');

describe('formatDate / formatShortDate / formatDateTime / formatCommentDate', () => {
  it('formate en français', () => {
    expect(formatDate('2026-01-05T12:00:00')).toBe('lundi 5 janvier');
    expect(formatShortDate('2026-01-05T12:00:00')).toBe('05/01/2026');
    expect(formatDateTime('2026-01-05T12:00:00', '18:30:00')).toBe('lundi 5 janvier à 18:30');
    expect(formatCommentDate('2026-12-25T14:30:00')).toMatch(/^25 déc\.?,? (à )?14:30$/);
  });
});

describe('formatTime', () => {
  it.each([
    ['18:00', '18:00'],
    ['9:05', '09:05'],
    ['18:00:59', '18:00'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });

  it('valeur absente → 00:00', () => {
    expect(formatTime(undefined as any)).toBe('00:00');
    expect(formatTime('')).toBe('00:00');
    expect(warn).toHaveBeenCalled();
  });

  it.each(['midi', '18h00', '25:00', '12:60'])('format ou heure invalide « %s » : renvoyé tel quel', (input) => {
    expect(formatTime(input)).toBe(input);
  });
});

describe('formatTimeLocal', () => {
  it('heure locale', () => {
    expect(formatTimeLocal('09:05')).toBe('09:05');
  });

  it('format invalide : repli sur formatTime', () => {
    expect(formatTimeLocal('ab:cd')).toBe('ab:cd');
  });

  it('erreur : repli sur formatTime', () => {
    expect(formatTimeLocal(undefined as any)).toBe('00:00');
  });
});

describe('formatTimeFrance / formatTimeUTC', () => {
  it('heure à Paris', () => {
    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30)
      .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' });
    expect(formatTimeFrance('18:30')).toBe(expected);
  });

  it('heure UTC', () => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30);
    expect(formatTimeUTC('18:30:00')).toBe(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`);
  });

  it.each([
    [formatTimeFrance], [formatTimeUTC],
  ])('format ou heure invalide, ou erreur : repli sur formatTime (%#)', (fn) => {
    expect(fn('midi')).toBe('midi');
    expect(fn('24:00')).toBe('24:00');
    expect(fn(undefined as any)).toBe('00:00');
  });
});

describe('debugTimeZone', () => {
  it('décrit l’heure analysée', () => {
    const info = debugTimeZone('18:30') as any;
    expect(info).toEqual(expect.objectContaining({ originalTime: '18:30', parsedHours: 18, parsedMinutes: 30 }));
    expect(info.dateObject).toBeInstanceOf(Date);
    expect(info.timezoneOffsetHours).toBe(info.timezoneOffset / 60);
  });

  it('erreur : message et heure d’origine', () => {
    expect(debugTimeZone(undefined as any)).toEqual({ error: expect.any(String), originalTime: undefined });
  });

  it('erreur non Error : convertie en texte', () => {
    const spy = jest.spyOn(String.prototype, 'split').mockImplementationOnce(() => { throw 'brut'; });
    expect(debugTimeZone('1:2')).toEqual({ error: 'brut', originalTime: '1:2' });
    spy.mockRestore();
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 10, 12, 0));
  });

  it.each([
    ['2026-01-10T12:00:00', 'Aujourd\'hui'],
    ['2026-01-09T12:00:00', 'Hier'],
    ['2026-01-11T12:00:00', 'Demain'],
    ['2026-01-07T12:00:00', 'Il y a 3 jours'],
    ['2026-01-03T12:00:00', 'Il y a 7 jours'],
    ['2026-01-14T12:00:00', 'Dans 4 jours'],
    ['2026-01-17T12:00:00', 'Dans 7 jours'],
    ['2025-12-01T12:00:00', 'lundi 1 décembre'],
    ['2026-02-02T12:00:00', 'lundi 2 février'],
  ])('%s → %s', (date, expected) => {
    expect(formatRelativeDate(date)).toBe(expected);
  });
});

describe('erreurs non Error dans les replis', () => {
  it.each([[formatTimeLocal], [formatTimeFrance], [formatTimeUTC]])('convertit en texte (%#)', (fn) => {
    const spy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementationOnce(() => { throw 'brut'; });
    expect(fn('10:00')).toBe('10:00');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('brut'));
    spy.mockRestore();
  });
});
