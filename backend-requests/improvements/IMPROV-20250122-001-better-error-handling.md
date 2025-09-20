# IMPROV-20250122-001: Amélioration de la gestion des erreurs API

## 🎯 Objectif

**Titre :** Améliorer la gestion des erreurs pour éviter les erreurs 500 génériques

**Priorité :** 🔴 **HAUTE** - Améliore la stabilité de l'API

**Type :** Amélioration de la robustesse

**Statut :** 🔄 **À implémenter**

**Créé le :** 2025-01-22

## 📋 Contexte

Actuellement, l'API retourne des erreurs 500 "Server Error" génériques qui ne donnent aucune information utile au frontend. Cela rend le debugging difficile et l'expérience utilisateur médiocre.

## 🚨 Problèmes actuels

### 1. Erreurs 500 génériques
```json
{
  "message": "Server Error"
}
```

### 2. Manque d'informations de debugging
- Pas de détails sur la cause de l'erreur
- Pas de code d'erreur spécifique
- Pas de suggestions de correction

### 3. Impact sur le frontend
- Impossible de gérer les erreurs de manière appropriée
- Messages d'erreur génériques pour l'utilisateur
- Difficulté à identifier les problèmes

## ✅ Solution proposée

### 1. Structure d'erreur standardisée

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ userId est requis",
    "details": {
      "field": "userId",
      "value": null,
      "rule": "required"
    },
    "timestamp": "2025-01-22T10:30:00.000Z",
    "request_id": "req_123456789"
  }
}
```

### 2. Codes d'erreur spécifiques

#### Erreurs de validation (400)
- `VALIDATION_ERROR` - Données invalides
- `MISSING_FIELD` - Champ requis manquant
- `INVALID_FORMAT` - Format de données incorrect

#### Erreurs d'authentification (401/403)
- `UNAUTHORIZED` - Token manquant ou invalide
- `FORBIDDEN` - Permissions insuffisantes
- `TOKEN_EXPIRED` - Token expiré

#### Erreurs de ressources (404)
- `USER_NOT_FOUND` - Utilisateur introuvable
- `RESOURCE_NOT_FOUND` - Ressource inexistante

#### Erreurs de conflit (409)
- `FRIEND_REQUEST_EXISTS` - Demande d'ami déjà existante
- `DUPLICATE_RESOURCE` - Ressource en doublon

#### Erreurs serveur (500)
- `DATABASE_ERROR` - Erreur de base de données
- `EXTERNAL_SERVICE_ERROR` - Erreur de service externe
- `INTERNAL_ERROR` - Erreur interne (avec détails)

### 3. Middleware de gestion d'erreurs

```php
// app/Exceptions/Handler.php
public function render($request, Throwable $exception)
{
    if ($request->expectsJson()) {
        return $this->handleApiException($request, $exception);
    }
    
    return parent::render($request, $exception);
}

private function handleApiException($request, Throwable $exception)
{
    $statusCode = 500;
    $errorCode = 'INTERNAL_ERROR';
    $message = 'Une erreur interne s\'est produite';
    
    if ($exception instanceof ValidationException) {
        $statusCode = 400;
        $errorCode = 'VALIDATION_ERROR';
        $message = 'Données invalides';
    } elseif ($exception instanceof AuthenticationException) {
        $statusCode = 401;
        $errorCode = 'UNAUTHORIZED';
        $message = 'Authentification requise';
    } elseif ($exception instanceof ModelNotFoundException) {
        $statusCode = 404;
        $errorCode = 'RESOURCE_NOT_FOUND';
        $message = 'Ressource introuvable';
    }
    
    return response()->json([
        'success' => false,
        'error' => [
            'code' => $errorCode,
            'message' => $message,
            'details' => $this->getErrorDetails($exception),
            'timestamp' => now()->toISOString(),
            'request_id' => uniqid('req_')
        ]
    ], $statusCode);
}
```

### 4. Validation améliorée

```php
// app/Http/Requests/FriendRequestRequest.php
public function rules()
{
    return [
        'userId' => 'required|string|uuid|exists:users,id|different:' . auth()->id()
    ];
}

public function messages()
{
    return [
        'userId.required' => 'L\'ID de l\'utilisateur est requis',
        'userId.uuid' => 'L\'ID de l\'utilisateur doit être un UUID valide',
        'userId.exists' => 'L\'utilisateur cible n\'existe pas',
        'userId.different' => 'Vous ne pouvez pas vous ajouter vous-même comme ami'
    ];
}
```

## 🔧 Implémentation

### Phase 1 : Middleware d'erreurs
- [ ] Créer le middleware de gestion d'erreurs API
- [ ] Implémenter la structure d'erreur standardisée
- [ ] Ajouter les codes d'erreur de base

### Phase 2 : Validation améliorée
- [ ] Créer les Request classes pour chaque endpoint
- [ ] Implémenter les règles de validation spécifiques
- [ ] Ajouter les messages d'erreur personnalisés

### Phase 3 : Logging et monitoring
- [ ] Ajouter le logging des erreurs avec request_id
- [ ] Implémenter le monitoring des erreurs
- [ ] Créer des alertes pour les erreurs critiques

### Phase 4 : Documentation
- [ ] Documenter tous les codes d'erreur
- [ ] Créer des exemples de réponses d'erreur
- [ ] Mettre à jour la documentation API

## 📊 Bénéfices

### Pour les développeurs
- Debugging plus facile avec des erreurs spécifiques
- Identification rapide des problèmes
- Meilleure traçabilité des erreurs

### Pour les utilisateurs
- Messages d'erreur plus clairs et utiles
- Suggestions de correction quand possible
- Meilleure expérience utilisateur

### Pour l'équipe
- Monitoring plus efficace des erreurs
- Maintenance plus facile
- Support client amélioré

## 🧪 Tests

### Tests d'erreurs à implémenter
1. **Validation** : Test avec données invalides
2. **Authentification** : Test sans token ou token invalide
3. **Ressources** : Test avec ressources inexistantes
4. **Conflits** : Test avec données en conflit
5. **Serveur** : Test avec erreurs internes

### Exemples de tests
```php
public function test_friend_request_without_user_id()
{
    $response = $this->postJson('/api/users/friend-requests', []);
    
    $response->assertStatus(400)
             ->assertJson([
                 'success' => false,
                 'error' => [
                     'code' => 'VALIDATION_ERROR',
                     'message' => 'Données invalides'
                 ]
             ]);
}
```

## 📝 Notes

- **Rétrocompatibilité** : Les erreurs existantes continuent de fonctionner
- **Performance** : Impact minimal sur les performances
- **Sécurité** : Ne pas exposer d'informations sensibles dans les erreurs
- **Monitoring** : Toutes les erreurs sont loggées pour analyse

## 🚀 Priorité

**Critique** - Cette amélioration résoudra le problème actuel des erreurs 500 et améliorera significativement la qualité de l'API.





