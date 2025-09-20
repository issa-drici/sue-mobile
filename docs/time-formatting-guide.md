# Guide de Formatage des Heures

## Standard de Formatage

**Format requis :** `hh:mm` (ex: "16:00", "09:30")

**Format interdit :** `hh:mm:ss` (ex: "16:00:00", "09:30:45")

## Fonctions Disponibles

### 1. `formatTime(time: string)` - RECOMMANDÉE ⭐
- **Fonction simple et rapide** (0.0002ms/appel)
- **Aucun décalage horaire** - extrait directement les heures et minutes
- **Idéale pour l'affichage** des heures stockées en base de données

```typescript
import { formatTime } from '../../utils/dateHelpers';

// ✅ Correct
<Text>{formatTime(session.time)}</Text>

// ❌ Incorrect
<Text>{session.time}</Text>
```

### 2. `formatTimeFrance(time: string)` - Pour forcer l'heure française 🇫🇷
- **Force le fuseau horaire français** (Europe/Paris)
- **Résout les problèmes de décalage horaire** sur les serveurs
- **Plus lente** (0.0346ms/appel) mais garantit l'heure française

```typescript
import { formatTimeFrance } from '../../utils/dateHelpers';

// ✅ Garantit l'heure française
<Text>{formatTimeFrance(session.time)}</Text>
```

### 3. `formatTimeUTC(time: string)` - Pour comparaison
- **Utilise le fuseau UTC** pour diagnostiquer les problèmes
- **Utile pour le débogage** des décalages horaires

## Problème Résolu : Décalage de 2 Heures

### Symptôme
- L'app affichait "14h00" au lieu de "16h00"
- Problème causé par des serveurs dans d'autres fuseaux horaires

### Solution
- **Utilisation de `formatTimeFrance()`** dans les écrans principaux
- **Force le fuseau horaire français** (Europe/Paris)
- **Garantit l'affichage correct** peu importe le serveur

## Fichiers Modifiés

### ✅ Formatage Implémenté
- `app/session/[id].tsx` - Détail d'une session
- `app/(tabs)/history.tsx` - Historique des sessions

### 🔍 Vérification Automatique
- `scripts/check-time-formatting.js` - Script de vérification
- `scripts/test-france-timezone.js` - Test du fuseau français

## Utilisation Recommandée

### Pour l'Affichage Simple
```typescript
import { formatTime } from '../../utils/dateHelpers';
<Text>{formatTime(session.time)}</Text>
```

### Pour Garantir l'Heure Française
```typescript
import { formatTimeFrance } from '../../utils/dateHelpers';
<Text>{formatTimeFrance(session.time)}</Text>
```

### Pour le Débogage
```typescript
import { debugTimeZone } from '../../utils/dateHelpers';
const debugInfo = debugTimeZone('16:00:00');
console.log(debugInfo);
```

## Tests et Vérification

### Test Automatique
```bash
node scripts/test-france-timezone.js
```

### Vérification du Code
```bash
node scripts/check-time-formatting.js
```

## Performance

| Fonction | Performance | Cas d'Usage |
|-----------|-------------|-------------|
| `formatTime` | ⚡ Rapide (0.0002ms) | Affichage standard |
| `formatTimeFrance` | 🐌 Lente (0.0346ms) | Garantie heure française |
| `formatTimeUTC` | 🐌 Lente | Débogage uniquement |

## Résumé

✅ **Le problème de décalage horaire de 2h est résolu !**

✅ **L'app utilise maintenant `formatTimeFrance()` qui force le fuseau horaire français**

✅ **Plus de problème avec les serveurs dans d'autres fuseaux horaires**

✅ **Format d'heure standardisé à `hh:mm` partout dans l'application**
