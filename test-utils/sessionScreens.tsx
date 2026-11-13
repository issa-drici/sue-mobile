/**
 * Mocks et fixtures partagés par les tests des écrans de session
 * (__tests__/app/session, create-session, edit-session).
 * Utilisation dans une factory jest.mock :
 *   jest.mock('…/SlotPicker', () => require('…/test-utils/sessionScreens').slotPickerModule);
 */
import React from 'react';
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import type { SportSession } from '../types/sport';

/* ------------------------------------------------------------------ */
/* Composants                                                          */
/* ------------------------------------------------------------------ */

export const screenLayoutModule = {
  MainScreenLayout: ({ children }: { children: React.ReactNode }) => <View testID="main-layout">{children}</View>,
};

export const sportIconModule = {
  SportIcon: ({ children }: { children?: React.ReactNode }) => <View testID="sport-icon">{children}</View>,
  hasSportImage: jest.fn(() => false),
};

export const sportSurfaceModule = {
  SportSurface: () => <View testID="sport-surface" />,
  hasSportSurface: jest.fn(() => false),
};

export const inlineLoadingModule = {
  InlineLoading: ({ message }: { message?: string }) => <Text>{message}</Text>,
};

/** DateTimePicker : une vue identifiable par mode/affichage ; fireEvent(el, 'change', evt, date) */
export const dateTimePickerModule = {
  __esModule: true,
  default: (props: any) => <View testID={`dtp-${props.mode}-${props.display}`} {...props} />,
};

export const TEST_SLOT = { id: 'local-1', date: '2026-07-06', startTime: '10:00', durationMinutes: 90 };

export const slotPickerModule = {
  SlotPicker: ({ slots, onChange }: { slots: any[]; onChange: (s: any[]) => void }) => (
    <View testID="slot-picker">
      <Text>{`${slots.length} créneau(x) dans le sélecteur`}</Text>
      <TouchableOpacity testID="slot-picker-add" onPress={() => onChange([...slots, { ...TEST_SLOT, id: `local-${slots.length + 1}` }])}>
        <Text>Ajouter un créneau test</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="slot-picker-clear" onPress={() => onChange([])}>
        <Text>Vider les créneaux</Text>
      </TouchableOpacity>
    </View>
  ),
  slotEndTime: (slot: { startTime: string; durationMinutes: number }) => {
    const [h, m] = slot.startTime.split(':').map(Number);
    const total = (h * 60 + m + slot.durationMinutes) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  },
};

export const slotFindingModule = {
  formatSlotDay: (slot: { date: string }) => `Jour ${slot.date}`,
  SlotAvailabilityCard: (props: any) => (
    <View testID="slot-availability-card">
      <TouchableOpacity testID="availability-send" onPress={() => props.onSend(['slot-1'])}>
        <Text>Envoyer dispos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="availability-propose"
        onPress={async () => {
          const ok = await props.onPropose({ date: '2026-07-08', startTime: '09:00', endTime: '10:00' });
          (slotFindingModule as any).lastProposeResult = ok;
        }}
      >
        <Text>Proposer créneau</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="availability-remove" onPress={() => props.onRemoveProposal('slot-2')}>
        <Text>Retirer créneau</Text>
      </TouchableOpacity>
    </View>
  ),
  SlotConfirmCard: (props: any) => (
    <View testID="slot-confirm-card">
      {(props.session.slotProposals || []).map((slot: any, i: number) => (
        <TouchableOpacity key={i} testID={`confirm-slot-${i}`} onPress={() => props.onConfirm(slot)}>
          <Text>{`Confirmer ${slot.date}`}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity testID="confirm-card-invite" onPress={props.onInvite}>
        <Text>Inviter depuis carte</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="confirm-card-edit" onPress={props.onEditSlots}>
        <Text>Modifier les créneaux</Text>
      </TouchableOpacity>
    </View>
  ),
};

export const userProfileModalModule = {
  __esModule: true,
  default: (props: any) =>
    props.visible ? (
      <View testID="user-profile-modal">
        <Text>{`Profil ${props.userFirstname} ${props.userLastname} (${props.userStatus})${props.isPlayerOrganizer ? ' orga' : ''}`}</Text>
        <TouchableOpacity testID="user-profile-close" onPress={props.onClose}>
          <Text>Fermer profil</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="user-profile-organizer-changed" onPress={props.onOrganizerChanged}>
          <Text>Changer orga</Text>
        </TouchableOpacity>
      </View>
    ) : null,
};

export const notificationSheetModule = {
  __esModule: true,
  default: (props: any) => (
    <TouchableOpacity testID="notif-sheet-dismiss" onPress={props.onDismiss}>
      <Text>{props.visible ? 'Feuille notifications visible' : ''}</Text>
    </TouchableOpacity>
  ),
};

export const pullToRefreshModule = {
  __esModule: true,
  default: (props: any) => <RefreshControl {...props} />,
};

export const linearGradientModule = {
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <View testID="linear-gradient">{children}</View>,
};

export const menuModule = {
  MenuView: ({ children, actions, onPressAction }: any) => (
    <View testID="native-menu">
      {children}
      {actions
        .flatMap((group: any) => group.subactions ?? [])
        .map((action: any) => (
          <TouchableOpacity
            key={action.id}
            testID={`native-menu-${action.id}`}
            onPress={() => onPressAction({ nativeEvent: { event: action.id } })}
          >
            <Text>{action.title}</Text>
          </TouchableOpacity>
        ))}
    </View>
  ),
};

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

export const ORGANIZER = { id: 'org-1', firstname: 'Marc', lastname: 'Dupont', avatar: null };

export function makeSportSession(overrides: Partial<SportSession> & Record<string, any> = {}): SportSession {
  return {
    id: 's-1',
    sport: 'tennis' as any,
    date: '2099-07-06',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Tennis Club de Paris',
    maxParticipants: null,
    pricePerPerson: null,
    status: 'active',
    shareToken: 'share-tok',
    scheduling: 'scheduled',
    slotProposals: [],
    organizer: { ...ORGANIZER },
    participants: [
      { id: 'org-1', firstname: 'Marc', lastname: 'Dupont', status: 'accepted', avatar: null },
      { id: 'u-2', firstname: 'Julie', lastname: 'Martin', status: 'accepted', avatar: 'https://img/julie.png' },
      { id: 'u-3', firstname: 'Paul', lastname: 'Durand', status: 'pending', avatar: null },
      { id: 'u-4', firstname: 'Zoé', lastname: 'Petit', status: 'declined', avatar: null },
    ],
    comments: [],
    ...overrides,
  } as SportSession;
}

export function makeRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  };
}
