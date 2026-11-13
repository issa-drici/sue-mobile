import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({ formatDate: () => 'date', formatTimeFrance: () => 'heure' }));
jest.mock('../../../utils/timeHelpers', () => ({ isSessionFinished: () => false }));

import { RefreshControl, ScrollView, StatusBar, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PageLayout } from '../PageLayout';
import * as Templates from '../index';

describe('PageLayout', () => {
  beforeEach(() => mockBack.mockClear());

  it('le barrel exporte les templates', () => {
    expect(Templates.PageLayout).toBe(PageLayout);
    expect(Templates.ListLayout).toBeDefined();
    expect(Templates.AuthLayout).toBeDefined();
    expect(Templates.FormLayout).toBeDefined();
  });

  it('rend le header, le contenu non défilant et la barre de statut par défaut', () => {
    const { UNSAFE_queryByType, UNSAFE_getByType } = render(
      <PageLayout title="Accueil" rightAction={<Text>R</Text>}>
        <Text>Contenu</Text>
      </PageLayout>
    );
    expect(screen.getByText('Accueil')).toBeOnTheScreen();
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
    expect(screen.getByText('R')).toBeOnTheScreen();
    expect(UNSAFE_queryByType(ScrollView)).toBeNull();
    expect(UNSAFE_getByType(StatusBar).props.barStyle).toBe('dark-content');
  });

  it('défilant avec refreshControl, couleurs personnalisées et retour', () => {
    const onBackPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <PageLayout
        scrollable
        refreshControl={<RefreshControl refreshing={false} onRefresh={jest.fn()} />}
        statusBarStyle="light-content"
        backgroundColor="#000"
        showBackButton
        onBackPress={onBackPress}
      >
        <Text>Défile</Text>
      </PageLayout>
    );
    expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
    expect(UNSAFE_getByType(StatusBar).props).toMatchObject({ barStyle: 'light-content', backgroundColor: '#000' });
    fireEvent.press(UNSAFE_getByType(Ionicons));
    expect(onBackPress).toHaveBeenCalled();
  });
});
