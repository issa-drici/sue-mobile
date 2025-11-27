# Guide d'utilisation du système de design

Ce guide explique comment utiliser les nouveaux composants et tokens de design pour maintenir la cohérence et réduire la duplication de code.

## 🎨 Tokens de design

### Import et utilisation

```typescript
import { DesignTokens } from '../constants/DesignSystem';

// Utilisation des espacements
paddingHorizontal: DesignTokens.spacing.md, // 16px
marginVertical: DesignTokens.spacing.lg,     // 24px

// Utilisation des couleurs
backgroundColor: DesignTokens.colors.primary,
color: DesignTokens.colors.textSecondary,

// Utilisation de la typographie
...DesignTokens.typography.h3,
fontSize: DesignTokens.typography.body.fontSize,

// Utilisation des ombres
...DesignTokens.shadows.md,

// Utilisation des rayons de bordure
borderRadius: DesignTokens.borderRadius.lg,
```

### Helpers disponibles

```typescript
import { getSpacing, getColor, getTypography } from '../constants/DesignSystem';

const padding = getSpacing('md');        // 16
const color = getColor('primary');       // '#your-primary-color'
const typography = getTypography('h3');  // { fontSize: 20, fontWeight: '600', ... }
```

## 🧱 Styles communs

### Import et utilisation

```typescript
import { CommonStyles, TextStyles } from '../styles/CommonStyles';

// Layouts courants
<View style={CommonStyles.container}>           // Container principal d'écran
<View style={CommonStyles.centerContent}>      // Centrage complet
<View style={CommonStyles.row}>                // Layout horizontal
<View style={CommonStyles.rowBetween}>         // Horizontal avec space-between

// Cartes et conteneurs
<View style={CommonStyles.card}>               // Carte de base
<View style={CommonStyles.cardElevated}>       // Carte avec ombre

// Boutons
<TouchableOpacity style={CommonStyles.buttonPrimary}>
  <Text style={CommonStyles.buttonPrimaryText}>Texte</Text>
</TouchableOpacity>

// États vides
<View style={CommonStyles.emptyStateContainer}>
  <Text style={CommonStyles.emptyStateTitle}>Titre</Text>
  <Text style={CommonStyles.emptyStateSubtitle}>Sous-titre</Text>
</View>

// Typographie
<Text style={TextStyles.h1}>Titre principal</Text>
<Text style={TextStyles.body}>Texte normal</Text>
<Text style={TextStyles.caption}>Texte secondaire</Text>
```

## 📱 Composant ScreenLayout

### Utilisation de base

```typescript
import { ScreenLayout, MainScreenLayout, BackScreenLayout } from '../components/ui';

// Layout principal (sans bouton retour)
<MainScreenLayout title="Mon Écran">
  {/* Contenu de l'écran */}
</MainScreenLayout>

// Layout avec bouton retour
<BackScreenLayout title="Détails" onBackPress={() => router.back()}>
  {/* Contenu de l'écran */}
</BackScreenLayout>

// Layout personnalisé
<ScreenLayout
  title="Titre"
  showBackButton={true}
  rightAction={<MonBouton />}
  scrollable={true}
  horizontalPadding="md"
>
  {/* Contenu scrollable avec padding */}
</ScreenLayout>
```

### Props disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Titre affiché dans le header |
| `showBackButton` | `boolean` | `false` | Afficher le bouton retour |
| `rightAction` | `ReactNode` | - | Action à droite du header |
| `scrollable` | `boolean` | `false` | Rendre le contenu scrollable |
| `showHeader` | `boolean` | `true` | Afficher le header |
| `horizontalPadding` | `SpacingKey` | - | Padding horizontal du contenu |
| `onBackPress` | `function` | - | Callback personnalisé pour le retour |

### Variantes pré-configurées

```typescript
// Pour les écrans principaux
<MainScreenLayout title="Accueil" rightAction={<CreateButton />}>

// Pour les écrans de détail
<BackScreenLayout title="Détails de la session">

// Pour les écrans avec contenu scrollable
<ScrollableScreenLayout title="Formulaire">

// Pour les modales
<ModalScreenLayout title="Confirmation">
```

## 🃏 Composant Card

### Utilisation de base

```typescript
import { Card, ElevatedCard, TouchableCard } from '../components/ui';

// Carte simple
<Card>
  <Text>Contenu de la carte</Text>
</Card>

// Carte touchable
<Card onPress={() => navigation.navigate('Details')}>
  <Text>Carte cliquable</Text>
</Card>

// Carte avec variante
<Card variant="elevated" padding="lg">
  <Text>Carte avec ombre et plus de padding</Text>
</Card>
```

