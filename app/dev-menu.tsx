import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function DevMenuScreen() {
  const router = useRouter();
  const devScreens = getDevScreens();
  const { resetOnboarding, isOnboardingCompleted, user } = useAuth();
  const { sendLocalNotification, sendTestNotification, isInitialized: pushReady, token: expoPushToken } = usePushNotifications();

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

        <Card padding="md">
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            marginBottom: DesignTokens.spacing.sm 
          }}>
            <Icon name="notifications" size="md" color="primary" />
            <View style={{ marginLeft: DesignTokens.spacing.sm, flex: 1 }}>
              <Text variant="h2">
                Test Notifications
              </Text>
              <Text variant="body" color="secondary" style={{ marginTop: DesignTokens.spacing.xs }}>
                Push: {pushReady ? '✅ Prêt' : '❌ Non prêt'} | Token: {expoPushToken ? '✅' : '❌'}
              </Text>
            </View>
          </View>
          
          <Text variant="body" color="secondary" style={{ 
            marginBottom: DesignTokens.spacing.md 
          }}>
            Testez les notifications locales (fonctionne sur simulateurs) ou push (nécessite backend).
          </Text>
          
          <View style={{ gap: DesignTokens.spacing.sm }}>
            <Button
              title="📱 Test Notification Locale (Simulateur)"
              variant="outline"
              onPress={async () => {
                try {
                  await sendLocalNotification({
                    title: '🔔 Test Notification Locale',
                    body: 'Ceci est une notification locale de test. Fonctionne sur simulateurs !',
                    data: {
                      type: 'test',
                      session_id: 'test-123',
                      notification_id: `test-${Date.now()}`,
                    },
                  });
                  Alert.alert('Succès', 'Notification locale envoyée !');
                } catch (error) {
                  Alert.alert('Erreur', 'Impossible d\'envoyer la notification locale');
                  console.error('Erreur notification locale:', error);
                }
              }}
            />
            
            <Button
              title="🚀 Test Notification Push (Backend)"
              variant="outline"
              onPress={async () => {
                if (!pushReady) {
                  Alert.alert('Erreur', 'Notifications push non initialisées');
                  return;
                }
                try {
                  const success = await sendTestNotification(user?.id);
                  if (success) {
                    Alert.alert('Succès', 'Notification push envoyée !');
                  } else {
                    Alert.alert('Échec', 'Impossible d\'envoyer la notification push');
                  }
                } catch (error) {
                  Alert.alert('Erreur', 'Erreur lors de l\'envoi de la notification push');
                  console.error('Erreur notification push:', error);
                }
              }}
              disabled={!pushReady}
            />
          </View>
        </Card>

        <Card padding="md">
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            marginBottom: DesignTokens.spacing.sm 
          }}>
            <Icon name="people" size="md" color="primary" />
            <View style={{ marginLeft: DesignTokens.spacing.sm, flex: 1 }}>
              <Text variant="h2">
                Réinitialiser Permission Contacts
              </Text>
              <Text variant="body" color="secondary" style={{ marginTop: DesignTokens.spacing.xs }}>
                Réinitialise le flag de demande de permission contacts
              </Text>
            </View>
          </View>
          
          <Text variant="body" color="secondary" style={{ 
            marginBottom: DesignTokens.spacing.md 
          }}>
            Réinitialise le flag AsyncStorage pour redemander la permission contacts. Vous devrez aussi réinitialiser la permission dans les paramètres du simulateur.
          </Text>
          
          <Button
            title="Réinitialiser Flag Contacts"
            variant="outline"
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('contacts_permission_requested');
                Alert.alert(
                  'Succès',
                  'Flag réinitialisé !\n\nPour tester complètement :\n1. Réinitialisez la permission dans les paramètres du simulateur\n2. Relancez l\'app\n3. Allez sur l\'écran "Ajouter un ami"'
                );
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de réinitialiser le flag');
                console.error('Erreur réinitialisation contacts:', error);
              }
            }}
          />
        </Card>

      </BackScreenLayout>
    </DevOnly>
  );
}
