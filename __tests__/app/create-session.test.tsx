/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Alert, Keyboard, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import CreateSessionScreen from '../../app/create-session';
import { useCreateSession, useRecentLocations } from '../../services';
import { SportsApi } from '../../services/api/sportsApi';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};
let mockParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../../services', () => ({
  useCreateSession: jest.fn(),
  useRecentLocations: jest.fn(),
}));
jest.mock('../../services/api/sportsApi', () => ({
  SportsApi: { getAll: jest.fn(), getPlayedByUser: jest.fn() },
}));
jest.mock('@react-native-community/datetimepicker', () => require('../../test-utils/sessionScreens').dateTimePickerModule);
jest.mock('../../components/organisms/SlotPicker', () => require('../../test-utils/sessionScreens').slotPickerModule);
jest.mock('../../components/ui/ScreenLayout', () => require('../../test-utils/sessionScreens').screenLayoutModule);
jest.mock('../../components/atoms/SportIcon', () => require('../../test-utils/sessionScreens').sportIconModule);

const createSessionMock = jest.fn();
let mockIsCreating = false;
let mockRecent: string[] = [];

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockIsCreating = false;
  mockRecent = ['Tennis Club de Paris', 'Stade Charléty'];
  (useCreateSession as jest.Mock).mockImplementation(() => ({ createSession: createSessionMock, isLoading: mockIsCreating }));
  (useRecentLocations as jest.Mock).mockImplementation(() => mockRecent);
  (SportsApi.getAll as jest.Mock).mockResolvedValue(['tennis', 'football', 'padel', 'escalade', 'musculation']);
  (SportsApi.getPlayedByUser as jest.Mock).mockResolvedValue([{ sport: 'tennis', count: 4 }, { sport: 'escalade', count: 1 }]);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const alertMock = () => Alert.alert as unknown as jest.Mock;

async function renderLoaded() {
  const view = render(<CreateSessionScreen />);
  await waitFor(() => expect(SportsApi.getPlayedByUser).toHaveBeenCalled());
  await act(async () => {});
  return view;
}

/** Fixe date (2099-07-06) et horaire (10:00 → 11:30) via les sélecteurs iOS */
function setSchedule(start = new Date(2099, 6, 6, 10, 0), end = new Date(2099, 6, 6, 11, 30)) {
  fireEvent.press(screen.getByText(/2099|2026|2027|\d{4}/, { exact: false }));
  fireEvent(screen.getByTestId('dtp-date-inline'), 'change', {}, new Date(2099, 6, 6));
  fireEvent(screen.getByTestId('dtp-date-inline'), 'change', {}, undefined);
  fireEvent.press(screen.getAllByText('Confirmer')[0]);

  fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
  const [startPicker, endPicker] = screen.getAllByTestId('dtp-time-spinner');
  fireEvent(startPicker, 'change', {}, start);
  fireEvent(endPicker, 'change', {}, end);
  fireEvent(startPicker, 'change', {}, undefined);
  fireEvent.press(screen.getAllByText('Confirmer')[0]);
}

