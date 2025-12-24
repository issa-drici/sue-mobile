import React from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, Icon } from '../components/atoms';
import { Card } from '../components/ui/Card';
import { BackScreenLayout } from '../components/ui/ScreenLayout';
import { DevOnly } from '../components/DevOnly';
import { getDevScreens } from '../config/devScreens';
import { DesignTokens } from '../constants/DesignSystem';
import { useAuth } from './context/auth';

export default function DevMenuScreen() {
  const router = useRouter();
  const devScreens = getDevScreens();
  const { resetOnboarding, isOnboardingCompleted } = useAuth();

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Réinitialiser l\'onboarding',
      'Voulez-vous réinitialiser l\'onboarding ? Vous serez redirigé vers l\'écran d\'onboarding.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  };

  return (
    <DevOnly>
      <BackScreenLayout title="Menu Développeur" scrollable horizontalPadding="md">
        
        <View style={{ marginBottom: DesignTokens.spacing.lg }}>
          <Text variant="h2" style={{ marginBottom: DesignTokens.spacing.sm }}>
            Écrans de développement
          </Text>
          <Text variant="body" color="secondary">
            Ces écrans ne sont disponibles qu'en mode développement
          </Text>
        </View>

        <View style={{ gap: DesignTokens.spacing.md }}>
          {devScreens.map((screen) => (
            <Card key={screen.name} padding="md">
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                marginBottom: DesignTokens.spacing.sm 
              }}>
                <Icon name="code" size="md" color="primary" />
                <Text variant="h2" style={{ 
                  marginLeft: DesignTokens.spacing.sm,
                  flex: 1 
                }}>
                  {screen.title}
                </Text>
              </View>
              
              <Text variant="body" color="secondary" style={{ 
                marginBottom: DesignTokens.spacing.md 
              }}>
                {screen.description}
              </Text>
              
              <Button
                title="Ouvrir"
                variant="outline"
                onPress={() => router.push(screen.route)}
              />
            </Card>
          ))}
        </View>

        {devScreens.length === 0 && (
          <Card padding="lg">
            <View style={{ alignItems: 'center' }}>
              <Icon name="information-circle" size="xl" color="secondary" />
              <Text variant="body" color="secondary" style={{ 
                marginTop: DesignTokens.spacing.sm,
                textAlign: 'center' 
              }}>
                Aucun écran de développement disponible
              </Text>
            </View>
          </Card>
        )}

        <View style={{ marginTop: DesignTokens.spacing.xl }}>
          <Text variant="h2" style={{ marginBottom: DesignTokens.spacing.sm }}>
            Outils de développement
          </Text>
          <Text variant="body" color="secondary" style={{ marginBottom: DesignTokens.spacing.md }}>
            Utilitaires pour le développement et le débogage
          </Text>
        </View>

        <Card padding="md">
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            marginBottom: DesignTokens.spacing.sm 
          }}>
            <Icon name="refresh" size="md" color="primary" />
            <View style={{ marginLeft: DesignTokens.spacing.sm, flex: 1 }}>
              <Text variant="h2">
                Réinitialiser l'onboarding
              </Text>
              <Text variant="body" color="secondary" style={{ marginTop: DesignTokens.spacing.xs }}>
                Statut actuel: {isOnboardingCompleted ? 'Terminé' : 'Non terminé'}
              </Text>
            </View>
          </View>
          
          <Text variant="body" color="secondary" style={{ 
            marginBottom: DesignTokens.spacing.md 
          }}>
            Réinitialise l'onboarding pour le réafficher. Vous serez redirigé vers l'écran d'onboarding.
          </Text>
          
          <Button
            title="Réinitialiser l'onboarding"
            variant="outline"
            onPress={handleResetOnboarding}
          />
        </Card>

      </BackScreenLayout>
    </DevOnly>
  );
}
