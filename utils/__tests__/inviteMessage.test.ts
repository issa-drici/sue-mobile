/**
 * Message d'invitation partagé (SMS, WhatsApp…) : libellé du sport, jour, heure, prénom du contact.
 */
import { buildSessionInviteMessage } from '../inviteMessage';

const URL = 'https://sue-app.fr/join/tok';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 0, 5, 10, 0)); // lundi 5 janvier 2026, 10h
});
afterEach(() => {
  jest.useRealTimers();
});

const build = (overrides: Partial<Parameters<typeof buildSessionInviteMessage>[0]> = {}) =>
  buildSessionInviteMessage({ sport: 'football', date: '2026-01-05', startTime: '18:30', sessionUrl: URL, ...overrides });

describe('date et heure', () => {
  it('aujourd’hui : l’heure seule', () => {
    expect(build()).toBe(`Foot à 18h30 ? Confirme ici\n${URL}`);
  });

  it('dans moins de 7 jours : le jour de la semaine', () => {
    expect(build({ date: '2026-01-07' })).toBe(`Foot mercredi à 18h30 ? Confirme ici\n${URL}`);
  });

  it('plus loin : la date complète', () => {
    expect(build({ date: '2026-01-20' })).toBe(`Foot mardi 20 janvier à 18h30 ? Confirme ici\n${URL}`);
  });

  it.each([
    ['18:00', '18h'],
    ['09:05', '9h05'],
    ['', '0h'],
    ['xx:yy', '0h'],
  ])('heure « %s » → %s', (startTime, label) => {
    expect(build({ startTime })).toContain(`à ${label} ?`);
  });
});

describe('libellé du sport', () => {
  it.each([
    ['course', 'On va courir'],
    ['JUDO', 'Judo'],
    [' tennis ', 'Tennis'],
    ['cricket', 'Cricket'],
    ['', 'Session'],
  ])('« %s » → « %s »', (sport, label) => {
    expect(build({ sport })).toBe(`${label} à 18h30 ? Confirme ici\n${URL}`);
  });
});

describe('avec le prénom du contact', () => {
  it('passe le libellé en milieu de phrase', () => {
    expect(build({ contactName: 'Léa' })).toBe(`Salut Léa, foot à 18h30 ? Confirme ici\n${URL}`);
    expect(build({ contactName: 'Léa', sport: 'course' })).toContain('Salut Léa, on va courir à');
  });

  it('garde les sigles courts en majuscules', () => {
    expect(build({ contactName: 'Léa', sport: 'jiu-jitsu-brésilien' })).toContain('Salut Léa, JJB à');
    expect(build({ contactName: 'Léa', sport: 'stand-up-paddle' })).toContain('Salut Léa, SUP à');
  });
});

describe('créneau à trouver', () => {
  it('demande les disponibilités au lieu d’une date', () => {
    expect(build({ findingSlot: true })).toBe(`Foot ? Dis-moi quand tu es dispo\n${URL}`);
    expect(build({ findingSlot: true, contactName: 'Tom', sport: 'padel' })).toBe(`Salut Tom, padel ? Dis-moi quand tu es dispo\n${URL}`);
  });
});
