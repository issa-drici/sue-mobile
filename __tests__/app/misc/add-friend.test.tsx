import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, Linking, Platform, SectionList, Share } from 'react-native';

import AddFriendScreen from '../../../app/add-friend';
import { mockRouter, pressAlertButton, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockState = {
  search: {} as any,
  send: {} as any,
  cancel: {} as any,
};
jest.mock('../../../services', () => ({
  useSearchUsers: () => mockState.search,
  useSendFriendRequest: () => mockState.send,
  useCancelFriendRequest: () => mockState.cancel,
}));
jest.mock('../../../services/api/usersApi', () => ({ UsersApi: { checkContacts: jest.fn() } }));
jest.mock('../../../services/friends/contactsService', () => ({ contactsService: { getAllContacts: jest.fn() } }));
jest.mock('../../../components/UserProfileModal', () => {
  const { Text, View } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, onClose, userId }: any) =>
      visible ? (
        <View>
          <Text>{`profile:${userId}`}</Text>
          <Text onPress={onClose}>fermer-profil</Text>
        </View>
      ) : null,
  };
});

const { UsersApi } = jest.requireMock('../../../services/api/usersApi');
const { contactsService } = jest.requireMock('../../../services/friends/contactsService');

const evt = { stopPropagation: jest.fn() };

const localContacts = () => [
  { id: 'c1', name: 'Zoé Martin', phoneNumbers: ['06 11 22 33 44'] },
  { id: 'c2', name: 'Albert', phoneNumbers: ['0699887766'] },
  { id: 'c3', name: '', phoneNumbers: ['+33 7 00 00 00 01'] },
  { id: 'c4', name: 'Bob', phoneNumbers: [] },
  { id: 'c5', name: 'Dup', phoneNumbers: ['0611223344', '33612121212', 'abc'] },
];

const found = () => [
  { isRegistered: true, phoneNumber: '+33611223344', user: { id: 'u10', firstname: 'Zoé', lastname: 'M', relationship: { isFriend: false } } },
  { isRegistered: true, user: { id: 'u11', firstname: 'Yann', phoneNumber: '33612121212', hasPendingRequest: true } },
  { isRegistered: true, user: { id: 'u12', lastname: 'Nom', relationship: { isFriend: true } } },
  { isRegistered: false, phoneNumber: '+33699887766' },
];

