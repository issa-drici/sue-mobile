import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({ formatDate: () => 'date', formatTimeFrance: () => 'heure' }));
jest.mock('../../../utils/timeHelpers', () => ({ isSessionFinished: () => false }));

import { ImageBackground, StatusBar, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { render, screen } from '@testing-library/react-native';
import { AuthLayout } from '../AuthLayout';

describe('AuthLayout', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logo par défaut, titre, sous-titre, contenu et pied de page', () => {
    const { UNSAFE_getByType, UNSAFE_queryByType } = render(
      <AuthLayout title="Connexion" subtitle="Bienvenue" footer={<Text>Pied</Text>}>
        <Text>Formulaire</Text>
      </AuthLayout>
    );
    expect(screen.getByText('Connexion')).toBeOnTheScreen();
    expect(screen.getByText('Bienvenue')).toBeOnTheScreen();
    expect(screen.getByText('Formulaire')).toBeOnTheScreen();
    expect(screen.getByText('Pied')).toBeOnTheScreen();
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('person-circle');
    expect(UNSAFE_queryByType(ImageBackground)).toBeNull();
    expect(UNSAFE_getByType(StatusBar).props.barStyle).toBe('dark-content');
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
  });

  it('logo personnalisé', () => {
    const { UNSAFE_getByType } = render(
      <AuthLayout title="T" logoSource={1}>
        <Text>x</Text>
      </AuthLayout>
    );
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('logo');
  });

  it('sans logo, avec image de fond', () => {
    const { UNSAFE_queryByType, UNSAFE_getByType } = render(
      <AuthLayout title="T" showLogo={false} backgroundImage={{ uri: 'bg' }}>
        <Text>x</Text>
      </AuthLayout>
    );
    expect(UNSAFE_queryByType(Ionicons)).toBeNull();
    expect(UNSAFE_getByType(ImageBackground).props.source).toEqual({ uri: 'bg' });
    expect(UNSAFE_getByType(StatusBar).props.barStyle).toBe('light-content');
  });

  it('Android : comportement clavier "height"', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { UNSAFE_getByType } = render(
      <AuthLayout title="T">
        <Text>x</Text>
      </AuthLayout>
    );
    expect(UNSAFE_getByType(KeyboardAvoidingView).props).toMatchObject({ behavior: 'height', keyboardVerticalOffset: 20 });
  });
});
