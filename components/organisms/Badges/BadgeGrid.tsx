import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BrandColors } from '../../../constants/Colors';
import { Badge } from '../../../services/badges';
import { BADGE_IMAGES } from './badgeImages';

// Grille de badges : débloqués en couleur, les autres grisés avec leur progression.
// Un tap ouvre le détail (comment l'obtenir, où on en est).

interface BadgeGridProps {
  badges: Badge[];
  // true sur son propre profil : affiche la progression des badges à débloquer
  isMe?: boolean;
}

export function BadgeGrid({ badges, isMe = false }: BadgeGridProps) {
  const [detail, setDetail] = useState<Badge | null>(null);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <View>
      <Text style={styles.count}>
        {unlockedCount} / {badges.length} débloqué{unlockedCount > 1 ? 's' : ''}
      </Text>
      <View style={styles.grid}>
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            activeOpacity={0.8}
            style={styles.cell}
            onPress={() => {
              Haptics.selectionAsync();
              setDetail(badge);
            }}
          >
            <Image
              source={BADGE_IMAGES[badge.id]}
              style={[styles.medal, !badge.unlocked && styles.medalLocked]}
              resizeMode="contain"
            />
            <Text style={[styles.name, !badge.unlocked && styles.nameLocked]} numberOfLines={1}>
              {badge.name}
            </Text>
            {!badge.unlocked && isMe && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(badge.progress / badge.target) * 100}%` }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDetail(null)}>
          {detail && (
            <View style={styles.detailCard}>
              <Image
                source={BADGE_IMAGES[detail.id]}
                style={[styles.detailMedal, !detail.unlocked && styles.medalLocked]}
                resizeMode="contain"
              />
              <Text style={styles.detailName}>{detail.name}</Text>
              <Text style={styles.detailDescription}>{detail.description}</Text>
              {detail.unlocked ? (
                <Text style={styles.detailUnlocked}>
                  Débloqué{detail.unlockedAt ? ` le ${new Date(detail.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}
                </Text>
              ) : isMe ? (
                <Text style={styles.detailProgress}>{detail.progress} / {detail.target}</Text>
              ) : (
                <Text style={styles.detailProgress}>Pas encore débloqué</Text>
              )}
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  medal: {
    width: 58,
    height: 58,
  },
  medalLocked: {
    opacity: 0.25,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    marginTop: 6,
    textAlign: 'center',
  },
  nameLocked: {
    color: '#AEAEB2',
  },
  progressTrack: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFEFEF',
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: BrandColors.darkPink,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  detailCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  detailMedal: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  detailName: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
  },
  detailDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginTop: 6,
  },
  detailUnlocked: {
    fontSize: 13,
    fontWeight: '700',
    color: '#70A831',
    marginTop: 14,
  },
  detailProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 14,
  },
});
