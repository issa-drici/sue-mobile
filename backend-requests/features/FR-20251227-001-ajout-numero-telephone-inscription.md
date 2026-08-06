# 📱 FR-20251227-001: Ajout du Numéro de Téléphone à l'Inscription

**Date :** 27 Décembre 2025  
**Priorité :** 🟡 Haute  
**Statut :** 📋 En attente  
**Type :** ✨ Nouvelle Fonctionnalité  

---

## 📋 Description

### Fonctionnalité demandée
Ajouter un champ **numéro de téléphone** obligatoire lors de l'inscription d'un nouvel utilisateur.

### Contexte
L'application mobile nécessite de collecter le numéro de téléphone des utilisateurs lors de leur inscription pour :
- Permettre la vérification du compte par SMS
- Faciliter la communication avec les utilisateurs
- Améliorer la sécurité du compte

### Cas d'usage
1. Un nouvel utilisateur s'inscrit via l'application mobile
2. Il doit renseigner son numéro de téléphone dans le formulaire d'inscription
3. Le numéro est envoyé au backend lors de la création du compte
4. Le backend valide et enregistre le numéro de téléphone

---

## 🔧 Spécifications Techniques

### Endpoint concerné
**Endpoint :** `POST /api/register`  
**Authentification :** Non requise (endpoint public)

### Modification du Payload

#### Payload Actuel
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "device_name": "Alarrache Mobile App"
}
```

#### Payload Demandé
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "phone": "+33612345678",
  "password": "password123",
  "password_confirmation": "password123",
  "device_name": "Alarrache Mobile App"
}
```

### Nouveau Champ

| Champ | Type | Obligatoire | Description | Format |
|-------|------|-------------|-------------|--------|
| `phone` | string | ✅ Oui | Numéro de téléphone de l'utilisateur | Format international recommandé (ex: +33612345678) |

### Validation Requise

1. **Format** : Valider que le numéro est au format valide (international ou national)
2. **Unicité** : Vérifier que le numéro n'est pas déjà utilisé par un autre compte
3. **Longueur** : Valider la longueur minimale et maximale du numéro
4. **Caractères** : Autoriser uniquement les chiffres, espaces, tirets et le préfixe `+`

### Codes de Réponse

#### Succès (200)
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "1",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "phone": "+33612345678",
    "created_at": "2025-12-27T10:00:00.000000Z",
    "updated_at": "2025-12-27T10:00:00.000000Z"
  },
  "refresh_token": "..."
}
```

#### Erreur - Numéro déjà utilisé (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": [
      "Ce numéro de téléphone est déjà utilisé."
    ]
  }
}
```

#### Erreur - Format invalide (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": [
      "Le format du numéro de téléphone est invalide."
    ]
  }
}
```

#### Erreur - Champ manquant (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": [
      "Le champ numéro de téléphone est obligatoire."
    ]
  }
}
```

---

## 🗄️ Modifications Base de Données

### Migration Requise

