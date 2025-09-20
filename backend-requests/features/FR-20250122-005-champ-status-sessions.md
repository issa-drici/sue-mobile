# Feature Request — Ajout du champ status aux sessions

## 📋 Informations générales

- **Titre :** Ajout du champ status aux sessions
- **ID :** FR-20250122-005
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 15/02/2025

## 🎯 Description

### Fonctionnalité demandée
Ajouter le champ `status` à tous les endpoints de sessions pour permettre l'affichage visuel des sessions annulées.

### Contexte
Le frontend a besoin du champ `status` pour afficher visuellement les sessions annulées. Actuellement, ce champ n'est pas toujours retourné par tous les endpoints de sessions, ce qui empêche l'affichage correct des indicateurs visuels.

### Cas d'usage
- Un utilisateur consulte la liste de ses sessions
- Une session a été annulée par l'organisateur
- Le frontend doit pouvoir afficher un indicateur visuel "ANNULÉE"
- Sans le champ `status`, l'utilisateur ne peut pas distinguer les sessions annulées

## 🔧 Spécifications techniques

### Endpoints concernés
Tous les endpoints qui retournent des sessions doivent inclure le champ `status` :

1. **GET /api/sessions** (liste des sessions)
2. **GET /api/sessions/{sessionId}** (détail d'une session)
3. **GET /api/sessions/history** (historique des sessions)
4. **POST /api/sessions** (création de session)
5. **PUT /api/sessions/{sessionId}** (modification de session)
6. **PATCH /api/sessions/{sessionId}/cancel** (annulation de session)

### Structure du champ status
```typescript
status: 'active' | 'cancelled' | 'completed'
```

- **`active`** : Session normale, en cours
- **`cancelled`** : Session annulée par l'organisateur
- **`completed`** : Session terminée (optionnel pour l'instant)

### Valeur par défaut
- **Valeur par défaut** : `'active'` pour les nouvelles sessions
- **Rétrocompatibilité** : Les sessions existantes sans status doivent être traitées comme `'active'`

## 📡 Format de réponse

### Exemple de session active
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-uuid",
      "sport": "tennis",
      "date": "2025-02-15",
      "time": "14:00",
      "location": "Tennis Club",
      "status": "active",
      "maxParticipants": 8,
      "organizer": {
        "id": "organizer-uuid",
        "firstname": "Jean",
        "lastname": "Dupont"
      },
      "participants": [
        {
          "id": "user-uuid",
          "firstname": "Marie",
          "lastname": "Martin",
          "status": "accepted"
        }
      ]
    }
  }
}
```

### Exemple de session annulée
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-uuid",
      "sport": "tennis",
      "date": "2025-02-15",
      "time": "14:00",
      "location": "Tennis Club",
      "status": "cancelled",
      "maxParticipants": 8,
      "organizer": {
        "id": "organizer-uuid",
        "firstname": "Jean",
        "lastname": "Dupont"
      },
      "participants": [
        {
          "id": "user-uuid",
          "firstname": "Marie",
          "lastname": "Martin",
          "status": "accepted"
        }
      ]
    }
  }
}
```

## 📱 Impact sur le mobile

### Écrans concernés
- **Liste des sessions** (`app/(tabs)/index.tsx`) : Affichage des cartes avec indicateur "ANNULÉE"
- **Historique des sessions** (`app/(tabs)/history.tsx`) : Affichage des sessions annulées
- **Détail de session** (`app/session/[id].tsx`) : Bannière "Session annulée" et désactivation des boutons

### Indicateurs visuels implémentés
- **Bannière rouge** : "Session annulée" dans le détail
- **Carte avec fond rouge** : Dans les listes
- **Texte barré** : Sport et date pour les sessions annulées
- **Boutons désactivés** : Aucune action possible sur les sessions annulées

### Tests à implémenter
- Test que le champ `status` est présent dans toutes les réponses
- Test que les sessions existantes ont `status: "active"` par défaut
- Test que les sessions annulées ont `status: "cancelled"`
- Test de rétrocompatibilité avec les anciennes sessions

## 🔄 Logique métier

### Migration des données existantes
1. **Sessions existantes** : Ajouter `status: "active"` par défaut
2. **Sessions annulées** : Mettre à jour avec `status: "cancelled"`
3. **Nouvelles sessions** : Créer avec `status: "active"`

### Validation
- **status** : Doit être une des valeurs autorisées (`active`, `cancelled`, `completed`)
- **Valeur par défaut** : `active` si non spécifié
- **Rétrocompatibilité** : Les sessions sans status doivent être traitées comme `active`

## 🧪 Tests de validation

### Tests positifs
1. Tous les endpoints retournent le champ `status`
2. Les nouvelles sessions ont `status: "active"`
3. Les sessions annulées ont `status: "cancelled"`
4. Les sessions existantes sont migrées avec `status: "active"`

### Tests négatifs
1. Endpoint sans champ `status` → Erreur
2. Valeur `status` invalide → Erreur de validation
3. Session existante sans status → Traitée comme `active`

## 📊 Impact

### Positif
- ✅ Affichage visuel correct des sessions annulées
- ✅ Meilleure expérience utilisateur
- ✅ Cohérence des données

### Risques
- ⚠️ Migration des données existantes
- ⚠️ Rétrocompatibilité avec les anciennes sessions

## 🔗 Liens

- **FR-20250122-004** : Annulation complète d'une session
- **Frontend** : `app/(tabs)/index.tsx`, `app/(tabs)/history.tsx`, `app/session/[id].tsx`
- **Types** : `types/sport.ts`
- **API Documentation** : `docs/api/sessions.md`
