import React from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  ScreenLayout,
  BackScreenLayout,
  MainScreenLayout,
  ScrollableScreenLayout,
  ModalScreenLayout,
} from '../ScreenLayout';
import * as UI from '../index';
import { DesignTokens } from '../../../constants/DesignSystem';

describe('ScreenLayout', () => {
  beforeEach(() => mockBack.mockClear());
  afterEach(() => jest.restoreAllMocks());

  it('le barrel ui exporte layouts, cartes et tokens', () => {
    expect(UI.ScreenLayout).toBe(ScreenLayout);
    expect(UI.Card).toBeDefined();
    expect(UI.DesignTokens).toBe(DesignTokens);
    expect(UI.CommonStyles).toBeDefined();
  });

  it('header avec titre, sans bouton retour, contenu fixe', () => {
    const { UNSAFE_queryByType, UNSAFE_getByType } = render(
      <ScreenLayout title="Titre">
        <Text>Contenu</Text>
      </ScreenLayout>
    );
    expect(screen.getByText('Titre')).toBeOnTheScreen();
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
    expect(UNSAFE_queryByType(Ionicons)).toBeNull();
    expect(UNSAFE_queryByType(ScrollView)).toBeNull();
    expect(UNSAFE_getByType(SafeAreaView)).toBeTruthy();
    expect(UNSAFE_getByType(StatusBar).props).toMatchObject({
      barStyle: 'dark-content',
      backgroundColor: DesignTokens.colors.background,
      translucent: false,
    });
  });

  it('retour : router.back par défaut ou callback', () => {
    const { UNSAFE_getByType, rerender } = render(
      <ScreenLayout showBackButton>
        <Text>x</Text>
      </ScreenLayout>
    );
    fireEvent.press(UNSAFE_getByType(Ionicons));
    expect(mockBack).toHaveBeenCalled();
    const onBackPress = jest.fn();
    rerender(
      <ScreenLayout showBackButton onBackPress={onBackPress}>
        <Text>x</Text>
      </ScreenLayout>
    );
    fireEvent.press(UNSAFE_getByType(Ionicons));
    expect(onBackPress).toHaveBeenCalled();
  });

  it('sans header, défilant avec padding, action droite et barre de statut perso', () => {
    const { UNSAFE_getByType } = render(
      <ScreenLayout
        showHeader={false}
        scrollable
        horizontalPadding="lg"
        statusBarStyle="light-content"
        statusBarBackgroundColor="#111"
        title="Caché"
      >
        <Text>x</Text>
      </ScreenLayout>
    );
    expect(screen.queryByText('Caché')).toBeNull();
    expect(UNSAFE_getByType(ScrollView).props.contentContainerStyle).toEqual(
      expect.arrayContaining([{ paddingHorizontal: DesignTokens.spacing.lg }])
    );
    expect(UNSAFE_getByType(StatusBar).props).toMatchObject({ barStyle: 'light-content', backgroundColor: '#111' });
  });

  it('action droite affichée', () => {
    render(
      <ScreenLayout rightAction={<Text>Droite</Text>}>
        <Text>x</Text>
      </ScreenLayout>
    );
    expect(screen.getByText('Droite')).toBeOnTheScreen();
  });

  it('Android : barre de statut translucide', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { UNSAFE_getByType } = render(
      <ScreenLayout>
        <Text>x</Text>
      </ScreenLayout>
    );
    expect(UNSAFE_getByType(StatusBar).props.translucent).toBe(true);
  });

  it('variantes pré-configurées', () => {
    const back = render(<BackScreenLayout><Text>b</Text></BackScreenLayout>);
    expect(back.UNSAFE_getByType(Ionicons)).toBeTruthy();
    back.unmount();
    const main = render(<MainScreenLayout><Text>m</Text></MainScreenLayout>);
    expect(main.UNSAFE_queryByType(Ionicons)).toBeNull();
    main.unmount();
    const scroll = render(<ScrollableScreenLayout><Text>s</Text></ScrollableScreenLayout>);
    expect(scroll.UNSAFE_getByType(ScrollView)).toBeTruthy();
    scroll.unmount();
    const modal = render(<ModalScreenLayout><Text>mo</Text></ModalScreenLayout>);
    expect(modal.UNSAFE_queryByType(SafeAreaView)).toBeNull();
  });
});
