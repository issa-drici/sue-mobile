/** Sports préférés : chargement depuis le profil, ajout, retrait, bascule, filtres. */
import { act, renderHook } from '@testing-library/react-native';
import { useSportsPreferences } from '../useSportsPreferences';

const mockProfile: { data: unknown; refetch: jest.Mock } = { data: undefined, refetch: jest.fn() };
const mockUpdate = { updateSportsPreferences: jest.fn(), isLoading: false, error: null as string | null };
jest.mock('../../services/users/getUserProfile', () => ({ useGetUserProfile: () => mockProfile }));
jest.mock('../../services/users/updateSportsPreferences', () => ({ useUpdateSportsPreferences: () => mockUpdate }));

beforeEach(() => {
  mockProfile.data = undefined;
  mockProfile.refetch = jest.fn().mockResolvedValue(undefined);
  mockUpdate.updateSportsPreferences = jest.fn().mockResolvedValue(true);
  mockUpdate.isLoading = false;
  mockUpdate.error = null;
});

it('reste en chargement tant que le profil n’est pas là', () => {
  const { result } = renderHook(() => useSportsPreferences());
  expect(result.current.isLoading).toBe(true);
  expect(result.current.sportsPreferences).toEqual([]);
});

it('charge les préférences du profil', () => {
  mockProfile.data = { sports_preferences: ['tennis', 'padel'] };
  const { result } = renderHook(() => useSportsPreferences());
  expect(result.current.sportsPreferences).toEqual(['tennis', 'padel']);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isSportPreferred('tennis')).toBe(true);
  expect(result.current.isSportPreferred('golf')).toBe(false);
  expect(result.current.getNonPreferredSports(['tennis', 'golf', 'padel'])).toEqual(['golf']);
  expect(result.current.refreshPreferences).toBe(mockProfile.refetch);
});

it('profil sans préférences : liste vide', () => {
  mockProfile.data = { sports_preferences: [] };
  const { result } = renderHook(() => useSportsPreferences());
  expect(result.current.sportsPreferences).toEqual([]);
  expect(result.current.isLoading).toBe(false);
});

it('isLoading et error reflètent la mise à jour en cours', () => {
  mockProfile.data = {};
  mockUpdate.isLoading = true;
  mockUpdate.error = 'oops';
  const { result } = renderHook(() => useSportsPreferences());
  expect(result.current.isLoading).toBe(true);
  expect(result.current.error).toBe('oops');
});

it('ajoute, retire et bascule un sport', async () => {
  mockProfile.data = { sports_preferences: ['tennis'] };
  const { result } = renderHook(() => useSportsPreferences());

  let ok: boolean | undefined;
  await act(async () => { ok = await result.current.addSport('tennis'); });
  expect(ok).toBe(true);
  expect(mockUpdate.updateSportsPreferences).not.toHaveBeenCalled();

  await act(async () => { await result.current.addSport('golf'); });
  expect(mockUpdate.updateSportsPreferences).toHaveBeenLastCalledWith(['tennis', 'golf']);
  expect(result.current.sportsPreferences).toEqual(['tennis', 'golf']);
  expect(mockProfile.refetch).toHaveBeenCalledTimes(1);

  await act(async () => { await result.current.removeSport('tennis'); });
  expect(result.current.sportsPreferences).toEqual(['golf']);

  await act(async () => { await result.current.toggleSport('golf'); });
  expect(result.current.sportsPreferences).toEqual([]);
  await act(async () => { await result.current.toggleSport('padel'); });
  expect(result.current.sportsPreferences).toEqual(['padel']);
});

it('ne change rien si la mise à jour échoue', async () => {
  mockProfile.data = { sports_preferences: ['tennis'] };
  mockUpdate.updateSportsPreferences.mockResolvedValue(false);
  const { result } = renderHook(() => useSportsPreferences());
  let ok: boolean | undefined;
  await act(async () => { ok = await result.current.updatePreferences(['golf']); });
  expect(ok).toBe(false);
  expect(result.current.sportsPreferences).toEqual(['tennis']);
  expect(mockProfile.refetch).not.toHaveBeenCalled();
});
