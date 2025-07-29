# FR-20241220-003 - Autoriser tous les utilisateurs à inviter des amis à une session

## 📋 Informations générales

- **ID** : FR-20241220-003
- **Titre** : Autoriser tous les utilisateurs à inviter des amis à une session
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

Actuellement, seuls les organisateurs de sessions peuvent inviter des amis à leurs sessions. Cette restriction limite la capacité des participants à faire grandir la communauté et à partager leurs sessions avec leurs amis.

**Problème actuel** : Les participants ne peuvent pas inviter leurs amis à une session, même s'ils sont déjà participants acceptés.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Tous les utilisateurs authentifiés peuvent inviter des amis à une session
- [ ] Les utilisateurs non invités peuvent également inviter des amis
- [ ] La logique de filtrage des amis déjà participants reste inchangée
- [ ] Les notifications d'invitation sont envoyées normalement
- [ ] L'organisateur reste le seul à pouvoir modifier/supprimer la session

### Non-fonctionnels
- [ ] Performance : Pas d'impact sur les temps de réponse
- [ ] Sécurité : Vérification que l'utilisateur est authentifié
- [ ] Compatibilité : Rétrocompatible avec l'API existante

## 🔧 Modifications Backend

### 1. Endpoint : POST /sessions/{id}/invite

**Changement** : Modifier la logique d'autorisation

**Avant** :
```php
// Vérifier que l'utilisateur est l'organisateur
if ($session->organizer_id !== $user->id) {
    return response()->json([
        'success' => false,
        'error' => [
            'code' => 'FORBIDDEN',
            'message' => 'Vous n\'êtes pas autorisé à inviter des utilisateurs à cette session'
        ]
    ], 403);
}
```

**Après** :
```php
// Vérifier seulement que l'utilisateur est authentifié
if (!$user) {
    return response()->json([
        'success' => false,
        'error' => [
            'code' => 'UNAUTHORIZED',
            'message' => 'Vous devez être connecté pour inviter des utilisateurs'
        ]
    ], 401);
}
```

### 2. Logique métier

**Nouvelles règles** :
1. Tout utilisateur authentifié peut inviter des amis à une session
2. Les utilisateurs non invités peuvent inviter des amis
3. Les participants peuvent inviter des amis
4. L'organisateur peut toujours inviter des amis (comportement inchangé)

### 3. Validation

**Ajouts** :
- Vérifier que l'utilisateur est authentifié
- Vérifier que la session existe
- Vérifier que les utilisateurs à inviter existent
- Vérifier que les utilisateurs ne sont pas déjà participants

**Suppressions** :
- Vérification que l'utilisateur est l'organisateur

## 📝 Documentation API

### Mise à jour de la documentation

**Fichier** : `docs/api/sessions.md`

**Section** : "Règles métier"

**Avant** :
```
2. Seul l'organisateur peut inviter des utilisateurs à sa session
```

**Après** :
```
2. Tout utilisateur authentifié peut inviter des amis à une session
```

### Mise à jour des codes d'erreur

**Supprimer** :
- Erreur 403 "Vous n'êtes pas autorisé à inviter des utilisateurs à cette session"

**Conserver** :
- Erreur 401 "Vous devez être connecté pour inviter des utilisateurs"
- Erreur 404 "Session non trouvée"
- Erreur 400 "Données invalides"

## 🧪 Tests

### Tests unitaires
- [ ] Test d'invitation par un participant accepté
- [ ] Test d'invitation par un utilisateur non invité
- [ ] Test d'invitation par l'organisateur (rétrocompatibilité)
- [ ] Test d'invitation sans authentification (doit échouer)

### Tests d'intégration
- [ ] Test du flux complet d'invitation par différents types d'utilisateurs
- [ ] Test des notifications d'invitation
- [ ] Test de la validation des données

## 🔄 Migration

### Étapes de déploiement
1. [ ] Déployer les modifications backend
2. [ ] Mettre à jour la documentation API
3. [ ] Tester en environnement de staging
4. [ ] Déployer en production
5. [ ] Vérifier que le frontend fonctionne correctement

### Rollback
Si nécessaire, revenir à la logique précédente en restaurant la vérification d'organisateur.

## 📊 Impact

### Positif
- ✅ Amélioration de l'expérience utilisateur
- ✅ Augmentation de l'engagement communautaire
- ✅ Plus de flexibilité pour les participants

### Risques
- ⚠️ Potentiel spam d'invitations (mitigé par les limites existantes)
- ⚠️ Charge supplémentaire sur les notifications

## 🔗 Liens

- **Frontend** : Modification déjà effectuée dans `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md`
- **Tests** : À créer dans le backend 