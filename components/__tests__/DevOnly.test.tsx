import React from 'react';
import { Text } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));
const mockEnv = { NODE_ENV: 'development' };
jest.mock('../../config/env', () => ({
  get ENV() {
    return mockEnv;
  },
}));

import { render, screen } from '@testing-library/react-native';
import { DevOnly } from '../DevOnly';

describe('DevOnly', () => {
  afterEach(() => {
    mockEnv.NODE_ENV = 'development';
  });

  it('en développement : affiche les enfants', () => {
    render(
      <DevOnly>
        <Text>Outil dev</Text>
      </DevOnly>
    );
    expect(screen.getByText('Outil dev')).toBeOnTheScreen();
  });

  it('hors développement : message par défaut', () => {
    mockEnv.NODE_ENV = 'production';
    render(
      <DevOnly>
        <Text>Outil dev</Text>
      </DevOnly>
    );
    expect(screen.queryByText('Outil dev')).toBeNull();
    expect(screen.getByText('Développement uniquement')).toBeOnTheScreen();
    expect(screen.getByText(/disponible qu'en mode développement/)).toBeOnTheScreen();
  });

  it('hors développement : fallback personnalisé', () => {
    mockEnv.NODE_ENV = 'production';
    render(
      <DevOnly fallback={<Text>Interdit</Text>}>
        <Text>Outil dev</Text>
      </DevOnly>
    );
    expect(screen.getByText('Interdit')).toBeOnTheScreen();
  });
});
