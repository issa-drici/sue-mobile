import { BrandColors } from '@/constants/Colors';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface OptimizedLoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
  showText?: boolean;
}

/**
 * Composant de chargement optimisé qui ne bloque pas l'interface
 * Utilisé pour remplacer les écrans de chargement bloquants
 */
export function OptimizedLoading({ 
  message = 'Chargement...', 
  size = 'small', 
  color = BrandColors.primary,
  style,
  showText = true 
}: OptimizedLoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {showText && (
        <Text style={styles.text}>{message}</Text>
      )}
    </View>
  );
}

/**
 * Indicateur de chargement discret pour les listes
 */
export function InlineLoading({ message = 'Chargement...' }: { message?: string }) {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size="small" color={BrandColors.primary} />
      <Text style={styles.inlineText}>{message}</Text>
    </View>
  );
}

/**
 * Skeleton loader pour les cartes
 */
export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  inlineText: {
    fontSize: 12,
    color: '#999',
  },
  skeletonCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  skeletonLineShort: {
    width: '60%',
  },
  skeletonLineMedium: {
    width: '80%',
  },
});