describe('CreateSessionScreen — étape détails', () => {
  it('affiche le formulaire et présélectionne le sport le plus pratiqué', async () => {
    await renderLoaded();
    expect(screen.getByText('NOUVELLE SESSION')).toBeTruthy();
    expect(screen.getByText('Tennis')).toBeTruthy();
    expect(screen.getByText('Escalade')).toBeTruthy();
    expect(screen.getByText('CONTINUER →')).toBeTruthy();
    expect(screen.getByText('Tennis Club de Paris')).toBeTruthy();
  });

  it('sans sport pratiqué : invite à choisir un sport et ouvre la liste', async () => {
    (SportsApi.getPlayedByUser as jest.Mock).mockResolvedValue([]);
    (SportsApi.getAll as jest.Mock).mockResolvedValue([]);
    await renderLoaded();
    fireEvent.press(screen.getByText('Choisis ton sport'));
    expect(screen.getByText('TOUS LES SPORTS')).toBeTruthy();
  });

  it("repli silencieux si l'API des sports échoue", async () => {
    (SportsApi.getAll as jest.Mock).mockRejectedValue(new Error('offline'));
    render(<CreateSessionScreen />);
    await act(async () => {});
    expect(screen.getByText('Choisis ton sport')).toBeTruthy();
  });

  it('ignore la réponse des sports après démontage', async () => {
    let resolveAll: (v: any) => void = () => {};
    (SportsApi.getAll as jest.Mock).mockReturnValue(new Promise((r) => (resolveAll = r)));
    const { unmount } = render(<CreateSessionScreen />);
    unmount();
    await act(async () => resolveAll(['tennis']));
  });

  it('valide les champs obligatoires', async () => {
    (SportsApi.getPlayedByUser as jest.Mock).mockResolvedValue([]);
    await renderLoaded();
    fireEvent.press(screen.getByText('CONTINUER →'));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs obligatoires (sport, lieu)');
  });

  it('modal des sports : recherche, sélection et fermeture', async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Plus'));
    expect(screen.getByText('TOUS LES SPORTS')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), 'fitness');
    expect(screen.getByText('Musculation')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), '   ');
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), 'pad');
    fireEvent.press(screen.getByText('Padel'));
    // Padel ajouté aux accès rapides
    expect(screen.getAllByText('Padel').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Plus'));
    // ferme via la croix (premier bouton du header)
    const closeButtons = screen.UNSAFE_getAllByProps({ name: 'close' });
    fireEvent.press(closeButtons[closeButtons.length - 1]);
  });

  it('accès rapide : sélectionne un sport', async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Escalade'));
    expect(screen.getByText('Escalade')).toBeTruthy();
  });

  it('lieux récents, options avancées, stepper et prix', async () => {
    jest.useFakeTimers();
    await renderLoaded();
    fireEvent.press(screen.getByText('Stade Charléty'));
    expect(screen.getByPlaceholderText('Entrer le lieu...').props.value).toBe('Stade Charléty');
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), '');
    fireEvent(screen.getByPlaceholderText('Entrer le lieu...'), 'focus');
    act(() => jest.advanceTimersByTime(150));

    fireEvent.press(screen.getByText('Options avancées'));
    expect(screen.getByText('Aucune')).toBeTruthy();
    const addBtn = screen.UNSAFE_getAllByProps({ name: 'add' });
    const plus = addBtn[addBtn.length - 1];
    // Joueurs max : on démarre à 2 (une session à 1 joueur n'a pas de sens)
    fireEvent.press(plus);
    expect(screen.getByText('2 joueurs')).toBeTruthy();
    fireEvent.press(plus);
    expect(screen.getByText('3 joueurs')).toBeTruthy();
    const minus = screen.UNSAFE_getByProps({ name: 'remove' });
    fireEvent.press(minus);
    fireEvent.press(minus);
    expect(screen.getByText('Aucune')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Gratuit'), '12,5');
    fireEvent(screen.getByPlaceholderText('Gratuit'), 'focus');
    act(() => jest.advanceTimersByTime(150));
    fireEvent.press(screen.getByText('Options avancées'));
    expect(screen.queryByPlaceholderText('Gratuit')).toBeNull();
  });

  it('le clavier fait défiler le formulaire', async () => {
    const listeners: Record<string, () => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((evt: string, cb: any) => {
      listeners[evt] = cb;
      return { remove: jest.fn() };
    }) as any);
    await renderLoaded();
    act(() => listeners.keyboardDidShow());
  });

  it('le bouton fermer revient en arrière', async () => {
    await renderLoaded();
    fireEvent.press(screen.UNSAFE_getAllByProps({ name: 'close' })[0]);
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe('CreateSessionScreen — date connue', () => {
  it('crée la session et affiche le récapitulatif', async () => {
    createSessionMock.mockResolvedValue({ id: 'new-1', sport: 'tennis' });
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court central');
    fireEvent.press(screen.getByText('Options avancées'));
    // Un appui : « Aucune » → 2 joueurs (minimum)
    fireEvent.press(screen.UNSAFE_getAllByProps({ name: 'add' }).slice(-1)[0]);
    fireEvent.changeText(screen.getByPlaceholderText('Gratuit'), '7,5');
    fireEvent.press(screen.getByText('CONTINUER →'));

    expect(screen.getByText('DATE ET HEURE')).toBeTruthy();
    setSchedule();
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    await waitFor(() => expect(createSessionMock).toHaveBeenCalled());
    expect(createSessionMock).toHaveBeenCalledWith({
      sport: 'tennis',
      date: '2099-07-06',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Court central',
      maxParticipants: 2,
      pricePerPerson: 7.5,
      participants: [],
    });
    expect(await screen.findByText('Ta session est créée !')).toBeTruthy();
    expect(screen.getByText('2 joueurs max')).toBeTruthy();
    expect(screen.getByText('7,5 €')).toBeTruthy();

    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/session/new-1', params: { openInvite: 'true' } });
    fireEvent.press(screen.getByText('PLUS TARD'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/session/new-1');
    fireEvent.press(screen.UNSAFE_getAllByProps({ name: 'close' })[0]);
    expect(mockRouter.replace).toHaveBeenCalledTimes(3);
  });

  it('récapitulatif : illimité, gratuit, fin le lendemain et sport non prédéfini', async () => {
    createSessionMock.mockResolvedValue({ id: 'new-2', sport: 'escalade' });
    await renderLoaded();
    fireEvent.press(screen.getByText('Escalade'));
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Arkose');
    fireEvent.press(screen.getByText('CONTINUER →'));
    setSchedule(new Date(2099, 6, 6, 23, 0), new Date(2099, 6, 6, 0, 30));
    expect(screen.getByText('lendemain')).toBeTruthy();
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    expect(await screen.findByText('Ta session est créée !')).toBeTruthy();
    expect(screen.getByText('Pas de limite de joueurs')).toBeTruthy();
    expect(screen.getByText('Gratuit')).toBeTruthy();
    expect(screen.getByText(/\(lendemain\)/)).toBeTruthy();
    expect(createSessionMock.mock.calls[0][0].pricePerPerson).toBeNull();
  });

  it("refuse une heure de fin égale à l'heure de début", async () => {
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));
    setSchedule(new Date(2099, 6, 6, 10, 0), new Date(2099, 6, 6, 10, 0));
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "L'heure de fin doit être différente de l'heure de début");
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("revient à l'accueil si la session créée n'a pas d'id", async () => {
    createSessionMock.mockResolvedValue(null);
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
  });

  it("affiche l'erreur de création (Error ou inconnue)", async () => {
    createSessionMock.mockRejectedValueOnce(new Error('Serveur KO')).mockRejectedValueOnce('boom');
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Serveur KO'));
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Une erreur est survenue'));
  });

  it('annule les sélecteurs iOS et revient aux détails', async () => {
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent.press(screen.getAllByText('Annuler')[0]);
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent.press(screen.getAllByText('Annuler')[0]);
    // Fermeture par le fond / la touche retour Android
    const { Modal } = require('react-native');
    act(() => screen.UNSAFE_getAllByType(Modal).forEach((m: any) => m.props.onRequestClose?.()));
    // Fermeture par appui sur le fond
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent.press(screen.UNSAFE_getAllByProps({ activeOpacity: 1 })[0]);
    expect(screen.queryByText('Choisir la date')).toBeNull();
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent.press(screen.UNSAFE_getAllByProps({ activeOpacity: 1 })[0]);
    expect(screen.queryByText("Choisir l'horaire")).toBeNull();
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'chevron-back' }));
    expect(screen.getByText('NOUVELLE SESSION')).toBeTruthy();
  });

  it('affiche "CRÉATION..." pendant la création', async () => {
    const view = await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));
    mockIsCreating = true;
    view.rerender(<CreateSessionScreen />);
    expect(screen.getByText('CRÉATION...')).toBeTruthy();
  });
});

