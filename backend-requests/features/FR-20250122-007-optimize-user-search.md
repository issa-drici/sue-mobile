# FR-20250122-007: Optimiser la recherche d'utilisateurs pour prénom/nom

## 🎯 Objectif

**Titre :** Optimiser la recherche d'utilisateurs pour supporter prénom, nom et combinaisons

**Priorité :** 🟡 **MOYENNE** - Amélioration UX de la recherche d'amis

**Type :** Feature Request

**Statut :** 🔄 **À implémenter**

**Créé le :** 2025-01-22

## 📋 Contexte

Actuellement, l'endpoint de recherche d'utilisateurs ne permet probablement que de rechercher par email ou par un seul champ. Il serait utile de pouvoir rechercher par prénom, nom, ou combinaisons pour améliorer l'expérience utilisateur lors de l'ajout d'amis.

## 🚨 Problème actuel

### Limitations de la recherche actuelle
- Recherche probablement limitée à l'email uniquement
- Impossible de trouver un utilisateur en tapant son prénom ou nom
- Expérience utilisateur frustrante si on ne connaît pas l'email exact

### Exemples de cas d'usage
- Utilisateur veut ajouter "Jean Dupont" mais ne connaît pas son email
- Utilisateur tape "Jean" et veut voir tous les Jean
- Utilisateur tape "Dupont" et veut voir tous les Dupont
- Utilisateur tape "Jean D" et veut voir les Jean dont le nom commence par D

## ✅ Solution proposée

### Recherche flexible par mots-clés
Permettre la recherche par :
1. **Prénom uniquement** : "Jean" → trouve tous les Jean
2. **Nom uniquement** : "Dupont" → trouve tous les Dupont  
3. **Prénom + Nom** : "Jean Dupont" → trouve Jean Dupont
4. **Nom + Prénom** : "Dupont Jean" → trouve Jean Dupont
5. **Recherche partielle** : "Jean D" → trouve Jean Dupont, Jean Durand, etc.
6. **Email** : Garder la recherche par email existante

### Logique de recherche proposée

```php
// Diviser la requête en mots
$keywords = explode(' ', trim($query));
$keywords = array_filter($keywords); // Supprimer les espaces vides

if (count($keywords) === 1) {
    // Recherche par un seul mot : prénom OU nom OU email
    $users = User::where(function($q) use ($keywords) {
        $keyword = $keywords[0];
        $q->where('firstname', 'LIKE', "%{$keyword}%")
          ->orWhere('lastname', 'LIKE', "%{$keyword}%")
          ->orWhere('email', 'LIKE', "%{$keyword}%");
    });
} else {
    // Recherche par plusieurs mots : combinaisons possibles
    $users = User::where(function($q) use ($keywords) {
        // Prénom + Nom (ordre normal)
        $q->where(function($subQ) use ($keywords) {
            $subQ->where('firstname', 'LIKE', "%{$keywords[0]}%")
                 ->where('lastname', 'LIKE', "%{$keywords[1]}%");
        })
        // Nom + Prénom (ordre inversé)
        ->orWhere(function($subQ) use ($keywords) {
            $subQ->where('firstname', 'LIKE', "%{$keywords[1]}%")
                 ->where('lastname', 'LIKE', "%{$keywords[0]}%");
        })
        // Recherche partielle dans chaque champ
        ->orWhere(function($subQ) use ($keywords) {
            foreach ($keywords as $keyword) {
                $subQ->where(function($kQ) use ($keyword) {
                    $kQ->where('firstname', 'LIKE', "%{$keyword}%")
                       ->orWhere('lastname', 'LIKE', "%{$keyword}%");
                });
            }
        });
    });
}
```

## 🔧 Spécifications techniques

### Endpoint concerné
- `GET /api/users/search?q={query}`

### Paramètres
- `q` (string, required) : Terme de recherche
- `limit` (int, optional) : Nombre de résultats (défaut: 20)

### Exemples de requêtes

