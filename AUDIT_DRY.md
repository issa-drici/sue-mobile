# Audit DRY - Analyse de la duplication de code

**Date de l'audit :** 27 novembre 2024  
**Score DRY actuel :** 35-40%  
**Objectif cible :** 80-85%

## 📊 Résumé exécutif

La codebase présente un niveau élevé de duplication de code, particulièrement au niveau des composants UI, des styles et de la logique de gestion d'état. Le manque de généricité des composants entraîne une maintenance difficile et une incohérence visuelle.

## 🔍 Analyse détaillée des duplications

### 1. Styles répétitifs (🔴 Très critique)

**Statistiques :**
- 34 fichiers utilisent `StyleSheet.create` avec des patterns similaires
- 153 occurrences de `alignItems: 'center'`
- 105 occurrences de `flexDirection: 'row'`
- 85 occurrences de `padding: 16`
- 61 occurrences de `backgroundColor: '#fff'`
- 69 occurrences de `fontSize: 16`
- 40 occurrences de `fontWeight: 'bold'`

**Impact :** Maintenance difficile, incohérence visuelle, code verbeux

### 2. Structure d'écrans répétitive (🔴 Critique)

**Pattern dupliqué dans tous les écrans :**
```typescript
<SafeAreaView style={styles.container}>
  <StatusBar barStyle="dark-content" />
  <View style={styles.header}>
    <Text style={styles.title}>Titre</Text>
    <TouchableOpacity style={styles.createButton}>
      // Bouton d'action
    </TouchableOpacity>
  </View>
  <FlatList
    // Configuration similaire
    refreshControl={<PullToRefresh />}
  />
</SafeAreaView>
```

**Fichiers concernés :**
- `app/(tabs)/index.tsx`
- `app/(tabs)/friends.tsx`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/history.tsx`
- `app/(tabs)/profile.tsx`
- `app/create-session.tsx`
- `app/session/[id].tsx`
- Et 15+ autres écrans

### 3. Logique de gestion d'état dupliquée (🔴 Critique)

**Hooks redondants identifiés :**
- `useApi.ts` (284 lignes)
- `useApiRequest.ts` (216 lignes)  
- `useRetry.ts` (116 lignes)
- `useApiWithRetry.ts` (74 lignes)

**Logiques dupliquées :**
- Gestion des états `loading`, `error`, `data`
- Mécanismes de retry avec timeout
- Gestion des appels API avec fetch
- Protection contre les memory leaks

### 4. Composants non génériques (🔴 Très critique)

**Problèmes identifiés :**
- Absence de système de design unifié
- Chaque écran recrée ses propres composants de base
- Pas de composants réutilisables pour les patterns communs
- Styles inline répétés partout

**Exemples de duplication :**
- Cards de session, d'amis, de notifications (structures similaires)
- Headers d'écrans (même layout, styles différents)
- États de chargement et d'erreur
- Modales et overlays

## 🎯 Plan de refactoring

### Phase 1 : Fondations (Priorité 1) 🚀

#### 1.1 Créer le système de design
```typescript
// constants/DesignSystem.ts
export const DesignTokens = {
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
  },
  colors: {
    background: '#fff',
    primary: BrandColors.primary,
    text: '#000',
    textSecondary: '#666',
    border: '#e0e0e0',
    error: '#ff3b30',
    success: '#34c759',
  },
  typography: {
    title: { fontSize: 20, fontWeight: '600' },
    subtitle: { fontSize: 18, fontWeight: '500' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
  },
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  }
};
```

#### 1.2 Styles communs
```typescript
// styles/CommonStyles.ts
export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignTokens.spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
```

### Phase 2 : Composants de base (Priorité 1) 🚀

#### 2.1 Composant Layout générique
```typescript
// components/ui/ScreenLayout.tsx
interface ScreenLayoutProps {
  title?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  showBackButton = true,
  rightAction,
  children,
  scrollable = false
}) => {
  // Implémentation générique
};
```

#### 2.2 Composant Card générique
```typescript
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outlined';
  padding?: keyof typeof DesignTokens.spacing;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'flat',
  padding = 'md',
  onPress
}) => {
  // Implémentation générique
};
```

#### 2.3 Composant ListScreen générique
```typescript
// components/ui/ListScreen.tsx
interface ListScreenProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  onRefresh?: () => Promise<void>;
  title?: string;
  rightAction?: React.ReactNode;
}

