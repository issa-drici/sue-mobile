/**
 * Contacts du téléphone : permission, lecture, normalisation des numéros en +33…
 */
import * as Contacts from 'expo-contacts';
import { ENV } from '../../../config/env';
import { contactsService as legacyContacts } from '../contacts';
import { contactsService } from '../contactsService';

jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  Fields: { Name: 'name', PhoneNumbers: 'phoneNumbers', Image: 'image' },
  SortTypes: { FirstName: 'firstName' },
}));

const C = Contacts as jest.Mocked<typeof Contacts>;
const env = ENV as { USE_MOCKS: boolean };
let spies: jest.SpyInstance[] = [];

beforeEach(() => {
  jest.clearAllMocks();
  env.USE_MOCKS = false;
  spies = (['log', 'warn', 'error'] as const).map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
});
afterEach(() => {
  env.USE_MOCKS = false;
  jest.useRealTimers();
  spies.forEach((s) => s.mockRestore());
});

describe('contactsService.formatPhoneNumber', () => {
  it.each([
    [undefined, null],
    ['', null],
    ['abc', null],
    ['06 12 34 56 78', '+33612345678'],
    ['06.12.34.56.78', '+33612345678'],
    ['33612345678', '+33612345678'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['+1 (415) 555-2671', '+14155552671'],
    ['+123', null],
    ['+1234567890123456', null],
    ['0044 20 7946 0958', '+00442079460958'],
    ['123456', null],
    ['5551234', '+5551234'],
  ])('« %s » → %s', (input, expected) => {
    expect(contactsService.formatPhoneNumber(input as any)).toBe(expected);
  });
});

describe('contactsService.getAllContacts', () => {
  it('normalise, dédoublonne et ignore les contacts sans numéro valide', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    C.getContactsAsync.mockResolvedValueOnce({
      data: [
        { id: 'a', name: 'Alice', phoneNumbers: [{ number: '06 12 34 56 78' }, { number: '+33612345678' }, { number: 'xx' }] },
        { id: 'b', name: 'Bob', phoneNumbers: [] },
        { id: 'c', name: 'Carl' },
        { id: 'd', name: 'Dan', phoneNumbers: [{ number: '12' }] },
        { phoneNumbers: [{ number: '0700000000' }] },
      ],
    } as any);
    const result = await contactsService.getAllContacts();
    expect(C.getContactsAsync).toHaveBeenCalledWith({ fields: ['phoneNumbers', 'name'] });
    expect(result).toEqual([
      { id: 'a', name: 'Alice', phoneNumbers: ['+33612345678'] },
      { id: expect.any(String), name: 'Inconnu', phoneNumbers: ['+33700000000'] },
    ]);
  });

  it('aucun contact : tableau vide', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    C.getContactsAsync.mockResolvedValueOnce({ data: [] } as any);
    await expect(contactsService.getAllContacts()).resolves.toEqual([]);
  });

  it('permission refusée : erreur', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);
    await expect(contactsService.getAllContacts()).rejects.toThrow('Permission denied');
    expect(C.getContactsAsync).not.toHaveBeenCalled();
  });
});

describe('contacts (ancien service)', () => {
  it('checkContactsPermission : statut et canAskAgain (vrai par défaut), erreur → indéterminé', async () => {
    C.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted', canAskAgain: false } as any);
    await expect(legacyContacts.checkContactsPermission()).resolves.toEqual({ status: 'granted', canAskAgain: false });
    C.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' } as any);
    await expect(legacyContacts.checkContactsPermission()).resolves.toEqual({ status: 'undetermined', canAskAgain: true });
    C.getPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(legacyContacts.checkContactsPermission()).resolves.toEqual({ status: 'undetermined', canAskAgain: true });
  });

  it('requestContactsPermission : accordée / refusée / erreur', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    await expect(legacyContacts.requestContactsPermission()).resolves.toEqual({ status: 'granted', granted: true });
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);
    await expect(legacyContacts.requestContactsPermission()).resolves.toEqual({ status: 'denied', granted: false });
    C.requestPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(legacyContacts.requestContactsPermission()).resolves.toEqual({ status: 'denied', granted: false });
  });

  it('getPhoneContacts : seulement les contacts avec numéro et identifiant', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' } as any);
    C.getContactsAsync.mockResolvedValueOnce({
      data: [
        { id: 'a', name: 'A', phoneNumbers: [{ number: '1' }] },
        { id: 'b', name: 'B', phoneNumbers: [] },
        { id: '', name: 'C', phoneNumbers: [{ number: '2' }] },
        { id: 'd', name: 'D' },
      ],
    } as any);
    await expect(legacyContacts.getPhoneContacts()).resolves.toEqual([{ id: 'a', name: 'A', phoneNumbers: [{ number: '1' }] }]);
    expect(C.getContactsAsync).toHaveBeenCalledWith({ fields: ['name', 'phoneNumbers', 'image'], sort: 'firstName' });
  });

  it('getPhoneContacts : refus ou erreur → tableau vide', async () => {
    C.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' } as any);
    await expect(legacyContacts.getPhoneContacts()).resolves.toEqual([]);
    C.requestPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(legacyContacts.getPhoneContacts()).resolves.toEqual([]);
  });

  it('checkContactsOnSue : vide en vrai, utilisateurs fictifs en mode simulé', async () => {
    await expect(legacyContacts.checkContactsOnSue([])).resolves.toEqual([]);
    jest.useFakeTimers();
    env.USE_MOCKS = true;
    const promise = legacyContacts.checkContactsOnSue([]);
    await jest.advanceTimersByTimeAsync(800);
    const result = await promise;
    expect(result.map((u) => u.user?.id)).toEqual(['mock-user-1', 'mock-user-2']);
  });
});