#### Recherche par prénom
```bash
GET /api/users/search?q=Jean
```
**Résultats attendus :** Tous les utilisateurs dont le prénom contient "Jean"

#### Recherche par nom
```bash
GET /api/users/search?q=Dupont
```
**Résultats attendus :** Tous les utilisateurs dont le nom contient "Dupont"

#### Recherche prénom + nom
```bash
GET /api/users/search?q=Jean Dupont
```
**Résultats attendus :** Utilisateurs avec prénom "Jean" ET nom "Dupont"

#### Recherche nom + prénom
```bash
GET /api/users/search?q=Dupont Jean
```
**Résultats attendus :** Utilisateurs avec prénom "Jean" ET nom "Dupont" (même résultat)

#### Recherche partielle
```bash
GET /api/users/search?q=Jean D
```
**Résultats attendus :** Utilisateurs avec prénom "Jean" ET nom commençant par "D"

#### Recherche par email (existante)
```bash
GET /api/users/search?q=jean.dupont@email.com
```
**Résultats attendus :** Utilisateur avec cet email

### Réponse
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstname": "Jean",
      "lastname": "Dupont",
      "email": "jean.dupont@email.com",
      "avatar": null,
      "isAlreadyFriend": false,
      "hasPendingRequest": true,
      "relationshipStatus": "pending"
    }
  ],
  "meta": {
    "total": 1,
    "query": "Jean Dupont"
  }
}
```

## 📊 Impact sur l'application

### Amélioration UX
- ✅ Recherche plus intuitive et naturelle
- ✅ Plus besoin de connaître l'email exact
- ✅ Recherche par nom/prénom plus courante que par email
- ✅ Support des recherches partielles

### Cas d'usage améliorés
1. **"Jean"** → Trouve Jean Dupont, Jean Martin, Jean-Pierre Durand
2. **"Dupont"** → Trouve Jean Dupont, Marie Dupont, Pierre Dupont
3. **"Jean Dupont"** → Trouve exactement Jean Dupont
4. **"Dupont Jean"** → Trouve exactement Jean Dupont (ordre inversé)
5. **"Jean D"** → Trouve Jean Dupont, Jean Durand, Jean Dubois

## 🧪 Tests à effectuer

### Test 1 : Recherche par prénom
```bash
curl -X GET "/api/users/search?q=Jean" \
  -H "Authorization: Bearer {token}"
```
**Attendu :** Tous les utilisateurs avec prénom contenant "Jean"

### Test 2 : Recherche par nom
```bash
curl -X GET "/api/users/search?q=Dupont" \
  -H "Authorization: Bearer {token}"
```
**Attendu :** Tous les utilisateurs avec nom contenant "Dupont"

### Test 3 : Recherche combinée
```bash
curl -X GET "/api/users/search?q=Jean Dupont" \
  -H "Authorization: Bearer {token}"
```
**Attendu :** Utilisateurs avec prénom "Jean" ET nom "Dupont"

### Test 4 : Recherche partielle
```bash
curl -X GET "/api/users/search?q=Jean D" \
  -H "Authorization: Bearer {token}"
```
**Attendu :** Utilisateurs avec prénom "Jean" ET nom commençant par "D"

### Test 5 : Recherche par email (rétrocompatibilité)
```bash
curl -X GET "/api/users/search?q=jean.dupont@email.com" \
  -H "Authorization: Bearer {token}"
```
**Attendu :** Utilisateur avec cet email exact

## 📝 Notes

- **Performance** : Ajouter des index sur `firstname` et `lastname` si nécessaire
- **Sécurité** : Échapper les caractères spéciaux pour éviter les injections SQL
- **Rétrocompatibilité** : Maintenir la recherche par email existante
- **Limite** : Limiter le nombre de résultats pour éviter les surcharges

## 🚀 Priorité

**Moyenne** - Cette amélioration rendra la recherche d'amis beaucoup plus intuitive et utilisable, mais n'est pas critique pour le fonctionnement de base de l'application.





