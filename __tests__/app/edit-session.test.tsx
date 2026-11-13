/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Alert, Keyboard, Modal, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import EditSessionScreen from '../../app/edit-session/[id]';
import { useGetSessionById, useUpdateSession } from '../../services';
import { SportsApi } from '../../services/api/sportsApi';
import { makeSportSession } from '../../test-utils/sessionScreens';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, any> = { id: 's-1' };
let mockUser: any = { id: 'org-1', firstname: 'Marc' };

let mockNavState: any = { index: 0, routes: [{ name: 'edit-session/[id]' }] };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ getState: () => mockNavState }) }));

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../../app/context/auth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services', () => ({ useGetSessionById: jest.fn(), useUpdateSession: jest.fn() }));
jest.mock('../../services/api/sportsApi', () => ({
  SportsApi: { getAll: jest.fn(), getPlayedByUser: jest.fn() },
}));
jest.mock('@react-native-community/datetimepicker', () => require('../../test-utils/sessionScreens').dateTimePickerModule);
jest.mock('../../components/ui/ScreenLayout', () => require('../../test-utils/sessionScreens').screenLayoutModule);
jest.mock('../../components/atoms/SportIcon', () => require('../../test-utils/sessionScreens').sportIconModule);
jest.mock('../../components/OptimizedLoading', () => require('../../test-utils/sessionScreens').inlineLoadingModule);

const getSessionByIdMock = jest.fn();
const updateSessionMock = jest.fn();
let mockSession: any;
let mockLoading = false;
let mockUpdating = false;

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 's-1' };
  mockUser = { id: 'org-1', firstname: 'Marc' };
  mockSession = makeSportSession({ maxParticipants: 4, pricePerPerson: 10 });
  mockLoading = false;
  mockUpdating = false;
  (useGetSessionById as jest.Mock).mockImplementation(() => ({
    data: mockSession,
    getSessionById: getSessionByIdMock,
    isLoading: mockLoading,
  }));
  (useUpdateSession as jest.Mock).mockImplementation(() => ({ updateSession: updateSessionMock, isLoading: mockUpdating }));
  (SportsApi.getAll as jest.Mock).mockResolvedValue(['tennis', 'football', 'padel', 'escalade']);
  (SportsApi.getPlayedByUser as jest.Mock).mockResolvedValue([{ sport: 'football' }, { sport: 'padel' }]);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const alertMock = () => Alert.alert as unknown as jest.Mock;

async function renderLoaded() {
  const view = render(<EditSessionScreen />);
  await act(async () => {});
  return view;
}

function setSchedule(start: Date, end: Date) {
  fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
  fireEvent(screen.getByTestId('dtp-date-inline'), 'change', {}, new Date(2099, 7, 15));
  fireEvent(screen.getByTestId('dtp-date-inline'), 'change', {}, undefined);
  fireEvent.press(screen.getByText('Confirmer'));
  fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
  const [startPicker, endPicker] = screen.getAllByTestId('dtp-time-spinner');
  fireEvent(startPicker, 'change', {}, start);
  fireEvent(endPicker, 'change', {}, end);
  fireEvent(endPicker, 'change', {}, undefined);
  fireEvent.press(screen.getByText('Confirmer'));
}

