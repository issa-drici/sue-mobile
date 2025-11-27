import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Button, Icon } from '../../components/atoms';
import { EmptyState, SessionCard } from '../../components/molecules';
import PullToRefresh from '../../components/PullToRefresh';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { DesignTokens } from '../../constants/DesignSystem';
import { usePullToRefresh } from '../../hooks';
import { useGetSessions } from '../../services';
import { CommonStyles, TextStyles } from '../../styles/CommonStyles';

import { InlineLoading } from '../../components/OptimizedLoading';


export default function HomeScreen() {
  const router = useRouter();
  const { data: sessions, isLoading, error, refetch } = useGetSessions();



  // Utilisation du nouveau hook avec délai minimum
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
    minDelay: 1000, // Délai minimum de 1 seconde
    onError: (error) => {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  });

  // Debug: Afficher les informations des sessions
  React.useEffect(() => {
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
      });
    }
  }, [sessions]);




  // Optimisation : Ne pas afficher d'écran de chargement séparé
  // Toujours afficher l'interface, le loading est géré par le pull-to-refresh et les états vides
  // Cela évite les écrans de chargement bloquants entre les transitions

  // Bouton de création de session pour le header
  const CreateSessionButton = () => (
    <Button
      title="Nouvelle Session"
      onPress={() => router.push('/create-session')}
      leftIcon={<Icon name="add-circle" size="md" color="textInverse" />}
      size="sm"
    />
  );

  return (
    <MainScreenLayout
      title="Mes Sessions"
      rightAction={<CreateSessionButton />}
      containerStyle={CommonStyles.container}
    >

      <FlatList
        data={sessions}
        renderItem={({ item }) => (
          <SessionCard 
            session={{
              id: item.id,
              title: item.sport.charAt(0).toUpperCase() + item.sport.slice(1),
              sport: item.sport,
              location: item.location,
              startTime: item.startTime,
              maxParticipants: item.maxParticipants || undefined,
              participants: item.participants,
              status: item.status,
            }}
          />
        )}
        keyExtractor={(item) => item.id || `session-${Math.random()}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          isLoading ? (
            <InlineLoading message="Chargement des sessions..." />
          ) : error ? (
            <EmptyState
              variant="error"
              title="Erreur de chargement"
              subtitle={error}
            />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="Aucune session trouvée"
              subtitle="Créez votre première session !"
              actionTitle="Créer une session"
              onAction={() => router.push('/create-session')}
            />
          )
        }
        refreshControl={
          <PullToRefresh
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Bouton de création de session
  createButton: {
    ...CommonStyles.buttonPrimary,
    borderRadius: DesignTokens.borderRadius.xxl,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
  },
  
  // Container de la liste
  listContainer: {
    padding: DesignTokens.spacing.md,
  },
  
  // Styles pour les cartes de session
  sportEmojiContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
    borderBottomLeftRadius: DesignTokens.borderRadius.lg,
    width: 50,
    height: 50,
    ...CommonStyles.centerContent,
    borderWidth: 1,
    borderColor: DesignTokens.colors.borderLight,
    ...DesignTokens.shadows.sm,
  },
  sportEmoji: {
    fontSize: DesignTokens.iconSizes.lg,
  },
  cancelledCard: {
    backgroundColor: '#ffebee',
    borderColor: DesignTokens.colors.error,
    borderWidth: 1,
  },
  cancelledBanner: {
    ...CommonStyles.rowCenter,
    backgroundColor: DesignTokens.colors.error,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    borderRadius: DesignTokens.borderRadius.md,
    marginTop: DesignTokens.spacing.md,
  },
  cancelledText: {
    ...TextStyles.small,
    color: DesignTokens.colors.textInverse,
    fontWeight: 'bold',
    marginLeft: DesignTokens.spacing.sm,
  },
  cardHeader: {
    marginBottom: DesignTokens.spacing.md,
  },
  sportTitle: {
    ...TextStyles.h4,
    color: DesignTokens.colors.primary,
    marginBottom: DesignTokens.spacing.xs,
  },
  date: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
  },
  locationContainer: {
    ...CommonStyles.row,
    marginBottom: DesignTokens.spacing.md,
  },
  location: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
    marginLeft: DesignTokens.spacing.xs,
  },
  participantsContainer: {
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border,
    paddingTop: DesignTokens.spacing.md,
  },
  participantsTitle: {
    ...TextStyles.bodyMedium,
    marginBottom: DesignTokens.spacing.sm,
  },
  participantsList: {
    gap: DesignTokens.spacing.sm,
  },
  participant: {
    ...CommonStyles.rowBetween,
  },
  participantName: {
    ...TextStyles.caption,
    color: DesignTokens.colors.text,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: DesignTokens.borderRadius.round,
    ...CommonStyles.centerContent,
  },
  statusText: {
    ...TextStyles.small,
    color: DesignTokens.colors.textInverse,
    fontWeight: 'bold',
  },
  noParticipantsText: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.sm,
  },
  commentsContainer: {
    ...CommonStyles.row,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border,
    paddingTop: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.md,
  },
  commentsCount: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
    marginLeft: DesignTokens.spacing.xs,
  },
});