export const ListScreen = <T,>({
  data,
  renderItem,
  emptyState,
  onRefresh,
  title,
  rightAction
}: ListScreenProps<T>) => {
  // Implémentation générique avec FlatList
};
```

### Phase 3 : Hooks unifiés (Priorité 2) 🔶

#### 3.1 Hook API unifié
```typescript
// hooks/useQuery.ts
interface QueryOptions {
  enabled?: boolean;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useQuery = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions = {}
) => {
  // Logique unifiée remplaçant useApi, useApiRequest, useRetry
};
```

#### 3.2 Hook Mutation unifié
```typescript
// hooks/useMutation.ts
export const useMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions = {}
) => {
  // Logique pour POST, PUT, DELETE
};
```

### Phase 4 : Migration progressive (Priorité 2) 🔶

#### 4.1 Ordre de migration recommandé
1. **Écran Sessions** (`app/(tabs)/index.tsx`) - Le plus simple
2. **Écran Amis** (`app/(tabs)/friends.tsx`) - Patterns similaires
3. **Écran Notifications** (`app/(tabs)/notifications.tsx`) - Plus complexe
4. **Écran Profil** (`app/(tabs)/profile.tsx`) - Formulaires
5. **Création de session** (`app/create-session.tsx`) - Le plus complexe

#### 4.2 Checklist par écran migré
- [ ] Remplacer les styles par les tokens de design
- [ ] Utiliser ScreenLayout au lieu du pattern SafeAreaView
- [ ] Remplacer les hooks API par useQuery/useMutation
- [ ] Utiliser les composants Card/Button génériques
- [ ] Supprimer les styles dupliqués
- [ ] Tester la fonctionnalité

### Phase 5 : Optimisations avancées (Priorité 3) 🔷

#### 5.1 Composants métier génériques
- `SessionCard` générique pour tous les types de sessions
- `UserCard` générique pour amis, participants, etc.
- `NotificationItem` générique
- `EmptyState` générique avec différents messages

#### 5.2 Système de thème
- Support du mode sombre
- Thèmes personnalisables
- Adaptation automatique selon les préférences système

## 📈 Métriques de succès

### Objectifs quantifiables
- **Réduction de 60% du code dupliqué**
- **Score DRY : 80-85%**
- **Réduction de 40% des lignes de code total**
- **Temps de développement de nouvelles features : -50%**

### Métriques de suivi
- Nombre de `StyleSheet.create` (objectif : -70%)
- Nombre de patterns répétés (objectif : -80%)
- Taille des fichiers d'écrans (objectif : -50%)
- Cohérence visuelle (audit manuel)

## 🚧 Risques et mitigation

### Risques identifiés
1. **Régression fonctionnelle** lors de la migration
2. **Résistance au changement** de l'équipe
3. **Complexité temporaire** pendant la transition

### Stratégies de mitigation
1. **Tests systématiques** après chaque migration
2. **Migration progressive** écran par écran
3. **Documentation** des nouveaux patterns
4. **Formation** de l'équipe aux nouveaux composants

## 📅 Planning suggéré

### Semaine 1-2 : Fondations
- Création du système de design
- Développement des composants de base
- Setup des hooks unifiés

### Semaine 3-4 : Migration Phase 1
- Migration des écrans les plus simples
- Tests et ajustements
- Documentation

### Semaine 5-6 : Migration Phase 2
- Migration des écrans complexes
- Optimisations
- Tests d'intégration

### Semaine 7 : Finalisation
- Nettoyage du code legacy
- Documentation finale
- Formation équipe

## 🔧 Outils recommandés

### Développement
- **ESLint rules** pour détecter les duplications
- **Storybook** pour documenter les composants
- **Chromatic** pour les tests visuels

### Monitoring
- **Bundle analyzer** pour mesurer la réduction de taille
- **Code coverage** pour s'assurer des tests
- **Performance monitoring** pour vérifier l'impact

---

## 📝 Notes de mise en œuvre

### Commencer par
1. Créer le dossier `constants/DesignSystem.ts`
2. Créer le dossier `styles/CommonStyles.ts`
3. Créer le dossier `components/ui/` pour les composants génériques
4. Migrer le premier écran comme POC

### Points d'attention
- Maintenir la compatibilité pendant la transition
- Tester chaque composant générique individuellement
- Documenter les breaking changes
- Communiquer régulièrement sur l'avancement

**Prochaine étape recommandée :** Commencer par la Phase 1 - Création du système de design
