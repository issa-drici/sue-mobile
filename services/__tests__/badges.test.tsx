/**
 * Badges : les miens ou ceux d'un autre joueur, marquage « vus », rechargement à la demande.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { baseApiService } from '../api/baseApi';
import { fetchBadges, markBadgesSeen, useBadges } from '../badges';

jest.mock('../api/baseApi', () => ({ baseApiService: { get: jest.fn(), post: jest.fn() } }));
const api = baseApiService as unknown as { get: jest.Mock; post: jest.Mock };

const badge = (id: string) => ({ id, name: id, description: '', unlocked: false, unlockedAt: null, progress: 0, target: 1 });

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe('fetchBadges', () => {
  it('mes badges ou ceux d’un joueur, tableau vide par défaut', async () => {
    api.get.mockResolvedValueOnce({ data: [badge('a')] });
    await expect(fetchBadges()).resolves.toEqual([badge('a')]);
    expect(api.get).toHaveBeenLastCalledWith('/badges');
    api.get.mockResolvedValueOnce({});
    await expect(fetchBadges('u2')).resolves.toEqual([]);
    expect(api.get).toHaveBeenLastCalledWith('/users/u2/badges');
  });
});

it('markBadgesSeen envoie les identifiants', async () => {
  api.post.mockResolvedValueOnce({ ok: true });
  await expect(markBadgesSeen(['a', 'b'])).resolves.toEqual({ ok: true });
  expect(api.post).toHaveBeenCalledWith('/badges/seen', { badgeIds: ['a', 'b'] });
});

describe('useBadges', () => {
  it('null pendant le chargement, puis les badges ; rechargés quand refreshKey change', async () => {
    api.get.mockResolvedValue({ data: [badge('a')] });
    const { result, rerender } = renderHook(({ key }: { key: number }) => useBadges('u1', key), { initialProps: { key: 1 } });
    expect(result.current.badges).toBeNull();
    await waitFor(() => expect(result.current.badges).toEqual([badge('a')]));
    expect(api.get).toHaveBeenCalledWith('/users/u1/badges');
    rerender({ key: 2 });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    await act(async () => { result.current.reload(); });
    expect(api.get).toHaveBeenCalledTimes(3);
  });

  it('erreur → liste vide', async () => {
    api.get.mockRejectedValueOnce(new Error('panne'));
    const { result } = renderHook(() => useBadges());
    await waitFor(() => expect(result.current.badges).toEqual([]));
    expect(api.get).toHaveBeenCalledWith('/badges');
  });
});
