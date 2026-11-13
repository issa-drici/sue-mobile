import React from 'react';
import { Text } from 'react-native';

const mockUseProtectedRoute = jest.fn();
jest.mock('../../hooks/useAuthRedirect', () => ({ useProtectedRoute: () => mockUseProtectedRoute() }));

import { render, screen } from '@testing-library/react-native';
import { ProtectedScreen } from '../ProtectedScreen';

const tree = (fallback?: React.ReactNode) => (
  <ProtectedScreen fallback={fallback}>
    <Text>Privé</Text>
  </ProtectedScreen>
);

describe('ProtectedScreen', () => {
  it('pendant le chargement : affiche le contenu (pas d’écran bloquant)', () => {
    mockUseProtectedRoute.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(tree());
    expect(screen.getByText('Privé')).toBeOnTheScreen();
  });

  it('non authentifié : message de redirection', () => {
    mockUseProtectedRoute.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(tree());
    expect(screen.queryByText('Privé')).toBeNull();
    expect(screen.getByText('Redirection vers la connexion...')).toBeOnTheScreen();
  });

  it('non authentifié : fallback personnalisé', () => {
    mockUseProtectedRoute.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(tree(<Text>Connecte-toi</Text>));
    expect(screen.getByText('Connecte-toi')).toBeOnTheScreen();
  });

  it('authentifié : contenu', () => {
    mockUseProtectedRoute.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(tree());
    expect(screen.getByText('Privé')).toBeOnTheScreen();
  });
});
