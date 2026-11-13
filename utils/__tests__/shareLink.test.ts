import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearPendingShareToken, extractFromParam, extractShareToken, getPendingShareToken, setPendingShareToken,
} from '../shareLink';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('extractShareToken', () => {
  it.each([
    ['https://sue-app.fr/join/abc123', 'abc123'],
    ['https://sue-app.fr/join/abc123?from=u1', 'abc123'],
    ['sue://join/abc#x', 'abc'],
    ['https://sue-app.fr/join/a%20b', 'a b'],
    ['https://sue-app.fr/join/%E0%A4%A', '%E0%A4%A'], // encodage invalide : token brut
    ['https://sue-app.fr/sessions/1', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('%p → %p', (url, expected) => {
    expect(extractShareToken(url as any)).toBe(expected);
  });
});

describe('extractFromParam', () => {
  it.each([
    ['https://sue-app.fr/join/abc?from=u1', 'u1'],
    ['https://sue-app.fr/join/abc?x=1&from=u%202#h', 'u 2'],
    ['https://sue-app.fr/join/abc?from=%E0%A4%A', '%E0%A4%A'],
    ['https://sue-app.fr/join/abc', null],
    [null, null],
  ])('%p → %p', (url, expected) => {
    expect(extractFromParam(url as any)).toBe(expected);
  });
});

describe('lien de partage en attente', () => {
  it('stocke le token et l’inviteur, puis les relit', async () => {
    await setPendingShareToken('tok', 'u1');
    await expect(getPendingShareToken()).resolves.toEqual({ token: 'tok', from: 'u1' });
    await setPendingShareToken('tok2');
    await expect(getPendingShareToken()).resolves.toEqual({ token: 'tok2', from: null });
  });

  it('rien de stocké → null', async () => {
    await expect(getPendingShareToken()).resolves.toBeNull();
  });

  it('ancien format (token seul) toujours lu', async () => {
    await AsyncStorage.setItem('pending_share_token', 'ancien');
    await expect(getPendingShareToken()).resolves.toEqual({ token: 'ancien', from: null });
  });

  it('objet sans token ou JSON invalide → null', async () => {
    await AsyncStorage.setItem('pending_share_token', '{"from":"u1"}');
    await expect(getPendingShareToken()).resolves.toBeNull();
    await AsyncStorage.setItem('pending_share_token', '{oops');
    await expect(getPendingShareToken()).resolves.toBeNull();
    await AsyncStorage.setItem('pending_share_token', '{"token":"t"}');
    await expect(getPendingShareToken()).resolves.toEqual({ token: 't', from: null });
  });

  it('efface le lien', async () => {
    await setPendingShareToken('tok');
    await clearPendingShareToken();
    await expect(getPendingShareToken()).resolves.toBeNull();
  });

  it('erreurs de stockage silencieuses', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('plein'));
    await expect(setPendingShareToken('tok')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('x'));
    await expect(clearPendingShareToken()).resolves.toBeUndefined();
    warn.mockRestore();
  });
});