describe('EditSessionScreen', () => {
  it('affiche le chargement tant que la session est absente', async () => {
    mockSession = null;
    await renderLoaded();
    expect(screen.getByText('Chargement de la session...')).toBeTruthy();
    expect(getSessionByIdMock).toHaveBeenCalledWith('s-1');
  });

  it('affiche le chargement pendant isLoading', async () => {
    mockLoading = true;
    await renderLoaded();
    expect(screen.getByText('Chargement de la session...')).toBeTruthy();
  });

  it("ne charge rien sans id valide", async () => {
    mockParams = { id: ['a', 'b'] };
    mockSession = null;
    await renderLoaded();
    expect(getSessionByIdMock).not.toHaveBeenCalled();
  });

  it('pré-remplit le formulaire depuis la session', async () => {
    await renderLoaded();
    expect(screen.getByText('MODIFIER SESSION')).toBeTruthy();
    expect(screen.getByPlaceholderText('Entrer le lieu...').props.value).toBe('Tennis Club de Paris');
    expect(screen.getByText('4 joueurs')).toBeTruthy();
    expect(screen.getByPlaceholderText('Gratuit').props.value).toBe('10');
    expect(screen.getByText('Tennis')).toBeTruthy();
    expect(screen.getByText('Football')).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
    expect(screen.getByText('19:30')).toBeTruthy();
  });

  it("corrige une heure de fin invalide et gère les champs absents", async () => {
    mockSession = makeSportSession({ startTime: '', endTime: '', maxParticipants: undefined, pricePerPerson: null });
    await renderLoaded();
    // startTime vide -> 18:00 ; endTime vide -> 20:00
    expect(screen.getByText('18:00')).toBeTruthy();
    expect(screen.getByText('20:00')).toBeTruthy();
    expect(screen.getByText('Aucune')).toBeTruthy();
    expect(screen.getByPlaceholderText('Gratuit').props.value).toBe('');
  });

  it("remplace une fin identique au début par début + 1h", async () => {
    mockSession = makeSportSession({ startTime: '18:00:00', endTime: '18:00:00' });
    await renderLoaded();
    expect(screen.getByText('19:00')).toBeTruthy();
  });

  it("refuse l'accès à un non-organisateur", async () => {
    mockUser = { id: 'u-2' };
    await renderLoaded();
    expect(alertMock()).toHaveBeenCalledWith('Accès refusé', "Seul l'organisateur peut modifier cette session.", expect.any(Array));
    alertMock().mock.calls[0][2][0].onPress();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('enregistre les modifications puis redirige', async () => {
    updateSessionMock.mockResolvedValue({});
    await renderLoaded();
    fireEvent.press(screen.getByText('Football'));
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Five Paris');
    const add = screen.UNSAFE_getAllByProps({ name: 'add' }).slice(-1)[0];
    fireEvent.press(add);
    fireEvent.changeText(screen.getByPlaceholderText('Gratuit'), '8,5');
    setSchedule(new Date(2099, 0, 1, 20, 0), new Date(2099, 0, 1, 21, 15));
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/session/s-1'));
    expect(updateSessionMock).toHaveBeenCalledWith('s-1', {
      sport: 'football',
      date: '2099-08-15',
      startTime: '20:00',
      endTime: '21:15',
      location: 'Five Paris',
      maxParticipants: 5,
      pricePerPerson: 8.5,
    });
  });


  it('revient à la fiche (sans en empiler une seconde) quand on vient de la fiche de cette session', async () => {
    updateSessionMock.mockResolvedValue({});
    mockNavState = { index: 1, routes: [{ name: 'session/[id]', params: { id: 's-1' } }, { name: 'edit-session/[id]' }] };
    try {
      await renderLoaded();
      setSchedule(new Date(2099, 0, 1, 20, 0), new Date(2099, 0, 1, 21, 15));
      fireEvent.press(screen.getByText('ENREGISTRER →'));
      await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
      expect(mockRouter.replace).not.toHaveBeenCalled();
    } finally {
      mockNavState = { index: 0, routes: [{ name: 'edit-session/[id]' }] };
    }
  });
  it("session « trouver un créneau » : pas de date envoyée", async () => {
    mockSession = makeSportSession({ scheduling: 'finding_slot', pricePerPerson: null });
    updateSessionMock.mockResolvedValue({});
    await renderLoaded();
    expect(screen.getByText('À définir : confirme un créneau depuis la session')).toBeTruthy();
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    await waitFor(() => expect(updateSessionMock).toHaveBeenCalled());
    expect(updateSessionMock.mock.calls[0][1]).toEqual({
      sport: 'tennis',
      location: 'Tennis Club de Paris',
      maxParticipants: null,
      pricePerPerson: null,
    });
  });

  it('valide les champs obligatoires et la cohérence des heures', async () => {
    await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), '  ');
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs obligatoires (sport, lieu)');
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Club');
    setSchedule(new Date(2099, 0, 1, 20, 0), new Date(2099, 0, 1, 20, 0));
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "L'heure de fin doit être différente de l'heure de début");
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("affiche l'erreur de mise à jour (Error ou inconnue)", async () => {
    updateSessionMock.mockRejectedValueOnce(new Error('Interdit')).mockRejectedValueOnce('x');
    await renderLoaded();
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Interdit'));
    fireEvent.press(screen.getByText('ENREGISTRER →'));
    await waitFor(() => expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Une erreur est survenue'));
  });

  it('affiche "MISE À JOUR..." pendant l\'enregistrement', async () => {
    mockUpdating = true;
    await renderLoaded();
    expect(screen.getByText('MISE À JOUR...')).toBeTruthy();
  });

  it('stepper, options avancées, fermeture et fin le lendemain', async () => {
    jest.useFakeTimers();
    mockSession = makeSportSession({ maxParticipants: 3, startTime: '23:00', endTime: '00:30' });
    await renderLoaded();
    expect(screen.getByText('lendemain')).toBeTruthy();
    const minus = screen.UNSAFE_getByProps({ name: 'remove' });
    fireEvent.press(minus);
    expect(screen.getByText('2 joueurs')).toBeTruthy();
    // Pas de session à 1 joueur : depuis 2, on repasse à « Aucune » limite
    fireEvent.press(minus);
    expect(screen.getByText('Aucune')).toBeTruthy();
    fireEvent.press(minus);
    fireEvent.press(screen.UNSAFE_getAllByProps({ name: 'add' }).slice(-1)[0]);
    expect(screen.getByText('2 joueurs')).toBeTruthy();
    fireEvent(screen.getByPlaceholderText('Entrer le lieu...'), 'focus');
    fireEvent(screen.getByPlaceholderText('Gratuit'), 'focus');
    act(() => jest.advanceTimersByTime(200));
    fireEvent.press(screen.getByText('Options avancées'));
    expect(screen.queryByPlaceholderText('Gratuit')).toBeNull();
    fireEvent.press(screen.UNSAFE_getAllByProps({ name: 'close' })[0]);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('modal des sports : recherche et sélection', async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Plus'));
    expect(screen.getByText('TOUS LES SPORTS')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), 'esca');
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), ' ');
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un sport'), 'esca');
    fireEvent.press(screen.getByText('Escalade'));
    expect(screen.queryByText('TOUS LES SPORTS')).toBeNull();
    expect(screen.getByText('Escalade')).toBeTruthy();
    fireEvent.press(screen.getByText('Plus'));
    const closes = screen.UNSAFE_getAllByProps({ name: 'close' });
    fireEvent.press(closes[closes.length - 1]);
    expect(screen.queryByText('TOUS LES SPORTS')).toBeNull();
  });

  it("sans sport pratiqué ni sport : affiche l'invite", async () => {
    (SportsApi.getPlayedByUser as jest.Mock).mockResolvedValue([]);
    (SportsApi.getAll as jest.Mock).mockResolvedValue([]);
    mockSession = makeSportSession({ sport: '' as any });
    await renderLoaded();
    expect(screen.getByText('Choisis ton sport')).toBeTruthy();
  });

  it("repli silencieux si l'API des sports échoue, et réponse ignorée après démontage", async () => {
    (SportsApi.getAll as jest.Mock).mockRejectedValueOnce(new Error('x'));
    const first = render(<EditSessionScreen />);
    await act(async () => {});
    first.unmount();
    let resolveAll: (v: any) => void = () => {};
    (SportsApi.getAll as jest.Mock).mockReturnValueOnce(new Promise((r) => (resolveAll = r)));
    const second = render(<EditSessionScreen />);
    second.unmount();
    await act(async () => resolveAll(['tennis']));
  });

  it('sélecteurs iOS : annuler, fond et onRequestClose', async () => {
    await renderLoaded();
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent.press(screen.getByText('Annuler'));
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent.press(screen.UNSAFE_getAllByProps({ activeOpacity: 1 })[0]);
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent.press(screen.getByText('Annuler'));
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent.press(screen.UNSAFE_getAllByProps({ activeOpacity: 1 })[0]);
    act(() => screen.UNSAFE_getAllByType(Modal).forEach((m: any) => m.props.onRequestClose?.()));
    expect(screen.queryByText('Choisir la date')).toBeNull();
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

  it("ne réinitialise pas le formulaire lors d'un rafraîchissement de la même session", async () => {
    const view = await renderLoaded();
    fireEvent.changeText(screen.getByPlaceholderText('Entrer le lieu...'), 'Modifié');
    mockSession = { ...mockSession, location: 'Serveur' };
    view.rerender(<EditSessionScreen />);
    expect(screen.getByPlaceholderText('Entrer le lieu...').props.value).toBe('Modifié');
  });
});

describe('EditSessionScreen — Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('sélecteurs natifs : date, début (ajuste la fin) puis fin', async () => {
    jest.useFakeTimers();
    updateSessionMock.mockResolvedValue({});
    await renderLoaded();
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent(screen.getByTestId('dtp-date-default'), 'change', {}, new Date(2099, 1, 3));
    fireEvent.press(screen.getAllByText(/\d{4}/)[0]);
    fireEvent(screen.getByTestId('dtp-date-default'), 'change', {}, undefined);

    // début 19:30 = fin actuelle -> fin recalculée à 20:30
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 1, 3, 19, 30));
    expect(screen.getByText('20:30')).toBeTruthy();
    act(() => jest.advanceTimersByTime(300));
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 1, 3, 19, 30));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "L'heure de fin doit être différente de l'heure de début");

    // début valide : la fin est gardée
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 1, 3, 17, 0));
    expect(screen.getByText('20:30')).toBeTruthy();
    act(() => jest.advanceTimersByTime(300));
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 1, 3, 18, 45));

    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, undefined);
    fireEvent.press(screen.getAllByText(/\d{2}:\d{2}/)[0]);
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, new Date(2099, 1, 3, 17, 0));
    act(() => jest.advanceTimersByTime(300));
    fireEvent(screen.getByTestId('dtp-time-default'), 'change', {}, undefined);

    fireEvent.press(screen.getByText('ENREGISTRER →'));
    await act(async () => {});
    expect(updateSessionMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ date: '2099-02-03', startTime: '17:00', endTime: '18:45' })
    );
  });
});
