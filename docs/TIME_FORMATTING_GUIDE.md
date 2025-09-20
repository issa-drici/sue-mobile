# Guide de formatage des heures

## Vue d'ensemble

Dans l'application Alarrache, **toutes les heures doivent être affichées au format `hh:mm`** (sans les secondes) pour une expérience utilisateur cohérente.

## Fonction utilitaire

### `formatTime(time: string)`

La fonction `formatTime` est disponible dans `utils/dateHelpers.ts` et doit être utilisée partout où une heure est affichée.

```typescript
import { formatTime } from '../../utils/dateHelpers';

// ❌ Incorrect - affiche hh:mm:ss
<Text>{session.time}</Text>

// ✅ Correct - affiche hh:mm
<Text>{formatTime(session.time)}</Text>
```

## Utilisation dans les composants

### 1. Affichage de session

```typescript
// Dans les cartes de session
<Text style={styles.dateTime}>
  {formatDate(session.date)} à {formatTime(session.time)}
</Text>
```

### 2. Affichage d'historique

```typescript
// Dans l'historique des sessions
<Text style={styles.date}>
  {formatDate(item.date)} à {formatTime(item.time)}
</Text>
```

### 3. Affichage de commentaires

```typescript
// Dans les commentaires
<Text style={styles.timeText}>
  {formatTime(timeString)}
</Text>
```

## Fichiers où le formatage est déjà implémenté

✅ **Déjà corrigés :**
- `app/(tabs)/index.tsx` - Liste des sessions
- `app/(tabs)/history.tsx` - Historique des sessions
- `app/session/[id].tsx` - Détail d'une session
- `app/create-session.tsx` - Création de session
- `components/ChatComments.tsx` - Commentaires

## Vérification automatique

Un script de vérification est disponible pour s'assurer que toutes les heures sont bien formatées :

```bash
node scripts/check-time-formatting.js
```

## Règles à respecter

1. **Jamais afficher `{session.time}` directement** dans un composant d'affichage
2. **Toujours utiliser `{formatTime(session.time)}`** pour l'affichage
3. **Le format final doit être `hh:mm`** (ex: "14:30", "09:15")
4. **Importer `formatTime`** depuis `utils/dateHelpers` dans chaque fichier qui l'utilise

## Exemples de bonnes pratiques

### ✅ Bon

```typescript
import { formatDate, formatTime } from '../../utils/dateHelpers';

<Text>
  {formatDate(session.date)} à {formatTime(session.time)}
</Text>
```

### ❌ Mauvais

```typescript
// Pas d'import de formatTime
<Text>
  {formatDate(session.date)} à {session.time}
</Text>

// Affichage direct sans formatage
<Text>{item.time}</Text>
```

## Maintenance

- Relancer le script de vérification après chaque modification
- Vérifier que les nouvelles fonctionnalités respectent ce formatage
- Maintenir la cohérence dans toute l'application

## Support

Si vous avez des questions sur le formatage des heures, consultez :
- `utils/dateHelpers.ts` - Implémentation des fonctions
- `scripts/check-time-formatting.js` - Script de vérification
- Ce guide de documentation
