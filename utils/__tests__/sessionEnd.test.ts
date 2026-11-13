import { getSessionEndDate, isSessionFinished } from '../timeHelpers';

describe('getSessionEndDate', () => {
  it('combine la date et l’heure de fin', () => {
    const end = getSessionEndDate('2026-11-14', '20:00', '19:00')!;
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(10);
    expect(end.getDate()).toBe(14);
    expect(end.getHours()).toBe(20);
    expect(end.getMinutes()).toBe(0);
  });

  it('une session qui finit après minuit se termine le lendemain', () => {
    const end = getSessionEndDate('2026-11-14', '00:30', '23:30')!;
    expect(end.getDate()).toBe(15);
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(30);
  });

  it('accepte les heures avec secondes', () => {
    const end = getSessionEndDate('2026-11-14', '21:15:00', '20:00:00')!;
    expect(end.getHours()).toBe(21);
    expect(end.getMinutes()).toBe(15);
  });

  it('renvoie null sans date ou sans heure de fin (créneau pas encore trouvé)', () => {
    expect(getSessionEndDate('', '20:00')).toBeNull();
    expect(getSessionEndDate('2026-11-14', '')).toBeNull();
  });
});

describe('isSessionFinished', () => {
  afterEach(() => jest.useRealTimers());

  it('une session de 23:30 à 00:30 n’est pas finie à 23:45', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 14, 23, 45));
    expect(isSessionFinished('2026-11-14', '00:30', '23:30')).toBe(false);
  });

  it('elle est finie à 00:45 le lendemain', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 15, 0, 45));
    expect(isSessionFinished('2026-11-14', '00:30', '23:30')).toBe(true);
  });

  it('une session sans date n’est jamais considérée comme finie', () => {
    expect(isSessionFinished('', '')).toBe(false);
  });
});
