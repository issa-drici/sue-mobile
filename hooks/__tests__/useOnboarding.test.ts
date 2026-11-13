/** Statut de l'onboarding gardé sur le téléphone. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useOnboarding } from '../useOnboarding';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

it('lit « non terminé » par défaut', async () => {
  const { result } = renderHook(() => useOnboarding());
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isOnboardingCompleted).toBe(false);
});

it('lit « terminé » si déjà enregistré', async () => {
  await AsyncStorage.setItem('onboarding_completed', 'true');
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.isOnboardingCompleted).toBe(true));
});

it('enregistre la fin puis la réinitialisation', async () => {
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => { await result.current.completeOnboarding(); });
  expect(result.current.isOnboardingCompleted).toBe(true);
  expect(await AsyncStorage.getItem('onboarding_completed')).toBe('true');
  await act(async () => { await result.current.resetOnboarding(); });
  expect(result.current.isOnboardingCompleted).toBe(false);
  expect(await AsyncStorage.getItem('onboarding_completed')).toBeNull();
});

it('gère les erreurs de stockage', async () => {
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isOnboardingCompleted).toBe(false);

  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
  await act(async () => { await result.current.completeOnboarding(); });
  expect(result.current.isOnboardingCompleted).toBe(false);

  await act(async () => { await result.current.completeOnboarding(); });
  jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));
  await act(async () => { await result.current.resetOnboarding(); });
  expect(result.current.isOnboardingCompleted).toBe(true);
  expect(console.error).toHaveBeenCalledTimes(3);
});
