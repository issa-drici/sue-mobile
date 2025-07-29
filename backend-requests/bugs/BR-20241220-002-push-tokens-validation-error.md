# BR-20241220-002 - Erreur de validation dans l'endpoint push-tokens

## 🐛 Description du bug

L'endpoint `POST /api/push-tokens` retourne une erreur 500 avec le message :
```
Method Illuminate\Validation\Validator::validateDefault does not exist.
```

**MISE À JOUR (20/12/2024)** : Le backend a été corrigé. L'erreur 500 n'apparaît plus. Le système fonctionne maintenant correctement.

## 📋 Contexte

- **Endpoint concerné** : `POST /api/push-tokens`
- **Erreur** : 500 Internal Server Error
- **Message** : `Method Illuminate\Validation\Validator::validateDefault does not exist`
- **Impact** : Impossible d'enregistrer les tokens Expo pour les notifications push

## 🔍 Analyse technique

### Erreur observée
```
❌ API Error: 500 - Method Illuminate\Validation\Validator::validateDefault does not exist.
❌ Erreur lors de l'enregistrement du token: [Error: Method Illuminate\Validation\Validator::validateDefault does not exist.]
```

### Requête envoyée
```json
{
  "token": "ExponentPushToken[DUDyt2MqQBUht8msAQSlx4]",
  "platform": "ios"
}
```

### Réponse reçue
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Method Illuminate\\Validation\\Validator::validateDefault does not exist."
  },
  "success": false
}
```

## 🎯 Cause probable

Cette erreur indique un problème dans les règles de validation Laravel, probablement :

1. **Règle de validation invalide** : Utilisation d'une règle `default` qui n'existe pas
2. **Version Laravel** : Incompatibilité avec la version de Laravel utilisée
3. **Validation personnalisée** : Méthode de validation manquante ou mal configurée

## 🔧 Solution proposée

### 1. Vérifier les règles de validation

Dans le contrôleur ou la Request class pour `/push-tokens`, vérifier :

```php
// ❌ Problématique (exemple)
public function rules()
{
    return [
        'token' => 'required|string|default:expo', // Règle 'default' invalide
        'platform' => 'required|string|default:expo', // Règle 'default' invalide
    ];
}
```

### 2. Correction proposée

```php
// ✅ Solution
public function rules()
{
    return [
        'token' => 'required|string',
        'platform' => 'required|string|in:expo,ios,android',
    ];
}

// Ou utiliser des valeurs par défaut dans le contrôleur
public function store(Request $request)
{
    $data = $request->validate([
        'token' => 'required|string',
        'platform' => 'required|string|in:expo,ios,android',
    ]);

    // Valeurs par défaut
    $data['platform'] = $data['platform'] ?? 'expo';
    
    // ... reste de la logique
}
```

### 3. Alternative avec Request class

```php
class SavePushTokenRequest extends FormRequest
{
    public function rules()
    {
        return [
            'token' => 'required|string',
            'platform' => 'required|string|in:expo,ios,android',
        ];
    }

    public function messages()
    {
        return [
            'token.required' => 'Le token est obligatoire.',
            'token.string' => 'Le token doit être une chaîne de caractères.',
            'platform.required' => 'La plateforme est obligatoire.',
            'platform.in' => 'La plateforme doit être expo, ios ou android.',
        ];
    }
}
```

## 🧪 Tests à effectuer

### Test 1 : Token valide
```bash
curl -X POST http://localhost:8000/api/push-tokens \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test-token]",
    "platform": "expo"
  }'
```

### Test 2 : Token avec plateforme iOS
```bash
curl -X POST http://localhost:8000/api/push-tokens \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test-token]",
    "platform": "ios"
  }'
```

### Test 3 : Token avec plateforme Android
```bash
curl -X POST http://localhost:8000/api/push-tokens \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test-token]",
    "platform": "android"
  }'
```

## 📊 Réponse attendue

```json
{
  "success": true,
  "message": "Token push enregistré avec succès"
}
```

## 🚨 Impact

- **Blocage** : Les notifications push ne peuvent pas être configurées
- **Utilisateurs affectés** : Tous les utilisateurs de l'application mobile
- **Fonctionnalité** : Système de notifications push non fonctionnel

## ⏰ Priorité

**HAUTE** - Bloque l'implémentation complète du système de notifications push.

## 📝 Notes supplémentaires

- Le frontend fonctionne correctement et obtient bien les tokens Expo
- Le problème est uniquement côté backend lors de l'enregistrement
- Les tokens obtenus sont valides : `ExponentPushToken[DUDyt2MqQBUht8msAQSlx4]`

---

**Date de création** : 20 décembre 2024  
**Créé par** : Assistant IA  
**Statut** : ✅ RÉSOLU - Backend corrigé 