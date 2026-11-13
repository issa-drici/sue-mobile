import React from 'react';
import { Alert } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { SlotAvailabilityCard, SlotConfirmCard, formatSlotDay } from '../SlotFinding';
import * as Barrel from '../SlotFinding/index';
import type { SportSession, SlotProposal } from '../../../types/sport';

const NOW = new Date(2026, 0, 10, 12, 0, 0);

const icons = (name: string) => screen.UNSAFE_getAllByType(Ionicons).filter((i) => i.props.name === name);
const lastAlertButtons = () => (Alert.alert as jest.Mock).mock.calls.at(-1)[2];

const makeSession = (over: Partial<SportSession> = {}): SportSession =>
  ({
    id: 'sess',
    organizer: { id: 'org', firstname: 'Orga', lastname: 'N' },
    participants: [],
    slotProposals: [],
    ...over,
  }) as any;

const p = (id: string, firstname: string, extra: any = {}) => ({ id, firstname, lastname: 'X', status: 'accepted', ...extra });

describe('formatSlotDay', () => {
  it('formate le jour en français avec majuscule', () => {
    expect(formatSlotDay({ date: '2026-01-12', startTime: '18:00', endTime: '19:00' })).toBe('Lundi 12 janvier');
    expect(Barrel.formatSlotDay).toBe(formatSlotDay);
  });
});

