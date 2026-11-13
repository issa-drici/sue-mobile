import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({ formatDate: () => 'date', formatTimeFrance: () => 'heure' }));
jest.mock('../../../utils/timeHelpers', () => ({ isSessionFinished: () => false }));

import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListLayout } from '../ListLayout';

describe('ListLayout', () => {
  it('type sessions avec barre de recherche', () => {
    const onSearchChange = jest.fn();
    const onSessionPress = jest.fn();
    render(
      <ListLayout
        type="sessions"
        title="Sessions"
        searchable
        searchValue=""
        onSearchChange={onSearchChange}
        sessions={[{ id: '1', sport: 'tennis', location: 'L', startTime: 's' }]}
        onSessionPress={onSessionPress}
      />
    );
    expect(screen.getByPlaceholderText('Rechercher...')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher...'), 'foot');
    expect(onSearchChange).toHaveBeenCalledWith('foot');
    fireEvent.press(screen.getByText('Tennis'));
    expect(onSessionPress).toHaveBeenCalled();
  });

  it('searchable sans onSearchChange : pas de barre', () => {
    render(<ListLayout type="sessions" searchable sessions={[]} emptyState={{ title: 'Vide' }} searchPlaceholder="Cherche" />);
    expect(screen.queryByPlaceholderText('Cherche')).toBeNull();
    expect(screen.getByText('Vide')).toBeOnTheScreen();
  });

  it('type friends (demandes par défaut vides)', () => {
    render(<ListLayout type="friends" friends={[{ id: 'f', firstname: 'Ana', email: 'a@x' }]} />);
    expect(screen.getByText('Mes amis')).toBeOnTheScreen();
    expect(screen.getByText('Ana')).toBeOnTheScreen();
  });

  it('type friends avec demandes', () => {
    render(
      <ListLayout
        type="friends"
        friends={[]}
        friendRequests={[{ id: 'r', firstname: 'Bob', email: 'b@x', status: 'pending' }]}
        isResponding={false}
      />
    );
    expect(screen.getByText('Accepter')).toBeOnTheScreen();
  });

  it('type sections', () => {
    render(
      <ListLayout
        type="sections"
        sections={[{ title: 'S', data: [1], renderItem: (i: number) => <Text>{`item${i}`}</Text> }]}
      />
    );
    expect(screen.getByText('item1')).toBeOnTheScreen();
  });

  it('type custom et type inconnu', () => {
    render(
      <ListLayout type="custom" title="Perso">
        <Text>Enfant</Text>
      </ListLayout>
    );
    expect(screen.getByText('Enfant')).toBeOnTheScreen();
    render(<ListLayout {...({ type: 'autre', title: 'Inconnu' } as any)} />);
    expect(screen.getByText('Inconnu')).toBeOnTheScreen();
  });
});