Ajouter une colonne `phone` à la table `users` :

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('phone')->nullable()->after('email');
    // Ou si vous voulez le rendre obligatoire directement :
    // $table->string('phone')->after('email');
});
```

**Note :** Si vous choisissez de rendre le champ `nullable` initialement, prévoir une migration ultérieure pour le rendre obligatoire après migration des données existantes.

### Index Recommandé

Pour optimiser les recherches et vérifications d'unicité :

```php
Schema::table('users', function (Blueprint $table) {
    $table->unique('phone');
    // Ou si vous voulez permettre les valeurs nulles :
    // $table->index('phone');
});
```

---

## 🛠️ Modifications Backend Requises

### 1. Modifier le Request Validation

**Fichier :** `app/Http/Requests/RegisterRequest.php` (ou équivalent)

```php
public function rules()
{
    return [
        'firstname' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'phone' => 'required|string|max:20|unique:users|regex:/^\+?[1-9]\d{1,14}$/',
        'password' => 'required|string|min:8|confirmed',
        'device_name' => 'required|string|max:255',
    ];
}
```

**Messages de validation personnalisés :**
```php
public function messages()
{
    return [
        'phone.required' => 'Le numéro de téléphone est obligatoire.',
        'phone.unique' => 'Ce numéro de téléphone est déjà utilisé.',
        'phone.regex' => 'Le format du numéro de téléphone est invalide.',
    ];
}
```

### 2. Modifier le Controller

**Fichier :** `app/Http/Controllers/Auth/RegisterController.php` (ou équivalent)

S'assurer que le champ `phone` est bien inclus lors de la création de l'utilisateur :

```php
$user = User::create([
    'firstname' => $request->firstname,
    'lastname' => $request->lastname,
    'email' => $request->email,
    'phone' => $request->phone,
    'password' => Hash::make($request->password),
]);
```

### 3. Modifier le Model User

**Fichier :** `app/Models/User.php`

Ajouter `phone` dans le `$fillable` :

```php
protected $fillable = [
    'firstname',
    'lastname',
    'email',
    'phone',
    'password',
];
```

Ajouter `phone` dans le `$hidden` si nécessaire (pour ne pas l'exposer dans les réponses JSON) :

```php
protected $hidden = [
    'password',
    'remember_token',
    // 'phone', // À décider selon les besoins de sécurité
];
```

### 4. Modifier la Resource/Transformer

Si vous utilisez une Resource ou Transformer pour formater les réponses :

**Fichier :** `app/Http/Resources/UserResource.php` (ou équivalent)

```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'firstname' => $this->firstname,
        'lastname' => $this->lastname,
        'email' => $this->email,
        'phone' => $this->phone, // Ajouter cette ligne
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}
```

---

## 🧪 Tests Backend à Effectuer

### Tests Fonctionnels

1. **Inscription avec numéro valide**
   - POST /api/register avec un numéro valide
   - Vérifier que l'utilisateur est créé avec le numéro
   - Vérifier que le numéro est bien enregistré en base de données

2. **Inscription sans numéro**
   - POST /api/register sans le champ `phone`
   - Vérifier l'erreur 422 avec message approprié

3. **Inscription avec numéro déjà utilisé**
   - POST /api/register avec un numéro existant
   - Vérifier l'erreur 422 avec message d'unicité

4. **Inscription avec format invalide**
   - POST /api/register avec un numéro au format invalide
   - Vérifier l'erreur 422 avec message de format

5. **Inscription avec différents formats**
   - Tester avec format international : `+33612345678`
   - Tester avec format national : `0612345678`
   - Tester avec espaces : `+33 6 12 34 56 78`
   - Vérifier que tous les formats valides sont acceptés

### Tests de Régression

1. **Inscription existante**
   - Vérifier que l'inscription sans numéro ne fonctionne plus (si rendu obligatoire)
   - Vérifier que les autres champs fonctionnent toujours correctement

2. **Connexion**
   - Vérifier que la connexion fonctionne toujours après cette modification

3. **Profil utilisateur**
   - Vérifier que le numéro de téléphone apparaît dans les réponses de profil

---

## 📱 Impact sur le Mobile

### Modifications Frontend Effectuées

✅ **Formulaire d'inscription** (`app/(auth)/register.tsx`)
- Ajout du champ `phone` dans le formulaire
- Validation côté client (champ obligatoire)
- Type de clavier adapté (`phone-pad`)

✅ **Service d'authentification** (`app/context/auth.tsx`)
- Modification de la fonction `signUp` pour inclure le paramètre `phone`
- Envoi du numéro dans le payload de l'API

✅ **Types TypeScript** (`services/types/auth.ts`)
- Ajout du champ `phone` dans l'interface `RegisterData`

### Tests Mobile à Effectuer

- [ ] Test d'inscription avec numéro valide
- [ ] Test d'inscription sans numéro (vérification erreur)
- [ ] Test d'inscription avec numéro déjà utilisé (vérification erreur)
- [ ] Test d'inscription avec format invalide (vérification erreur)
- [ ] Test de validation côté client
- [ ] Test d'affichage du numéro dans le profil utilisateur

---

## 📊 Estimation

### Backend
- **Temps estimé :** 2-3 heures
- **Complexité :** Moyenne
- **Tâches :**
  - Migration base de données : 30 min
  - Modification validation : 30 min
  - Modification controller/model : 30 min
  - Tests : 1 heure
  - Documentation : 30 min

### Mobile
- **Temps estimé :** ✅ Terminé
- **Complexité :** Faible

---

## 🔍 Points d'Attention

### Sécurité
- **Validation stricte** : Valider le format du numéro pour éviter les injections
- **Unicité** : S'assurer qu'un numéro ne peut être utilisé que par un seul compte
- **Normalisation** : Normaliser le format du numéro avant stockage (supprimer espaces, etc.)

### Performance
- **Index** : Créer un index sur la colonne `phone` pour optimiser les recherches
- **Cache** : Considérer la mise en cache des vérifications d'unicité si nécessaire

### Confidentialité
- **RGPD** : S'assurer que le numéro de téléphone est traité conformément au RGPD
- **Masquage** : Considérer le masquage partiel du numéro dans l'interface (ex: `+33 6 ** ** ** 78`)

### Migration des Données Existantes
- Si des utilisateurs existent sans numéro, prévoir une stratégie de migration :
  - Option 1 : Rendre le champ nullable et demander le numéro lors de la prochaine connexion
  - Option 2 : Rendre le champ obligatoire uniquement pour les nouveaux utilisateurs

---

## 🚀 Plan de Déploiement

### Phase 1: Développement (2-3 heures)
1. Créer la migration de base de données
2. Modifier le Request de validation
3. Modifier le Controller et le Model
4. Modifier la Resource/Transformer
5. Tests unitaires

### Phase 2: Tests (1 heure)
1. Tests fonctionnels complets
2. Tests de régression
3. Tests d'intégration avec le mobile
4. Validation de sécurité

### Phase 3: Déploiement (1 heure)
1. Déploiement en staging
2. Tests d'intégration avec l'équipe mobile
3. Déploiement en production
4. Monitoring des erreurs

---

## 📝 Questions pour l'Équipe Backend

1. **Format** : Quel format de numéro de téléphone souhaitez-vous accepter ? (international uniquement, national aussi, avec/sans espaces)
2. **Normalisation** : Voulez-vous normaliser le format avant stockage ? (ex: toujours au format international)
3. **Migration** : Comment gérer les utilisateurs existants sans numéro ?
4. **Vérification** : Souhaitez-vous implémenter une vérification par SMS à l'inscription ?
5. **Confidentialité** : Le numéro doit-il être masqué dans certaines réponses API ?
6. **Timing** : Quand cette fonctionnalité sera-t-elle disponible ?

---

## 🎯 Prochaines Étapes

1. **Validation** : Valider cette approche avec l'équipe backend
2. **Estimation** : Confirmer l'estimation de temps
3. **Planning** : Planifier le déploiement
4. **Tests d'intégration** : Coordonner les tests entre backend et frontend
5. **Documentation** : Mettre à jour la documentation API

---

**Assigné à :** Équipe Backend  
**Reviewer :** Équipe Mobile  
**Deadline :** À définir selon la priorité



