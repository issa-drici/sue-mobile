# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Authentification par Téléphone et OTP
- **ID :** FR-20260706-001
- **Date :** 2026-07-06
- **Demandeur :** Équipe Mobile
- **Priorité :** 🔴 CRITICAL
- **Deadline :** ASAP

## 🎯 Description

### Fonctionnalité demandée
Mise en place d'un flux complet d'authentification par numéro de téléphone et code de validation à 6 chiffres (SMS OTP) avec gestion de l'inscription à la première connexion (saisie du Prénom/Nom obligatoire).

### Contexte
Le design et l'ergonomie de l'écran d'accueil/connexion de l'application mobile ont été refondus pour utiliser un flux moderne par OTP. Les endpoints d'authentification par email/mot de passe existants ne sont plus suffisants.

### Cas d'usage
1. L'utilisateur saisit son numéro de téléphone (au format français avec ou sans `+33`/`0`).
2. Le mobile valide le format et appelle l'API pour envoyer un SMS OTP à 6 chiffres.
3. L'utilisateur saisit le code reçu. Le mobile appelle l'API pour vérifier le code.
4. Si le numéro est déjà enregistré, l'utilisateur est connecté et le token est renvoyé.
5. Si c'est sa première connexion, le mobile redirige vers un formulaire Prénom / Nom puis soumet la création de profil au serveur pour terminer la connexion.

## 🔧 Spécifications techniques

### Endpoints nécessaires
```
POST /api/auth/phone/send-otp
POST /api/auth/phone/verify
POST /api/auth/phone/register
```

### Structure des données

#### 1. Envoi OTP
- **Payload (`POST /api/auth/phone/send-otp`)** :
```json
{
  "phone": "+33612345678"
}
```
- **Réponse (200 OK)** :
```json
{
  "success": true,
  "message": "Verification code sent."
}
```

#### 2. Vérification OTP
- **Payload (`POST /api/auth/phone/verify`)** :
```json
{
  "phone": "+33612345678",
  "code": "123456"
}
```
- **Réponse (200 OK - Déjà inscrit)** :
```json
{
  "isRegistered": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid-here",
    "phone": "+33612345678",
    "firstname": "Issa",
    "lastname": "Drici"
  }
}
```
- **Réponse (200 OK - Non inscrit)** :
```json
{
  "isRegistered": false,
  "message": "Profile registration required."
}
```

#### 3. Création profil / Inscription
- **Payload (`POST /api/auth/phone/register`)** :
```json
{
  "phone": "+33612345678",
  "firstname": "Thomas",
  "lastname": "Dubois"
}
```
- **Réponse (200 OK)** :
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid-here",
    "phone": "+33612345678",
    "firstname": "Thomas",
    "lastname": "Dubois"
  }
}
```

### Codes de réponse
- `200` - Succès
- `400` - Données invalides (numéro mal formaté, mauvais OTP, etc.)
- `401` - Non autorisé
- `500` - Erreur serveur lors de l'envoi de SMS

## 📱 Impact sur le mobile

### Écrans concernés
- [login.tsx](file:///Users/issadrici/Sites/mobile/sue/alarrache/app/(auth)/login.tsx) (flux unifié)

### Hooks/Composants à créer
- Intégration de l'appel API dans le service `services/api/authApi.ts` et du context `context/auth.tsx`.

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Test de l'envoi du SMS (avec provider Twilio ou équivalent)
- [ ] Validation stricte du format E.164 (`+33...`)
- [ ] Limiter la fréquence d'envoi d'OTP (rate-limiting)
- [ ] Test de sécurité (expiration du code après 5 minutes, 3 tentatives max)

### Tests côté mobile
- [ ] Appel de l'envoi OTP
- [ ] Validation en temps réel côté client
- [ ] Stockage du JWT et état connecté

## 📊 Estimation

### Backend
- **Temps estimé :** 2 jours
- **Complexité :** Moyenne

### Mobile
- **Temps estimé :** 4 heures
- **Complexité :** Faible (déjà mocké)

---

**Status :** ⏳ En attente
**Assigné à :** Équipe Backend
**Date de mise à jour :** 2026-07-06
