import React from 'react';
import { Image } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UserCard } from '../UserCard';

const user = { id: '1', firstname: 'Issa', lastname: 'D', email: 'i@d.fr' };

describe('UserCard', () => {
  it('affiche le nom complet, l’email et les initiales', () => {
    render(<UserCard user={user} />);
    expect(screen.getByText('Issa D')).toBeOnTheScreen();
    expect(screen.getByText('i@d.fr')).toBeOnTheScreen();
    expect(screen.getByText('I')).toBeOnTheScreen();
  });

  it('sans nom : affiche l’email comme nom et son initiale', () => {
    render(<UserCard user={{ id: '2', email: 'zed@x.fr' }} subtitle="Ami" />);
    expect(screen.getByText('zed@x.fr')).toBeOnTheScreen();
    expect(screen.getByText('Ami')).toBeOnTheScreen();
    expect(screen.getByText('z')).toBeOnTheScreen();
  });

  it('avatar image si fourni', () => {
    const { UNSAFE_getByType } = render(<UserCard user={{ ...user, avatar: 'https://a/b.png' }} />);
    expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'https://a/b.png' });
  });

  it('cliquable si onPress, et chevron affiché', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<UserCard user={user} onPress={onPress} showChevron />);
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('chevron-forward');
    fireEvent.press(screen.getByText('Issa D'));
    expect(onPress).toHaveBeenCalled();
  });

  it('actions primaire et secondaire (chevron masqué)', () => {
    const p = jest.fn();
    const s = jest.fn();
    const { UNSAFE_queryByType } = render(
      <UserCard
        user={user}
        showChevron
        actions={{ primary: { title: 'Ajouter', onPress: p }, secondary: { title: 'Refuser', onPress: s } }}
      />
    );
    expect(UNSAFE_queryByType(Ionicons)).toBeNull();
    fireEvent.press(screen.getByText('Ajouter'));
    fireEvent.press(screen.getByText('Refuser'));
    expect(p).toHaveBeenCalled();
    expect(s).toHaveBeenCalled();
  });

  it('actions désactivées et en chargement', () => {
    const p = jest.fn();
    render(
      <UserCard
        user={user}
        actions={{ primary: { title: 'Ajouter', onPress: p, disabled: true }, secondary: { title: 'X', onPress: p, loading: true } }}
      />
    );
    fireEvent.press(screen.getByText('Ajouter'));
    expect(p).not.toHaveBeenCalled();
    expect(screen.queryByText('X')).toBeNull();
  });

  it('actions vides : aucun bouton', () => {
    render(<UserCard user={user} actions={{}} />);
    expect(screen.getByText('Issa D')).toBeOnTheScreen();
  });
});
