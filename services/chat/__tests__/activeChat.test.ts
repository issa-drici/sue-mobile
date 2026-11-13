/**
 * Chat affiché / chats ouverts : pas de bannière pour le chat à l'écran, pas d'écran en double.
 */
const mockNavigate = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  router: { navigate: (...a: unknown[]) => mockNavigate(...a), dismissTo: (...a: unknown[]) => mockDismissTo(...a) },
}));

type Mod = typeof import('../activeChat');
let activeChat: Mod['activeChat'];
let openChat: Mod['openChat'];

beforeEach(() => {
  mockNavigate.mockReset();
  mockDismissTo.mockReset();
  jest.isolateModules(() => {
    ({ activeChat, openChat } = require('../activeChat'));
  });
});

describe('focus / blur / is', () => {
  it('aucun chat affiché au départ', () => {
    expect(activeChat.is('s1')).toBe(false);
    expect(activeChat.is(undefined)).toBe(false);
    expect(activeChat.is(null)).toBe(false);
    expect(activeChat.is('')).toBe(false);
  });

  it('reconnaît le chat affiché', () => {
    activeChat.focus('s1');
    expect(activeChat.is('s1')).toBe(true);
    expect(activeChat.is('s2')).toBe(false);
  });

  it('blur n’efface que si c’est encore ce chat', () => {
    activeChat.focus('s1');
    activeChat.focus('s2'); // le nouveau chat s'est enregistré avant le blur de l'ancien
    activeChat.blur('s1');
    expect(activeChat.is('s2')).toBe(true);
    activeChat.blur('s2');
    expect(activeChat.is('s2')).toBe(false);
  });
});

describe('mount / isMounted', () => {
  it('compte les écrans ouverts pour une même session', () => {
    const unmountA = activeChat.mount('s1');
    const unmountB = activeChat.mount('s1');
    expect(activeChat.isMounted('s1')).toBe(true);
    unmountA();
    expect(activeChat.isMounted('s1')).toBe(true);
    unmountB();
    expect(activeChat.isMounted('s1')).toBe(false);
  });

  it('un démontage en trop ne casse rien', () => {
    const unmount = activeChat.mount('s1');
    unmount();
    unmount();
    expect(activeChat.isMounted('s1')).toBe(false);
  });
});

describe('openChat', () => {
  it('ouvre un nouvel écran si le chat n’est pas dans la pile', () => {
    openChat('s1');
    expect(mockNavigate).toHaveBeenCalledWith('/chat/s1');
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('revient au chat déjà ouvert', () => {
    activeChat.mount('s1');
    openChat('s1');
    expect(mockDismissTo).toHaveBeenCalledWith('/chat/s1');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
