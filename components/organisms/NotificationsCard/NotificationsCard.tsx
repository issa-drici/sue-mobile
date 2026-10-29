import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors } from '../../../constants/Colors';
import { NotificationAccess, pushNotificationService } from '../../../services/notifications/pushNotifications';

// Accueil : tant que les notifications n'arrivent pas sur l'écran verrouillé (provisoires, jamais
// demandées ou refusées), une carte propose de les activer. "Activer" ouvre directement la fenêtre
// d'Apple : la carte fait déjà l'explication, une fiche de plus serait une étape de trop.

const DISMISSED_KEY = 'notif_home_card_dismissed_at';
const DISMISS_DAYS = 5;

export function NotificationsCard() {
  const [access, setAccess] = useState<NotificationAccess | null>(null);
  const [isHidden, setIsHidden] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

  const refresh = useCallback(async () => {
    const [current, dismissedAt] = await Promise.all([
      pushNotificationService.getAccess(),
      AsyncStorage.getItem(DISMISSED_KEY).catch(() => null),
    ]);
    setAccess(current);
    setIsHidden(!!dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 86_400_000);
  }, []);

  // Au retour sur l'accueil et au retour des Réglages
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => subscription.remove();
  }, [refresh]);

  if (!access || access === 'full' || isHidden) return null;

  const isDenied = access === 'denied';

  const activate = async () => {
    if (isAsking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isDenied) {
      Linking.openSettings();
      return;
    }
    setIsAsking(true);
    try {
      const granted = await pushNotificationService.activateFromPrompt();
      Haptics.notificationAsync(granted ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    } finally {
      await pushNotificationService.markSoftPromptHandled();
      setIsAsking(false);
      refresh();
    }
  };

  const dismiss = () => {
    Haptics.selectionAsync();
    setIsHidden(true);
    AsyncStorage.setItem(DISMISSED_KEY, String(Date.now())).catch(() => {});
  };

  return (
    <View style={styles.card}>
      <Image source={require('../../../assets/images/brand/notifications.webp')} style={styles.image} resizeMode="contain" />
      <View style={styles.texts}>
        <Text style={styles.title}>
          {isDenied ? 'Tu rates tes rappels' : 'Ne rate plus aucune session'}
        </Text>
        <Text style={styles.body}>
          {isDenied
            ? 'Les notifications sont coupées : active-les dans les Réglages pour être prévenu à temps.'
            : 'Rappels, joueurs qui rejoignent, changement d\'heure : reçois-les sur ton écran verrouillé.'}
        </Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={activate} disabled={isAsking}>
          {isAsking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name={isDenied ? 'settings-outline' : 'notifications'} size={16} color="#000" />
              <Text style={styles.buttonText}>{isDenied ? 'Ouvrir les Réglages' : 'Activer les notifications'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={dismiss}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.close}
        accessibilityLabel="Masquer"
      >
        <Ionicons name="close" size={18} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    paddingRight: 36,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: '#0A0A0A',
  },
  image: {
    width: 56,
    height: 56,
    marginTop: 2,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  body: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: BrandColors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