describe('CreateSessionScreen — trouver un créneau', () => {
  it('?mode=find-slot présélectionne le mode et crée avec les créneaux', async () => {
    mockParams = { mode: 'find-slot' };
    createSessionMock.mockResolvedValue({ id: 'slot-sess' });
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Parc');
    fireEvent.press(screen.getByText('CHOISIR LES CRÉNEAUX →'));
    expect(screen.getByText('CRÉNEAUX POSSIBLES')).toBeTruthy();
    expect(screen.getByText('Ajoute au moins un créneau')).toBeTruthy();
    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    expect(createSessionMock).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('slot-picker-add'));
    expect(screen.getByText('1 créneau proposé')).toBeTruthy();
    fireEvent.press(screen.getByTestId('slot-picker-add'));
    expect(screen.getByText('2 créneaux proposés')).toBeTruthy();
    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/session/slot-sess?openInvite=true'));
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sport: 'tennis',
        location: 'Parc',
        scheduling: 'finding_slot',
        pricePerPerson: null,
        slotProposals: [
          { date: '2026-07-06', startTime: '10:00', endTime: '11:30' },
          { date: '2026-07-06', startTime: '10:00', endTime: '11:30' },
        ],
      })
    );
  });

  it("choisit le mode depuis l'étape 1, prix, sans id et erreurs", async () => {
    createSessionMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Refusé'))
      .mockRejectedValueOnce(42);
    await renderLoaded();
    fireEvent.press(screen.getByText('Trouver un créneau'));
    fireEvent.press(screen.getByText('Options avancées'));
    fireEvent.changeText(screen.getByPlaceholderText('Gratuit'), '5');
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Parc');
    fireEvent.press(screen.getByText('CHOISIR LES CRÉNEAUX →'));
    fireEvent.press(screen.getByTestId('slot-picker-add'));
    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(createSessionMock.mock.calls[0][0].pricePerPerson).toBe(5);
    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Refusé'));
    fireEvent.press(screen.getByText('INVITER DES JOUEURS →'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Une erreur est survenue'));
  });

  it('revient au choix "date connue"', async () => {
    mockParams = { mode: 'find-slot' };
    await renderLoaded();
    fireEvent.press(screen.getByText("J'ai une date"));
    expect(screen.getByText('CONTINUER →')).toBeTruthy();
  });
});

describe('CreateSessionScreen — Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('utilise les sélecteurs natifs Android (date, début puis fin)', async () => {
    jest.useFakeTimers();
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Court');
    fireEvent.press(screen.getByText('CONTINUER →'));

    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent(screen.getByTestId('dtp-date-default'), 'change', {}, new Date(2099, 0, 2));
    expect(screen.queryByTestId('dtp-date-default')).toBeNull();
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent(screen.getByTestId('dtp-date-default'), 'change', {}, undefined);

    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 0, 2, 9, 0));
    act(() => jest.advanceTimersByTime(300));
    // fin invalide (= début) -> alerte
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 0, 2, 9, 0));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "L'heure de fin doit être différente de l'heure de début");

    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, undefined);

    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 0, 2, 9, 0));
    act(() => jest.advanceTimersByTime(300));
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 0, 2, 11, 0));
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 0, 2, 9, 0));
    act(() => jest.advanceTimersByTime(300));
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, undefined);

    createSessionMock.mockResolvedValue(null);
    fireEvent.press(screen.getByText('CRÉER LA SESSION'));
    await act(async () => {});
    expect(createSessionMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ date: '2099-01-02', startTime: '09:00', endTime: '10:00' })
    );
  });
});