describe('AddFriendScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    silenceConsole();
    resetRouter();
    evt.stopPropagation.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockState.search = { data: [], searchUsers: jest.fn(() => Promise.resolve()), isLoading: false };
    mockState.send = { sendFriendRequest: jest.fn(() => Promise.resolve()), isLoading: false };
    mockState.cancel = { cancelFriendRequest: jest.fn(() => Promise.resolve()), isLoading: false };
    contactsService.getAllContacts.mockReset().mockResolvedValue(localContacts());
    UsersApi.checkContacts.mockReset().mockResolvedValue({ found: found() });
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderLoaded = async () => {
    render(<AddFriendScreen />);
    await act(async () => {});
  };

  const typeSearch = async (q: string) => {
    fireEvent.changeText(screen.getByPlaceholderText('NOM OU EMAIL...'), q);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
  };

  it('affiche le chargement des contacts', () => {
    contactsService.getAllContacts.mockReturnValue(new Promise(() => {}));
    render(<AddFriendScreen />);
    expect(screen.getByText('CHARGEMENT CONTACTS...')).toBeTruthy();
  });

  it('classe les contacts : sur Sue et à inviter (triés), en excluant ceux déjà inscrits', async () => {
    await renderLoaded();
    expect(UsersApi.checkContacts).toHaveBeenCalledWith([
      '06 11 22 33 44', '0699887766', '+33 7 00 00 00 01', '0611223344', '33612121212', 'abc',
    ]);
    expect(screen.getByText('SUR SUE')).toBeTruthy();
    expect(screen.getByText('INVITEZ VOS CONTACTS')).toBeTruthy();
    // Nom du contact local prioritaire
    expect(screen.getByText('ZOÉ MARTIN')).toBeTruthy();
    expect(screen.getByText('Zoé M')).toBeTruthy();
    // Yann est rattaché au contact local "Dup" via son numéro 33… normalisé
    expect(screen.getByText('DUP')).toBeTruthy();
    expect(screen.getByText('Yann')).toBeTruthy();
    // Sans prénom : "Athlète" en titre, le nom de famille en sous-titre
    expect(screen.getByText('ATHLÈTE')).toBeTruthy();
    expect(screen.getByText('Nom')).toBeTruthy();
    // Contacts à inviter : Zoé (c1) et Dup (c5) sont exclus car inscrits
    expect(screen.getAllByText('DUP')).toHaveLength(1);
    expect(screen.getByText('ALBERT')).toBeTruthy();
    expect(screen.getByText('BOB')).toBeTruthy();
    expect(screen.getByText('INCONNU')).toBeTruthy();
    const names = screen.getAllByText(/^(ALBERT|BOB|INCONNU)$/).map((n) => n.props.children);
    expect(names).toEqual(['INCONNU', 'ALBERT', 'BOB']);
  });

  it.each([
    ['tableau direct', () => found()],
    ['clé data', () => ({ data: found() })],
  ])('accepte une réponse API en %s', async (_l, response) => {
    UsersApi.checkContacts.mockResolvedValue(response());
    await renderLoaded();
    expect(screen.getByText('SUR SUE')).toBeTruthy();
  });

  it('ignore une réponse API inconnue', async () => {
    UsersApi.checkContacts.mockResolvedValue({ autre: true });
    await renderLoaded();
    expect(screen.queryByText('SUR SUE')).toBeNull();
    expect(screen.getByText('ZOÉ MARTIN')).toBeTruthy();
  });

  it("propose tous les contacts sans appel API quand aucun n'a de numéro", async () => {
    contactsService.getAllContacts.mockResolvedValue([{ id: 'x', name: 'Sans', phoneNumbers: [] }]);
    await renderLoaded();
    expect(UsersApi.checkContacts).not.toHaveBeenCalled();
    expect(screen.getByText('SANS')).toBeTruthy();
  });

  it("affiche les contacts locaux si l'API échoue", async () => {
    UsersApi.checkContacts.mockRejectedValue(new Error('api'));
    await renderLoaded();
    expect(screen.queryByText('SUR SUE')).toBeNull();
    expect(screen.getByText('ZOÉ MARTIN')).toBeTruthy();
  });

  it('affiche l’état vide si même les contacts locaux échouent', async () => {
    contactsService.getAllContacts.mockRejectedValue(new Error('perm'));
    await renderLoaded();
    expect(screen.getByText('CHERCHER UN AMI')).toBeTruthy();
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('revient en arrière et partage l’app', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
    await renderLoaded();
    fireEvent.press(screen.getByTestId('add-friend-back'));
    expect(mockRouter.back).toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByTestId('add-friend-share'));
    });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Rejoins nous sur SUE' }));
  });

  it('journalise une erreur de partage', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('x'));
    await renderLoaded();
    await act(async () => {
      fireEvent.press(screen.getByTestId('add-friend-share'));
    });
    expect(console.error).toHaveBeenCalledWith('Error sharing:', expect.any(Error));
  });

  describe('invitation par SMS', () => {
    it('ouvre l’app SMS quand c’est possible', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      await renderLoaded();
      await act(async () => {
        fireEvent.press(screen.getAllByText('INVITER')[1]);
      });
      expect(open).toHaveBeenCalledWith(expect.stringMatching(/^sms:0699887766\?body=/));
    });

    it('utilise le partage sinon, et un numéro vide pour un contact sans numéro', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
      await renderLoaded();
      await act(async () => {
        fireEvent.press(screen.getAllByText('INVITER')[2]);
      });
      expect(Linking.canOpenURL).toHaveBeenCalledWith(expect.stringMatching(/^sms:\?body=/));
      expect(share).toHaveBeenCalled();
    });

    it('alerte en cas d’échec', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('x'));
      await renderLoaded();
      await act(async () => {
        fireEvent.press(screen.getAllByText('INVITER')[0]);
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', expect.stringContaining("Impossible d'ouvrir l'application SMS"));
    });
  });

  describe('demandes d’ami depuis les contacts', () => {
    it('envoie une demande et passe en attente', async () => {
      await renderLoaded();
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-request-u10'), evt);
      });
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(mockState.send.sendFriendRequest).toHaveBeenCalledWith('u10');
      expect(alertSpy).toHaveBeenCalledWith('Succès', 'Demande envoyée à Zoé Martin');
      expect(screen.getByTestId('cancel-request-u10')).toBeTruthy();
    });

    it("annule l'état en attente si l'envoi échoue (message API puis par défaut)", async () => {
      mockState.send.sendFriendRequest.mockRejectedValueOnce(new Error('Limite'));
      await renderLoaded();
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-request-u10'), evt);
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Limite');
      expect(screen.getByTestId('add-request-u10')).toBeTruthy();

      mockState.send.sendFriendRequest.mockRejectedValueOnce({});
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-request-u10'), evt);
      });
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer la demande");
    });

    it('annule une demande après confirmation', async () => {
      await renderLoaded();
      fireEvent.press(screen.getByTestId('cancel-request-u11'), evt);
      expect(alertSpy).toHaveBeenCalledWith(
        'Annuler la demande',
        "Voulez-vous annuler la demande d'ami envoyée à Dup ?",
        expect.any(Array)
      );
      await pressAlertButton(alertSpy, 'Oui, annuler');
      expect(mockState.cancel.cancelFriendRequest).toHaveBeenCalledWith('u11');
      expect(alertSpy).toHaveBeenLastCalledWith('Succès', "Demande d'ami annulée");
      expect(screen.getByTestId('add-request-u11')).toBeTruthy();
    });

    it("rétablit l'attente si l'annulation échoue (message API puis par défaut)", async () => {
      mockState.cancel.cancelFriendRequest.mockRejectedValueOnce(new Error('Non'));
      await renderLoaded();
      fireEvent.press(screen.getByTestId('cancel-request-u11'), evt);
      await pressAlertButton(alertSpy, 'Oui, annuler');
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', 'Non');
      expect(screen.getByTestId('cancel-request-u11')).toBeTruthy();

      mockState.cancel.cancelFriendRequest.mockRejectedValueOnce({});
      fireEvent.press(screen.getByTestId('cancel-request-u11'), evt);
      await pressAlertButton(alertSpy, 'Oui, annuler');
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Impossible d'annuler la demande");
    });

    it('ouvre et ferme le profil d’un utilisateur', async () => {
      await renderLoaded();
      fireEvent.press(screen.getByText('DUP'));
      expect(screen.getByText('profile:u11')).toBeTruthy();
      fireEvent.press(screen.getByText('fermer-profil'));
      expect(screen.queryByText('profile:u11')).toBeNull();
    });
  });

  describe('recherche', () => {
    const backend = () => [
      { id: 'u10', firstname: 'Zoé', lastname: 'M' }, // doublon d'un contact : masqué
      { id: 'u20', firstname: 'Zorro', lastname: 'X', relationship: { isFriend: true } },
      { user: { id: 'u30', firstname: 'Zack', lastname: 'Z', hasPendingRequest: true } },
      { id: 'u40', email: 'zo@x.fr', avatar: 'https://x/a.png' },
      { id: 'u50', name: 'Zozo' },
      { id: ' ' },
    ];

    it('ne cherche pas en dessous de 2 caractères', async () => {
      await renderLoaded();
      await typeSearch('z');
      expect(mockState.search.searchUsers).not.toHaveBeenCalled();
      expect(screen.getByText('SUR SUE')).toBeTruthy();
    });

    it('cherche après 300 ms et affiche contacts puis résultats sans doublon', async () => {
      mockState.search.data = backend();
      await renderLoaded();
      await typeSearch('zo');
      expect(mockState.search.searchUsers).toHaveBeenCalledWith('zo');
      expect(screen.getAllByText('MES CONTACTS')).toHaveLength(1);
      expect(screen.getByText('RÉSULTATS DE RECHERCHE')).toBeTruthy();
      expect(screen.getAllByText('ZOÉ MARTIN')).toHaveLength(1);
      expect(screen.getByText('ZORRO X')).toBeTruthy();
      expect(screen.getByText('ZACK Z')).toBeTruthy();
      expect(screen.getByText('ZO@X.FR')).toBeTruthy();
      expect(screen.getByText('ZOZO')).toBeTruthy();
      expect(screen.getByText('ATHLÈTE')).toBeTruthy();
      expect(screen.getAllByText('Utilisateur SUE').length).toBeGreaterThan(0);
      expect(screen.getByText('Zozo')).toBeTruthy();
    });

    it('filtre les contacts par nom, prénom, nom de famille, email et numéro', async () => {
      UsersApi.checkContacts.mockResolvedValue({
        found: [
          ...found(),
          { isRegistered: true, user: { id: 'u13', email: 'mail@sue.fr' } },
          { isRegistered: true, user: { id: 'u14', name: 'Pseudo' } },
        ],
      });
      await renderLoaded();
      await typeSearch('yan');
      expect(screen.getByText('Yann')).toBeTruthy();
      await typeSearch('nom');
      expect(screen.getByText('Nom')).toBeTruthy();
      await typeSearch('sue.fr');
      expect(screen.getByText('MAIL@SUE.FR')).toBeTruthy();
      await typeSearch('pseudo');
      expect(screen.getByText('PSEUDO')).toBeTruthy();
      await typeSearch('0699');
      expect(screen.getByText('ALBERT')).toBeTruthy();
      await typeSearch('m');
      await typeSearch('ma');
      // "ma" : Zoé Martin (contact local) + mail@sue.fr (email)
      expect(screen.getByText('ZOÉ MARTIN')).toBeTruthy();
      expect(screen.getByText('MAIL@SUE.FR')).toBeTruthy();
      await typeSearch('introuvable');
      expect(screen.getByText('CHERCHER UN AMI')).toBeTruthy();
    });

    it('trie les contacts trouvés et à inviter, en recherche comme en suggestions', async () => {
      contactsService.getAllContacts.mockResolvedValue([
        { id: 'a', name: 'Cyril zz', phoneNumbers: ['0600000001'] },
        { id: 'b', name: 'Anaïs zz', phoneNumbers: ['0600000002'] },
        { id: 'c', name: undefined, phoneNumbers: ['0600000003'] },
      ]);
      UsersApi.checkContacts.mockResolvedValue([
        { isRegistered: true, user: { id: 'k1', firstname: 'Karl', lastname: 'zz' } },
        { isRegistered: true, user: { id: 'k2', firstname: 'Ali', lastname: 'zz' } },
        { isRegistered: true, user: { id: 'k3', lastname: 'Alphazz' } },
        { isRegistered: true, user: { id: 'k4', name: 'Abelzz' } },
        { isRegistered: true, user: { id: 'k5', firstname: 'Aazz' } },
        { isRegistered: true, user: { id: 'k6' } },
      ]);
      await renderLoaded();
      // La SectionList virtualise : on lit directement les sections calculées
      const sectionsOf = () => screen.UNSAFE_getByType(SectionList).props.sections;
      const sueNames = (sec: any) =>
        sec.data.map((u: any) => u.user.firstname && u.user.lastname ? `${u.user.firstname} ${u.user.lastname}` : u.user.firstname || u.user.lastname || u.user.name || '');

      // Suggestions
      let sections = sectionsOf();
      expect(sueNames(sections[0])).toEqual(['', 'Aazz', 'Abelzz', 'Ali zz', 'Alphazz', 'Karl zz']);
      expect(sections[1].data.map((c: any) => c.name)).toEqual([undefined, 'Anaïs zz', 'Cyril zz']);

      // Recherche "zz"
      await typeSearch('zz');
      sections = sectionsOf();
      expect(sections.map((sec: any) => sec.type)).toEqual(['sue_users', 'contacts']);
      expect(sueNames(sections[0])).toEqual(['Aazz', 'Abelzz', 'Ali zz', 'Alphazz', 'Karl zz']);
      expect(sections[1].data.map((c: any) => c.name)).toEqual(['Anaïs zz', 'Cyril zz']);
    });

    it("alerte pour un identifiant d'utilisateur invalide", async () => {
      mockState.search.data = backend();
      await renderLoaded();
      await typeSearch('zo');
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-request- '), evt);
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'ID utilisateur invalide');
      expect(mockState.send.sendFriendRequest).not.toHaveBeenCalled();
    });

    it('met à jour un résultat de recherche après envoi puis annulation', async () => {
      mockState.search.data = backend();
      await renderLoaded();
      await typeSearch('zo');
      await act(async () => {
        fireEvent.press(screen.getByTestId('add-request-u40'), evt);
      });
      expect(screen.getByTestId('cancel-request-u40')).toBeTruthy();
      fireEvent.press(screen.getByTestId('cancel-request-u30'), evt);
      await pressAlertButton(alertSpy, 'Oui, annuler');
      expect(screen.getByTestId('add-request-u30')).toBeTruthy();
    });

    it('garde les résultats précédents si la recherche échoue', async () => {
      mockState.search.searchUsers.mockRejectedValue(new Error('x'));
      mockState.search.data = backend();
      await renderLoaded();
      await typeSearch('zo');
      expect(screen.getByText('ZORRO X')).toBeTruthy();
    });

    it('ignore des données de recherche absentes', async () => {
      mockState.search.data = null;
      await renderLoaded();
      await typeSearch('zo');
      expect(screen.queryByText('RÉSULTATS DE RECHERCHE')).toBeNull();
    });

    it('efface la recherche', async () => {
      await renderLoaded();
      await typeSearch('zo');
      fireEvent.press(screen.getByTestId('add-friend-clear-search'));
      expect(screen.getByPlaceholderText('NOM OU EMAIL...').props.value).toBe('');
      expect(screen.queryByTestId('add-friend-clear-search')).toBeNull();
    });

    it('annule le debounce précédent à chaque frappe', async () => {
      await renderLoaded();
      fireEvent.changeText(screen.getByPlaceholderText('NOM OU EMAIL...'), 'zo');
      fireEvent.changeText(screen.getByPlaceholderText('NOM OU EMAIL...'), 'zoe');
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(mockState.search.searchUsers).toHaveBeenCalledTimes(1);
      expect(mockState.search.searchUsers).toHaveBeenCalledWith('zoe');
    });
  });

  // BUG: app/add-friend.tsx (renderItem, calcul de displayName) : `user.firstname ? \`${user.firstname} ${user.lastname}\` : …`
  // affiche "PRÉNOM UNDEFINED" pour un utilisateur Sue qui a un prénom mais pas de nom de famille.
  it.skip("n'affiche pas \"undefined\" pour un utilisateur sans nom de famille", async () => {
    mockState.search.data = [{ id: 'u60', firstname: 'Zack' }];
    await renderLoaded();
    await typeSearch('za');
    expect(screen.queryByText(/UNDEFINED/)).toBeNull();
    expect(screen.getByText('ZACK')).toBeTruthy();
  });

  it('génère des clés stables pour chaque type d’élément', async () => {
    await renderLoaded();
    const keyExtractor = screen.UNSAFE_getByType(SectionList).props.keyExtractor;
    expect(keyExtractor({ id: 'a' }, 0)).toBe('a');
    expect(keyExtractor({ user: { id: 'b' } }, 0)).toBe('b');
    expect(keyExtractor({ phoneNumbers: ['06'] }, 0)).toBe('contact-06');
    expect(keyExtractor({}, 7)).toBe('item-7');
  });

  it('applique les marges Android', async () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      await renderLoaded();
      expect(screen.getByText('RECRUTER')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });
});