### Props disponibles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'flat' \| 'elevated' \| 'outlined'` | `'flat'` | Style visuel |
| `padding` | `SpacingKey` | `'md'` | Padding interne |
| `onPress` | `function` | - | Rend la carte touchable |
| `disabled` | `boolean` | `false` | Désactive la carte |
| `shadow` | `ShadowKey` | - | Ombre personnalisée |
| `borderRadius` | `BorderRadiusKey` | `'lg'` | Rayon des bordures |
| `margin` | `SpacingKey` | - | Marge externe |

### Variantes pré-configurées

```typescript
// Carte avec ombre prononcée
<ElevatedCard>
  <Text>Contenu important</Text>
</ElevatedCard>

// Carte avec bordure
<OutlinedCard>
  <Text>Contenu secondaire</Text>
</OutlinedCard>

// Carte touchable optimisée
<TouchableCard onPress={handlePress}>
  <Text>Carte interactive</Text>
</TouchableCard>

// Carte compacte
<CompactCard>
  <Text>Moins de padding</Text>
</CompactCard>

// Carte pour listes
<ListCard marginVertical="xs">
  <Text>Élément de liste</Text>
</ListCard>
```

## 🔄 Migration d'un écran existant

### Avant (pattern répétitif)

```typescript
export default function MonEcran() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Titre</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Titre</Text>
          <Text style={styles.cardText}>Contenu</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16 
  },
  title: { fontSize: 20, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: { 
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3
  },
  // ... 50+ lignes de styles répétitifs
});
```

### Après (avec le système de design)

```typescript
import { BackScreenLayout, Card } from '../components/ui';
import { TextStyles } from '../styles/CommonStyles';

export default function MonEcran() {
  return (
    <BackScreenLayout title="Mon Titre" scrollable horizontalPadding="md">
      <Card variant="elevated">
        <Text style={TextStyles.h4}>Titre</Text>
        <Text style={TextStyles.body}>Contenu</Text>
      </Card>
    </BackScreenLayout>
  );
}

// Plus besoin de StyleSheet ! 🎉
```

### Bénéfices de la migration

- **-80% de code** : Suppression des styles répétitifs
- **Cohérence garantie** : Utilisation des tokens standardisés
- **Maintenance simplifiée** : Changements centralisés
- **Développement accéléré** : Composants prêts à l'emploi

## 📋 Checklist de migration

### Pour chaque écran migré

- [ ] Remplacer `SafeAreaView + StatusBar + Header` par `ScreenLayout`
- [ ] Remplacer les cartes custom par le composant `Card`
- [ ] Utiliser `CommonStyles` au lieu des styles inline
- [ ] Remplacer les couleurs hardcodées par `DesignTokens.colors`
- [ ] Utiliser `TextStyles` pour la typographie
- [ ] Remplacer les espacements par `DesignTokens.spacing`
- [ ] Tester la fonctionnalité après migration
- [ ] Supprimer les styles obsolètes

### Patterns à rechercher et remplacer

| Ancien pattern | Nouveau pattern |
|----------------|-----------------|
| `backgroundColor: '#fff'` | `DesignTokens.colors.background` |
| `fontSize: 16, fontWeight: '600'` | `TextStyles.bodyMedium` |
| `padding: 16` | `DesignTokens.spacing.md` |
| `flexDirection: 'row', alignItems: 'center'` | `CommonStyles.row` |
| `justifyContent: 'center', alignItems: 'center'` | `CommonStyles.centerContent` |

## 🚀 Prochaines étapes

1. **Migrer les écrans restants** un par un
2. **Créer des composants métier** (SessionCard, UserCard, etc.)
3. **Ajouter le support du thème sombre**
4. **Documenter les nouveaux patterns**
5. **Former l'équipe** aux nouveaux composants

## 💡 Bonnes pratiques

### À faire ✅

- Toujours utiliser les tokens de design
- Préférer les composants génériques aux styles custom
- Documenter les nouveaux composants
- Tester après chaque migration

### À éviter ❌

- Créer de nouveaux styles inline
- Hardcoder des couleurs ou espacements
- Dupliquer la logique des composants existants
- Mélanger anciens et nouveaux patterns dans le même écran

---

**Besoin d'aide ?** Consultez les exemples dans `app/(tabs)/index.tsx` pour voir une migration complète en action.
