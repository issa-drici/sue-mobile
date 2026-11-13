import { render, screen } from '@testing-library/react-native';
import React from 'react';

import NotFoundScreen from '../../../app/+not-found';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

describe('NotFoundScreen', () => {
  it("affiche le message et un lien vers l'accueil", () => {
    render(<NotFoundScreen />);
    expect(screen.getByText('This screen does not exist.')).toBeTruthy();
    expect(screen.getByText('title:Oops!')).toBeTruthy();
    expect(screen.getByTestId('link-/')).toBeTruthy();
    expect(screen.getByText('Go to home screen!')).toBeTruthy();
  });
});
