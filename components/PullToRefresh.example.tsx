import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefresh from './PullToRefresh';

/**
 * Exemple d'utilisation du composant PullToRefresh et du hook usePullToRefresh
 * 
 * Ce fichier montre comment implémenter le pull-to-refresh
 * dans différents contextes de l'application.
 */

// Exemple 1: Utilisation basique avec le composant PullToRefresh
const BasicPullToRefreshExample: React.FC = () => {
  const [data, setData] = React.useState<string[]>(['Item 1', 'Item 2', 'Item 3']);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData(['Nouvel Item 1', 'Nouvel Item 2', 'Nouvel Item 3']);
    setRefreshing(false);
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      keyExtractor={(item, index) => index.toString()}
      refreshControl={
        <PullToRefresh
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    />
  );
};

// Exemple 2: Utilisation avec le hook usePullToRefresh
const HookPullToRefreshExample: React.FC = () => {
  const [data, setData] = React.useState<string[]>(['Item 1', 'Item 2', 'Item 3']);

  const refreshData = async () => {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData(['Nouvel Item 1', 'Nouvel Item 2', 'Nouvel Item 3']);
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: refreshData,
    onError: (error) => {
    }
  });

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      keyExtractor={(item, index) => index.toString()}
      refreshControl={
        <PullToRefresh
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    />
  );
};

// Exemple 3: Utilisation avec couleur personnalisée
const CustomColorPullToRefreshExample: React.FC = () => {
  const [data, setData] = React.useState<string[]>(['Item 1', 'Item 2', 'Item 3']);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData(['Nouvel Item 1', 'Nouvel Item 2', 'Nouvel Item 3']);
    setRefreshing(false);
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      keyExtractor={(item, index) => index.toString()}
      refreshControl={
        <PullToRefresh
          refreshing={refreshing}
          onRefresh={handleRefresh}
          color="#FF6B6B" // Couleur personnalisée
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontSize: 16,
  },
});

export {
    BasicPullToRefreshExample, CustomColorPullToRefreshExample, HookPullToRefreshExample
};

/**
 * GUIDE D'UTILISATION
 * 
 * 1. COMPOSANT PULLTOREFRESH :
 *    - Utilisez le composant PullToRefresh pour une configuration rapide
 *    - Couleur par défaut : #007AFF (bleu de l'app)
 *    - Message par défaut : "Tirez pour rafraîchir"
 * 
 * 2. HOOK USEPULLTOREFRESH :
 *    - Utilisez le hook pour une gestion plus avancée
 *    - Gestion automatique de l'état refreshing
 *    - Logs automatiques pour le debug
 *    - Gestion d'erreur intégrée
 * 
 * 3. IMPLÉMENTATION DANS LES ÉCRANS :
 * 
 *    // Dans un écran avec FlatList
 *    const { data, refetch } = useGetSessions();
 *    const { refreshing, onRefresh } = usePullToRefresh({
 *      onRefresh: refetch,
 *      onError: (error) => Alert.alert('Erreur', 'Impossible de rafraîchir')
 *    });
 * 
 *    return (
 *      <FlatList
 *        data={data}
 *        renderItem={renderItem}
 *        refreshControl={
 *          <PullToRefresh
 *            refreshing={refreshing}
 *            onRefresh={onRefresh}
 *          />
 *        }
 *      />
 *    );
 * 
 * 4. ÉCRANS COMPATIBLES :
 *    - ✅ Sessions (index.tsx)
 *    - ✅ Amis (friends.tsx)
 *    - ✅ Notifications (notifications.tsx)
 *    - ✅ Historique (history.tsx)
 *    - ✅ Profil (profile.tsx)
 */ 