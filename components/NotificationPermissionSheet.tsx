import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pushNotificationService } from '../services/notifications/pushNotifications';

const VOLT_COLOR = '#D4FC79'; // Electric Volt
const LIGHT_GREEN = '#EEF7DB'; // Light Green
const GREEN_ICON = '#70A831'; // SUE Accent Green

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const BULLETS = [
  {
    icon: 'time-outline' as const,
    title: "Changement d'heure",
    description: "Sois informé si l'horaire de la session change."
  },
  {
    icon: 'location-outline' as const,
    title: "Changement de lieu",
    description: "Sois averti si le lieu de rendez-vous change."
  },
  {
    icon: 'close-circle-outline' as const,
    title: "Annulation",
    description: "Reçois une alerte si la session est annulée."
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: "Nouveaux messages",
    description: "Ne manque aucun message dans le vestiaire."
  }
];

/**
 * Demande "soft" (pré-permission) affichée AVANT la popup native.
 * - Le swipe et le clic en dehors sont bloqués pour forcer l'interaction avec le CTA.
 * - En cliquant sur "Activer", l'alerte Apple native s'affiche.
 * - Que l'utilisateur accepte ou refuse au niveau système, la sheet se ferme ensuite pour continuer.
 */
export default function NotificationPermissionSheet({ visible, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      // Déclenche la permission native
      await pushNotificationService.activateFromPrompt();
    } catch {
      // silencieux
    } finally {
      await pushNotificationService.markSoftPromptHandled();
      setIsLoading(false);
      onDismiss();
    }
  };

  const handleSkip = () => {
    if (isLoading) return;
    Haptics.selectionAsync();
    // Simple fermeture sans marquer comme traité (redemandera au prochain chargement de session)
    onDismiss();
  };

  const slideAnim = React.useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  const handleClose = () => {
    if (isLoading) return;
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose} // Fermeture simple sur le retour physique
      statusBarTranslucent
    >
      {/* Clic sur le backdrop ferme la sheet sans enregistrer le choix */}
      <Pressable style={styles.backdrop} onPress={handleClose} />
      
      <Animated.View 
        style={[
          styles.sheet, 
          { 
            paddingBottom: insets.bottom + 20,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.bellCircle}>
          <Ionicons name="notifications" size={32} color={GREEN_ICON} />
        </View>

        <Text style={styles.title}>Tu participes à cette session.</Text>
        <Text style={styles.subtitle}>
          Active les notifications pour ne rien manquer des changements de dernière minute.
        </Text>

        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.title} style={styles.bulletCard}>
              <View style={styles.bulletIconCircle}>
                <Ionicons name={b.icon} size={18} color={GREEN_ICON} />
              </View>
              <View style={styles.bulletTextContainer}>
                <Text style={styles.bulletTitle}>{b.title}</Text>
                <Text style={styles.bulletDescription}>{b.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleActivate}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="notifications-outline" size={20} color="#000" />
              <Text style={styles.primaryButtonText}>Activer les notifications</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Continuer sans notifications</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    marginBottom: 20,
  },
  bellCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  bullets: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  bulletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#F0F0F2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  bulletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  bulletDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  primaryButton: {
    alignSelf: 'stretch',
    backgroundColor: VOLT_COLOR,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
