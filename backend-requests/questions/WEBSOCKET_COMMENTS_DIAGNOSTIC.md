# 🔍 Diagnostic WebSocket - Commentaires en Temps Réel

## 📋 Contexte

**Problème identifié :** Les commentaires ne s'affichent pas en temps réel via WebSocket. Les utilisateurs doivent fermer/rouvrir le chat pour voir les nouveaux commentaires.

**Impact :** Expérience utilisateur dégradée - pas de communication fluide en temps réel.

## 🎯 Questions pour l'équipe Backend

### 1. **Configuration WebSocket**

#### 1.1 Serveur WebSocket
- [ ] **Q1.1** : Le serveur WebSocket `https://websocket.sue.alliance-tech.fr` est-il opérationnel ?
- [ ] **Q1.2** : Quel port utilise le serveur WebSocket ? (443, 6001, autre ?)
- [ ] **Q1.3** : Le serveur WebSocket utilise-t-il Socket.IO ou une autre technologie ?
- [ ] **Q1.4** : Y a-t-il des logs d'erreur sur le serveur WebSocket ?

#### 1.2 Configuration Laravel Broadcasting
- [ ] **Q1.5** : Laravel Broadcasting est-il configuré et activé ?
- [ ] **Q1.6** : Quel driver de broadcasting est utilisé ? (Redis, Pusher, Laravel WebSockets, autre ?)
- [ ] **Q1.7** : Le fichier `config/broadcasting.php` est-il configuré correctement ?

### 2. **Événements WebSocket**

#### 2.1 Événements de Commentaires
- [ ] **Q2.1** : L'événement `comment.created` est-il émis lors de la création d'un commentaire ?
- [ ] **Q2.2** : L'événement `comment.updated` est-il émis lors de la modification d'un commentaire ?
- [ ] **Q2.3** : L'événement `comment.deleted` est-il émis lors de la suppression d'un commentaire ?

#### 2.2 Format des Événements
- [ ] **Q2.4** : Quel est le format exact des événements émis ? Exemple :
  ```json
  {
    "event": "comment.created",
    "data": {
      "comment": {
        "id": "123",
        "content": "Contenu du commentaire",
        "user": {
          "id": "456",
          "firstname": "John",
          "lastname": "Doe"
        },
        "created_at": "2025-01-22T10:30:00Z"
      }
    }
  }
  ```

#### 2.3 Canaux de Diffusion
- [ ] **Q2.5** : Sur quel(s) canal(aux) les événements sont-ils diffusés ?
- [ ] **Q2.6** : Le format du canal est-il `session.{sessionId}` ou autre ?

### 3. **Authentification WebSocket**

#### 3.1 Token d'Authentification
- [ ] **Q3.1** : Comment l'authentification WebSocket est-elle gérée ?
- [ ] **Q3.2** : Le token JWT est-il validé côté WebSocket ?
- [ ] **Q3.3** : Y a-t-il des erreurs d'authentification dans les logs ?

#### 3.2 Rejoindre une Session
- [ ] **Q3.4** : L'événement `join-session` est-il traité correctement ?
- [ ] **Q3.5** : Les utilisateurs sont-ils bien ajoutés au canal de la session ?

### 4. **Code Backend**

#### 4.1 Contrôleur de Commentaires
- [ ] **Q4.1** : Dans `CommentController@store`, y a-t-il un appel à `broadcast()` ?
  ```php
  // Exemple attendu
  $comment = Comment::create([...]);
  broadcast(new CommentCreated($comment))->toOthers();
  ```

#### 4.2 Classes d'Événements
- [ ] **Q4.2** : Les classes `CommentCreated`, `CommentUpdated`, `CommentDeleted` existent-elles ?
- [ ] **Q4.3** : Ces classes implémentent-elles `ShouldBroadcast` ou `ShouldBroadcastNow` ?

#### 4.4 Configuration des Événements
- [ ] **Q4.4** : Les événements sont-ils enregistrés dans `EventServiceProvider` ?

### 5. **Tests et Logs**

#### 5.1 Logs de Production
- [ ] **Q5.1** : Y a-t-il des logs d'erreur dans `storage/logs/laravel.log` ?
- [ ] **Q5.2** : Y a-t-il des logs WebSocket spécifiques ?

#### 5.2 Tests Locaux
- [ ] **Q5.3** : Les événements WebSocket fonctionnent-ils en local ?
- [ ] **Q5.4** : Y a-t-il des différences entre l'environnement local et production ?

### 6. **Architecture**

#### 6.1 Flux de Données
- [ ] **Q6.1** : Pouvez-vous décrire le flux complet d'un commentaire ?
  1. API REST reçoit la requête
  2. Commentaire créé en base
  3. Événement WebSocket émis
  4. Autres clients reçoivent l'événement

#### 6.2 Dépendances
- [ ] **Q6.2** : Y a-t-il des dépendances manquantes (Redis, Queue, etc.) ?
- [ ] **Q6.3** : Les queues sont-elles configurées et fonctionnelles ?

### 7. **Configuration Frontend**

#### 7.1 URL WebSocket
- [ ] **Q7.1** : L'URL `https://websocket.sue.alliance-tech.fr` est-elle correcte ?
- [ ] **Q7.2** : Faut-il utiliser `wss://` au lieu de `https://` ?

#### 7.2 Format des Événements
- [ ] **Q7.3** : Le frontend écoute-t-il les bons événements ?
- [ ] **Q7.4** : Le format des données reçues correspond-il à ce qui est émis ?

## 🔧 Actions de Diagnostic

### Tests à Effectuer

1. **Test de Connexion WebSocket**
   ```bash
   # Test de connectivité
   curl -I https://websocket.sue.alliance-tech.fr
   ```

2. **Test d'Événement**
   ```bash
   # Créer un commentaire et vérifier les logs
   curl -X POST https://api.sue.alliance-tech.fr/api/sessions/{sessionId}/comments \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test WebSocket"}'
   ```

3. **Vérification des Logs**
   ```bash
   # Logs Laravel
   tail -f storage/logs/laravel.log
   
   # Logs WebSocket (si applicable)
   tail -f /var/log/websocket.log
   ```

## 📊 Informations Nécessaires

### Configuration Actuelle
- [ ] Version de Laravel
- [ ] Version de Socket.IO (si applicable)
- [ ] Configuration broadcasting (`config/broadcasting.php`)
- [ ] Configuration WebSocket (fichier de config principal)

### Logs d'Erreur
- [ ] Logs d'erreur WebSocket
- [ ] Logs d'erreur Laravel
- [ ] Logs d'erreur serveur (nginx/apache)

### Code Source
- [ ] `CommentController@store`
- [ ] Classes d'événements (`CommentCreated`, etc.)
- [ ] Configuration `EventServiceProvider`
- [ ] Configuration `broadcasting.php`

## 🎯 Résultat Attendu

Une fois ces questions répondues, nous pourrons :
1. ✅ Identifier la cause racine du problème
2. ✅ Corriger la configuration ou le code
3. ✅ Tester la solution
4. ✅ Valider que les commentaires s'affichent en temps réel

---

**Contact :** Équipe Mobile  
**Date :** 5 août 2025  
**Priorité :** Haute 