describe('SlotAvailabilityCard', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const slots: SlotProposal[] = [
    { id: 'b', date: '2026-01-14', startTime: '19:30', endTime: '21:00', availableUserIds: [] },
    { id: 'a', date: '2026-01-12', startTime: '18:00', endTime: '19:00', availableUserIds: ['me'], proposedBy: 'friend' },
    { date: '2026-01-13', startTime: '18:00', endTime: '19:00', proposedBy: 'ghost' },
  ];

  const setup = (sessionOver: Partial<SportSession> = {}, props: any = {}) => {
    const onSend = jest.fn();
    const onPropose = jest.fn(() => Promise.resolve(true));
    const onRemoveProposal = jest.fn();
    const utils = render(
      <SlotAvailabilityCard
        session={makeSession({ slotProposals: slots, participants: [p('me', 'Moi'), p('friend', 'Ami')] as any, ...sessionOver })}
        userId="me"
        isSending={false}
        onSend={onSend}
        onPropose={onPropose}
        onRemoveProposal={onRemoveProposal}
        {...props}
      />
    );
    return { onSend, onPropose, onRemoveProposal, ...utils };
  };

  it('affiche les créneaux triés, avec "proposé par"', () => {
    setup();
    expect(screen.getByText('Quand peux-tu jouer ?')).toBeOnTheScreen();
    const days = screen.getAllByText(/janvier/);
    expect(days.map((d) => d.props.children)).toEqual(['Lundi 12 janvier', 'Mardi 13 janvier', 'Mercredi 14 janvier']);
    expect(screen.getAllByText('18h → 19h')).toHaveLength(2);
    expect(screen.getByText('19h30 → 21h')).toBeOnTheScreen();
    expect(screen.getByText('Proposé par Ami')).toBeOnTheScreen();
    expect(screen.getByText('Proposé par un joueur')).toBeOnTheScreen();
    // le créneau déjà coché par l'utilisateur
    expect(icons('checkbox')).toHaveLength(1);
    expect(screen.getByText('Envoyer mes disponibilités')).toBeOnTheScreen();
    expect(screen.queryByText(/Nouveau créneau proposé/)).toBeNull();
  });

  it('cocher / décocher puis envoyer la sélection (clé de secours date-heure)', () => {
    const { onSend } = setup();
    fireEvent.press(screen.getByText('Mardi 13 janvier'));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Lundi 12 janvier'));
    fireEvent.press(screen.getByText('Envoyer mes disponibilités'));
    expect(onSend).toHaveBeenCalledWith(['2026-01-13-18:00']);
  });

  it('bouton principal désactivé sans sélection', () => {
    const { onSend } = setup({ slotProposals: [slots[0]] });
    fireEvent.press(screen.getByText('Envoyer mes disponibilités'));
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Aucun créneau ne me va'));
    expect(onSend).toHaveBeenCalledWith([]);
  });

  it('déjà répondu : ligne de statut, bouton désactivé tant que rien ne change', () => {
    const { onSend } = setup({
      participants: [p('me', 'Moi', { hasGivenAvailability: true })] as any,
    });
    expect(screen.getByText("Réponse envoyée : 1 créneau. Modifiable jusqu'à la confirmation.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Mettre à jour mes disponibilités'));
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Mercredi 14 janvier'));
    expect(screen.queryByText(/Réponse envoyée/)).toBeNull();
    fireEvent.press(screen.getByText('Mettre à jour mes disponibilités'));
    expect(onSend).toHaveBeenCalledWith(['a', 'b']);
  });

  it('statut au pluriel', () => {
    setup({
      participants: [p('me', 'Moi', { hasGivenAvailability: true })] as any,
      slotProposals: [
        { ...slots[0], availableUserIds: ['me'] },
        { ...slots[1] },
      ],
    });
    expect(screen.getByText(/2 créneaux\./)).toBeOnTheScreen();
  });

  it('répondu "aucun créneau" : message dédié, pas de bouton "Aucun créneau"', () => {
    setup({
      participants: [p('me', 'Moi', { hasGivenAvailability: true })] as any,
      slotProposals: [slots[0]],
    });
    expect(screen.getByText("Tu as indiqué qu'aucun créneau ne te va.")).toBeOnTheScreen();
    expect(screen.queryByText('Aucun créneau ne me va')).toBeNull();
  });

  it('nouveaux créneaux : bandeau, statut masqué, revalidation possible sans changement', () => {
    const { onSend } = setup({
      participants: [p('me', 'Moi', { hasGivenAvailability: true, hasNewSlots: true })] as any,
    });
    expect(screen.getByText('Nouveau créneau proposé : coche-le si tu es dispo.')).toBeOnTheScreen();
    expect(screen.queryByText(/Réponse envoyée/)).toBeNull();
    fireEvent.press(screen.getByText('Mettre à jour mes disponibilités'));
    expect(onSend).toHaveBeenCalledWith(['a']);
  });

  it('en cours d’envoi : spinner et boutons bloqués', () => {
    const { onSend } = setup({}, { isSending: true });
    expect(screen.queryByText('Envoyer mes disponibilités')).toBeNull();
    fireEvent.press(screen.getByText('Aucun créneau ne me va'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('retirer sa propre proposition après confirmation', () => {
    const own: SlotProposal[] = [
      { id: 'mine', date: '2026-01-12', startTime: '18:00', endTime: '19:00', proposedBy: 'me' },
      { date: '2026-01-13', startTime: '18:30', endTime: '19:00', proposedBy: 'me' },
    ];
    const { onRemoveProposal } = setup({ slotProposals: own });
    expect(screen.getAllByText('Proposé par toi')).toHaveLength(2);
    // limite de 2 propositions atteinte
    expect(screen.queryByText('Proposer un autre créneau')).toBeNull();
    fireEvent.press(icons('close')[0]);
    expect(Alert.alert).toHaveBeenCalledWith('Retirer ce créneau ?', 'Lundi 12 janvier, 18h → 19h', expect.any(Array));
    lastAlertButtons()[1].onPress();
    expect(onRemoveProposal).toHaveBeenCalledWith('mine');
    // créneau sans id : rien à retirer
    fireEvent.press(icons('close')[1]);
    lastAlertButtons()[1].onPress();
    expect(onRemoveProposal).toHaveBeenCalledTimes(1);
  });

  it('proposer un créneau : pré-rempli au lendemain du dernier, ajout puis fermeture', async () => {
    const { onPropose } = setup();
    fireEvent.press(screen.getByText('Proposer un autre créneau'));
    expect(screen.getByText('Proposer un créneau')).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByText('PROPOSER CE CRÉNEAU'));
    });
    expect(onPropose).toHaveBeenCalledWith({ date: '2026-01-15', startTime: '19:30', endTime: '20:30' });
    expect(screen.queryByText('PROPOSER CE CRÉNEAU')).toBeNull();
  });

  it('proposition refusée par le parent : la fenêtre reste ouverte', async () => {
    const onPropose = jest.fn(() => Promise.resolve(false));
    setup({}, { onPropose });
    fireEvent.press(screen.getByText('Proposer un autre créneau'));
    await act(async () => {
      fireEvent.press(screen.getByText('PROPOSER CE CRÉNEAU'));
    });
    expect(onPropose).toHaveBeenCalled();
    expect(screen.getByText('PROPOSER CE CRÉNEAU')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Annuler'));
    expect(screen.queryByText('PROPOSER CE CRÉNEAU')).toBeNull();
  });

  it('proposition en doublon : alerte', async () => {
    const { onPropose } = setup({ slotProposals: [{ id: 'x', date: '2026-01-11', startTime: '18:00', endTime: '19:00' }] }, {});
    fireEvent.press(screen.getByText('Proposer un autre créneau'));
    const DateTimePicker = require('@react-native-community/datetimepicker').default;
    const datePicker = screen.UNSAFE_getAllByType(DateTimePicker).find((x: any) => x.props.mode === 'date');
    act(() => datePicker.props.onChange({}, new Date(2026, 0, 11)));
    await act(async () => {
      fireEvent.press(screen.getByText('PROPOSER CE CRÉNEAU'));
    });
    expect(Alert.alert).toHaveBeenCalledWith('Déjà proposé', 'Un créneau commence déjà à cette heure : coche-le plutôt.');
    expect(onPropose).not.toHaveBeenCalled();
  });

  it('sans créneaux ni slotProposals : proposition démarre maintenant', () => {
    setup({ slotProposals: undefined, participants: [] as any });
    expect(screen.getByText('Proposer un autre créneau')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Proposer un autre créneau'));
    expect(screen.getByText('Proposer un créneau')).toBeOnTheScreen();
  });
});

describe('SlotConfirmCard', () => {
  const setup = (sessionOver: Partial<SportSession> = {}, props: any = {}) => {
    const onConfirm = jest.fn();
    const onInvite = jest.fn();
    const onEditSlots = jest.fn();
    render(
      <SlotConfirmCard
        session={makeSession(sessionOver)}
        isConfirming={false}
        onConfirm={onConfirm}
        onInvite={onInvite}
        onEditSlots={onEditSlots}
        {...props}
      />
    );
    return { onConfirm, onInvite, onEditSlots };
  };

  const slots: SlotProposal[] = [
    { id: 's1', date: '2026-01-12', startTime: '18:00', endTime: '19:00', availabilityCount: 1, availableUserIds: ['u1'] },
    { id: 's2', date: '2026-01-13', startTime: '18:30', endTime: '20:00', availabilityCount: 2, availableUserIds: ['u1', 'zz'], proposedBy: 'u1' },
    { id: 's3', date: '2026-01-11', startTime: '10:00', endTime: '11:00' },
    { id: 's4', date: '2026-01-10', startTime: '10:00', endTime: '11:00' },
  ];
  const participants = [
    p('org', 'Orga'),
    p('u1', 'Alice', { hasGivenAvailability: true }),
    p('u2', 'Bob'),
    p('u3', 'Chloé', { hasGivenAvailability: true, hasNewSlots: true }),
    p('u4', 'Dan', { status: 'declined' }),
  ];

  it('aucun créneau à venir : message et bouton "Ajouter des créneaux"', () => {
    const { onEditSlots } = setup({ slotProposals: undefined });
    expect(screen.getByText(/Aucun créneau à venir/)).toBeOnTheScreen();
    expect(screen.queryByText('Modifier les créneaux')).toBeNull();
    fireEvent.press(screen.getByText('Ajouter des créneaux'));
    expect(onEditSlots).toHaveBeenCalled();
  });

  it('aucun invité : bouton "Inviter des joueurs"', () => {
    const { onInvite, onEditSlots } = setup({ slotProposals: slots, participants: [p('org', 'Orga')] as any });
    expect(screen.getByText('Invite des joueurs pour récolter leurs disponibilités.')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Inviter des joueurs'));
    expect(onInvite).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Modifier les créneaux'));
    expect(onEditSlots).toHaveBeenCalled();
  });

  it('classe par disponibilités puis par date, affiche noms, compteurs et attente', () => {
    const { onConfirm } = setup({ slotProposals: slots, participants: participants as any });
    expect(screen.getByText('1/3 a répondu')).toBeOnTheScreen();
    const days = screen.getAllByText(/janvier/).map((d) => d.props.children);
    expect(days).toEqual(['Mardi 13 janvier', 'Lundi 12 janvier', 'Samedi 10 janvier', 'Dimanche 11 janvier']);
    expect(screen.getByText('2 dispos')).toBeOnTheScreen();
    expect(screen.getByText('1 dispo')).toBeOnTheScreen();
    expect(screen.getAllByText('Personne')).toHaveLength(2);
    expect(screen.getByText('Alice, ?')).toBeOnTheScreen();
    expect(screen.getByText('Proposé par Alice')).toBeOnTheScreen();
    expect(screen.getByText('Pas encore répondu : Bob, Chloé')).toBeOnTheScreen();
    expect(icons('radio-button-on')).toHaveLength(1);
    fireEvent.press(screen.getByText('Confirmer mardi 13 à 18h30'));
    expect(onConfirm).toHaveBeenCalledWith(slots[1]);
  });

  it('choisir un autre créneau puis confirmer', () => {
    const { onConfirm } = setup({ slotProposals: slots, participants: participants as any });
    fireEvent.press(screen.getByText('Lundi 12 janvier'));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Confirmer lundi 12 à 18h'));
    expect(onConfirm).toHaveBeenCalledWith(slots[0]);
  });

  it('pluriel "ont répondu" et personne en attente', () => {
    setup({
      slotProposals: [slots[0]],
      participants: [p('u1', 'A', { hasGivenAvailability: true }), p('u2', 'B', { hasGivenAvailability: true })] as any,
    });
    expect(screen.getByText('2/2 ont répondu')).toBeOnTheScreen();
    expect(screen.queryByText(/Pas encore répondu/)).toBeNull();
  });

  it('confirmation en cours : spinner, bouton bloqué', () => {
    const { onConfirm } = setup(
      { slotProposals: [{ date: '2026-01-12', startTime: '18:00', endTime: '19:00' }], participants: [p('u1', 'A')] as any },
      { isConfirming: true }
    );
    expect(screen.queryByText(/^Confirmer/)).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
