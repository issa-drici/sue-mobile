# 🧬 ATOMS - Composants de base

Les **atoms** sont les plus petits composants de notre design system. Ils ne peuvent pas être décomposés davantage et servent de briques de base pour construire des composants plus complexes.

## 🎯 **Utilisation**

```typescript
import { Button, Text, Icon } from '../atoms';

// Exemple d'utilisation
<Button 
  title="Créer une session"
  variant="primary"
  size="lg"
  onPress={() => console.log('Pressed!')}
/>

<Text variant="h2" color="primary">
  Titre principal
</Text>

<Icon 
  name="calendar"
  size="lg"
  color="primary"
/>
```

## 📦 **Atoms disponibles**

### **Button**
- **Variantes :** `primary`, `secondary`, `outline`, `ghost`, `danger`
- **Tailles :** `sm`, `md`, `lg`
- **États :** `disabled`, `loading`
- **Options :** `fullWidth`

### **Text**
- **Variantes :** `h1`, `h2`, `h3`, `h4`, `h5`, `subtitle`, `body`, `caption`, `small`
- **Couleurs :** `primary`, `secondary`, `tertiary`, `inverse`, `error`, `success`, `warning`
- **Alignement :** `left`, `center`, `right`, `justify`
- **Poids :** `normal`, `medium`, `semibold`, `bold`

### **Icon**
- **Tailles :** `xs`, `sm`, `md`, `lg`, `xl`, `xxl`
- **Couleurs :** `primary`, `secondary`, `tertiary`, `inverse`, `error`, `success`, `warning`, `info`
- **Icônes pré-configurées :** `BackIcon`, `CloseIcon`, `SearchIcon`, `AddIcon`, etc.

## 🎨 **Exemples complets**

```typescript
// Boutons
<PrimaryButton title="Confirmer" onPress={handleConfirm} />
<SecondaryButton title="Annuler" onPress={handleCancel} />
<OutlineButton title="En savoir plus" onPress={handleLearnMore} />

// Textes
<Heading1>Titre principal</Heading1>
<Subtitle color="secondary">Sous-titre</Subtitle>
<Body>Texte de contenu normal</Body>
<Caption color="tertiary">Petite note</Caption>

// Icônes
<BackIcon size="lg" />
<SearchIcon color="primary" />
<AddIcon size="xl" color="success" />
```

## 🔗 **Intégration avec DesignTokens**

Tous les atoms utilisent automatiquement les **DesignTokens** pour :
- ✅ Couleurs cohérentes
- ✅ Espacements standardisés  
- ✅ Typographie unifiée
- ✅ Tailles d'icônes normalisées

## 🚀 **Prochaines étapes**

Ces atoms serviront de base pour créer :
1. **Molecules** - Combinaisons d'atoms (SearchBar, UserItem, etc.)
2. **Organisms** - Sections complexes (SessionCard, Header, etc.)
3. **Templates** - Layouts de pages complètes
