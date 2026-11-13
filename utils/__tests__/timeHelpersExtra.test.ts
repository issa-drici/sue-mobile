import { endsNextDay, formatTimeString, getDefaultEndTime, isSessionFinished, roundToNextHalfHour } from '../timeHelpers';

describe('roundToNextHalfHour', () => {
  it('avant la demi-heure → :30', () => {
    const r = roundToNextHalfHour(new Date(2026, 0, 1, 14, 0, 12));
    expect([r.getHours(), r.getMinutes(), r.getSeconds()]).toEqual([14, 30, 0]);
  });

  it('à partir de la demi-heure → heure suivante', () => {
    const r = roundToNextHalfHour(new Date(2026, 0, 1, 14, 30));
    expect([r.getHours(), r.getMinutes()]).toEqual([15, 0]);
    const late = roundToNextHalfHour(new Date(2026, 0, 1, 23, 45));
    expect([late.getDate(), late.getHours(), late.getMinutes()]).toEqual([2, 0, 0]);
  });

  it('ne modifie pas la date reçue', () => {
    const d = new Date(2026, 0, 1, 14, 10);
    roundToNextHalfHour(d);
    expect(d.getMinutes()).toBe(10);
  });
});

describe('autres utilitaires', () => {
  it('endsNextDay', () => {
    expect(endsNextDay(new Date(2026, 0, 1, 23, 0), new Date(2026, 0, 1, 0, 30))).toBe(true);
    expect(endsNextDay(new Date(2026, 0, 1, 10, 0), new Date(2026, 0, 1, 11, 0))).toBe(false);
  });

  it('getDefaultEndTime ajoute une heure', () => {
    expect(getDefaultEndTime(new Date(2026, 0, 1, 10, 15)).getHours()).toBe(11);
  });

  it('formatTimeString → HH:MM', () => {
    expect(formatTimeString(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
  });

  it('isSessionFinished : sans date ni heure de fin → faux', () => {
    expect(isSessionFinished('', '20:00')).toBe(false);
    expect(isSessionFinished('2026-01-01', '')).toBe(false);
    expect(isSessionFinished('2000-01-01', '20:00')).toBe(true);
    expect(isSessionFinished('2999-01-01', '20:00')).toBe(false);
  });
});
