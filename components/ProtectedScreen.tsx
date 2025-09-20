import { BrandColors } from '@/constants/Colors';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useProtectedRoute } from '../hooks/useAuthRedirect';

interface ProtectedScreenProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Composant wrapper pour protéger les écrans qui nécessitent une authentification
 * Redirige automatiquement vers la connexion si l'utilisateur n'est pas connecté
 */
export function ProtectedScreen({ children, fallback }: ProtectedScreenProps) {
  const { isAuthenticated, isLoading } = useProtectedRoute();

  // Afficher un loader pendant la vérification d'authentification
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Vérification de l&apos;authentification...</Text>
      </View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher le fallback ou rien
  // (la redirection est gérée par le hook useProtectedRoute)
  if (!isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.unauthorizedContainer}>
        <Text style={styles.unauthorizedText}>Redirection vers la connexion...</Text>
      </View>
    );
  }

  // Si l'utilisateur est authentifié, afficher le contenu
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#666',
  },
}); 