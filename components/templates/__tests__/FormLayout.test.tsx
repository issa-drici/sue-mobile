import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({ formatDate: () => 'date', formatTimeFrance: () => 'heure' }));
jest.mock('../../../utils/timeHelpers', () => ({ isSessionFinished: () => false }));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { FormLayout } from '../FormLayout';

const sections = [
  {
    title: 'Identité',
    subtitle: 'Tes infos',
    fields: [
      { key: 'name', label: 'Nom', value: 'Issa', placeholder: 'nom', required: true },
      { key: 'email', label: 'Email', value: '', type: 'email' as const, placeholder: 'email', error: 'Requis' },
      { key: 'pwd', label: 'Mot de passe', value: '', type: 'password' as const, placeholder: 'pwd' },
      { key: 'age', label: 'Âge', value: '', type: 'number' as const, placeholder: 'age' },
    ],
  },
  { fields: [] },
];

describe('FormLayout', () => {
  it('rend sections et champs avec les bons claviers', () => {
    render(<FormLayout title="Profil" sections={sections} onFieldChange={jest.fn()} onSubmit={jest.fn()} />);
    expect(screen.getByText('Identité')).toBeOnTheScreen();
    expect(screen.getByText('Tes infos')).toBeOnTheScreen();
    expect(screen.getByText('Requis')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('nom').props).toMatchObject({ keyboardType: 'default', autoCapitalize: 'sentences', autoComplete: 'off' });
    expect(screen.getByPlaceholderText('email').props).toMatchObject({ keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' });
    expect(screen.getByPlaceholderText('pwd').props).toMatchObject({ secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'password' });
    expect(screen.getByPlaceholderText('age').props.keyboardType).toBe('numeric');
  });

  it('remonte les changements par clé et soumet', () => {
    const onFieldChange = jest.fn();
    const onSubmit = jest.fn();
    render(<FormLayout sections={sections} onFieldChange={onFieldChange} onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('email'), 'a@b.c');
    expect(onFieldChange).toHaveBeenCalledWith('email', 'a@b.c');
    fireEvent.press(screen.getByText('Valider'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('bouton désactivé, action secondaire, titre personnalisé', () => {
    const onSubmit = jest.fn();
    const secondary = jest.fn();
    render(
      <FormLayout
        sections={sections}
        onFieldChange={jest.fn()}
        onSubmit={onSubmit}
        submitTitle="Enregistrer"
        submitDisabled
        secondaryAction={{ title: 'Annuler', onPress: secondary }}
      />
    );
    fireEvent.press(screen.getByText('Enregistrer'));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Annuler'));
    expect(secondary).toHaveBeenCalled();
  });

  it('chargement : titre masqué', () => {
    render(<FormLayout sections={[]} onFieldChange={jest.fn()} onSubmit={jest.fn()} submitLoading />);
    expect(screen.queryByText('Valider')).toBeNull();
  });
});
