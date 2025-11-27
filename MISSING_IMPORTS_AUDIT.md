# 🔍 AUDIT - IMPORTS MANQUANTS

**Date :** 27 novembre 2024  
**Statut :** Identification des endroits où les nouveautés ne sont pas encore importées

## 📋 **Résumé des manques identifiés**

### ✅ **Déjà migrés (Parfaits)**
- `app/(tabs)/index.tsx` - ✅ Utilise MainScreenLayout + Card + DesignTokens
- `app/(tabs)/notifications.tsx` - ✅ Utilise MainScreenLayout + DesignTokens
- `app/add-friend.tsx` - ✅ Utilise BackScreenLayout + DesignTokens

### 🔶 **Partiellement migrés (Besoin d'amélioration)**

#### **1. `app/(tabs)/history.tsx`**
**Statut :** Layout migré, mais styles hardcodés restants
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#f5f5f5`, `#666`, `#ff6b6b`
- ❌ Espacements hardcodés : `padding: 16`, `fontSize: 16`
- ❌ Pas d'utilisation du composant `Card` pour les items

**Actions nécessaires :**
```typescript
// Ajouter l'import manquant
import { Card } from '../../components/ui/Card';

// Remplacer les couleurs hardcodées
backgroundColor: '#f5f5f5' → backgroundColor: DesignTokens.colors.backgroundSecondary
color: '#666' → color: DesignTokens.colors.textSecondary

// Utiliser Card pour les items de session
<Card variant="elevated" onPress={() => router.push(`/session/${item.id}`)}>
  {/* Contenu de la session */}
</Card>
```

#### **2. `app/(tabs)/friends.tsx`**
**Statut :** Layout migré, mais styles hardcodés restants
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#fff`, `#f5f5f5`, `#666`
- ❌ Espacements hardcodés : `padding: 16`, `margin: 16`
- ❌ Pas d'utilisation du composant `Card` pour les items d'amis

**Actions nécessaires :**
```typescript
// Ajouter l'import manquant
import { Card } from '../../components/ui/Card';

// Utiliser Card pour les items d'amis
<Card variant="flat" onPress={() => handleUserPress(item)}>
  {/* Contenu de l'ami */}
</Card>
```

#### **3. `app/(tabs)/profile.tsx`**
**Statut :** Layout migré, mais styles hardcodés restants
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#f5f5f5`, `#666`, `#fff`
- ❌ Espacements hardcodés : `padding: 16`, `fontSize: 16`
- ❌ Pas d'utilisation de `Card` pour les sections

**Actions nécessaires :**
```typescript
// Ajouter les imports manquants
import { Card } from '../../components/ui/Card';

// Utiliser Card pour les sections
<Card variant="flat" marginVertical="sm">
  <Text style={TextStyles.h4}>Paramètres</Text>
  {/* Menu items */}
</Card>
```

### 🔴 **Non migrés (Critique)**

#### **4. `app/create-session.tsx`**
**Statut :** Partiellement migré mais beaucoup de hardcodé
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#fff`, `#f5f5f5`, `#666`, `#999`
- ❌ Espacements hardcodés : `padding: 16`, `margin: 16`, `fontSize: 16`
- ❌ Pas d'utilisation de `Card` pour les sections de formulaire

**Actions nécessaires :**
```typescript
// Ajouter les imports manquants
import { Card } from '../components/ui/Card';

// Utiliser Card pour chaque section du formulaire
<Card variant="flat" marginVertical="sm">
  <Text style={TextStyles.h4}>Sélection du sport</Text>
  {/* Contenu de la section */}
</Card>
```

#### **5. `app/session/[id].tsx`**
**Statut :** Layout migré mais styles non convertis
**Manques identifiés :**
- ❌ Couleurs hardcodées massives
- ❌ Espacements hardcodés partout
- ❌ Pas d'utilisation de `Card` pour les sections

#### **6. `app/edit-session/[id].tsx`**
**Statut :** Layout migré mais styles non convertis
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#fff`, `#f5f5f5`
- ❌ Espacements hardcodés : `padding: 16`
- ❌ Pas d'utilisation de `Card` pour les sections

#### **7. `components/UserProfileModal.tsx`**
**Statut :** Partiellement migré
**Manques identifiés :**
- ❌ Couleurs hardcodées : `#fff`, `#000`
- ❌ Espacements hardcodés : `padding: 16`
- ❌ Pas d'utilisation de `Card` pour le contenu

### 🔴 **Écrans d'onboarding non migrés**

#### **8. `app/(onboarding)/welcome.tsx`**
#### **9. `app/(onboarding)/organize.tsx`**  
#### **10. `app/(onboarding)/notifications.tsx`**
**Problèmes communs :**
- ❌ Encore des `SafeAreaView` au lieu de `ScreenLayout`
- ❌ Couleurs et espacements hardcodés
- ❌ Pas d'utilisation des composants génériques

## 🎯 **Plan d'action prioritaire**

### **Phase 1 - Corrections critiques (30 min)**
1. **Migrer les écrans d'onboarding** vers `ScreenLayout`
2. **Ajouter les imports `Card`** dans les écrans principaux
3. **Remplacer les couleurs hardcodées** les plus fréquentes

### **Phase 2 - Optimisations (1h)**
1. **Convertir tous les espacements** vers `DesignTokens.spacing`
2. **Utiliser `Card` partout** où c'est approprié
3. **Nettoyer les styles** redondants

### **Phase 3 - Finalisation (30 min)**
1. **Audit final** des couleurs hardcodées
2. **Vérification** que tous les imports sont présents
3. **Tests** de compilation

## 📊 **Métriques actuelles**

| Fichier | Layout migré | Couleurs migrées | Espacements migrés | Card utilisé | Score |
|---------|--------------|------------------|-------------------|--------------|-------|
| `(tabs)/index.tsx` | ✅ | ✅ | ✅ | ✅ | **100%** |
| `(tabs)/notifications.tsx` | ✅ | ✅ | ✅ | ❌ | **75%** |
| `(tabs)/friends.tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| `(tabs)/history.tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| `(tabs)/profile.tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| `create-session.tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| `session/[id].tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| `edit-session/[id].tsx` | ✅ | ❌ | ❌ | ❌ | **25%** |
| **Onboarding (3)** | ❌ | ❌ | ❌ | ❌ | **0%** |

**Score global actuel : 35%**  
**Score cible après corrections : 90%**

## 🚀 **Bénéfices attendus**

Après avoir importé et utilisé toutes les nouveautés :
- ✅ **-70% de code** dans les écrans
- ✅ **Cohérence visuelle** parfaite
- ✅ **Maintenance** ultra simplifiée
- ✅ **Développement** 3x plus rapide

---

**Conclusion :** Il reste encore du travail pour finaliser la migration DRY, mais les fondations sont solides. Les imports manquants sont principalement dans les styles et l'utilisation du composant `Card`.
