/** Redirections selon la connexion : écrans protégés et écrans d'authentification. */
import { renderHook } from '@testing-library/react-native';
import { useAuthRedirect, useAuthScreen, useProtectedRoute } from '../useAuthRedirect';

const mockAuth: { user: unknown; isLoading: boolean } = { user: null, isLoading: false };
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockAuth }));
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

beforeEach(() => {
  mockReplace.mockReset();
  mockAuth.user = null;
  mockAuth.isLoading = false;
});

describe.each([
  ['useAuthRedirect', useAuthRedirect],
  ['useProtectedRoute', useProtectedRoute],
])('%s', (_name, hook) => {
  it('redirige vers la connexion sans utilisateur', () => {
    const { result } = renderHook(() => hook());
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    expect(result.current).toEqual({ isAuthenticated: false, isLoading: false, user: null });
  });

  it('ne redirige pas pendant le chargement', () => {
    mockAuth.isLoading = true;
    renderHook(() => hook());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('ne redirige pas si connecté', () => {
    mockAuth.user = { id: 'u1' };
    const { result } = renderHook(() => hook());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe('useAuthScreen', () => {
  it('redirige vers l’app si déjà connecté', () => {
    mockAuth.user = { id: 'u1' };
    const { result } = renderHook(() => useAuthScreen());
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('reste sur l’écran si déconnecté ou en chargement', () => {
    renderHook(() => useAuthScreen());
    mockAuth.isLoading = true;
    mockAuth.user = { id: 'u1' };
    renderHook(() => useAuthScreen());
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
