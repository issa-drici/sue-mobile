# Bug Report : Mise à jour des heures de session non fonctionnelle

**ID :** BUG-20250122-002
**Titre :** Les champs startTime, endTime, maxParticipants et pricePerPerson ne sont pas mis à jour lors de la modification d'une session
**Type :** Bug Report
**Priorité :** CRITICAL
**Deadline :** 25/01/2025
**Status :** ⏳ En attente

## Description

L'API de mise à jour de session (`PUT /api/sessions/{id}`) n'applique pas les modifications aux champs `startTime`, `endTime`, `maxParticipants` et `pricePerPerson` malgré des requêtes réussies. Seuls les champs `date` et `location` sont correctement mis à jour.

## Comportement attendu

Lors d'une requête PUT avec les champs `startTime`, `endTime`, `maxParticipants` et `pricePerPerson`, ces valeurs doivent être mises à jour dans la base de données et retournées dans la réponse.

## Comportement actuel

- ✅ Les requêtes PUT retournent `success: true`
- ✅ Les champs `date` et `location` sont mis à jour
- ❌ Les champs `startTime` et `endTime` restent inchangés
- ❌ Les champs `maxParticipants` et `pricePerPerson` restent inchangés
- ❌ La réponse contient toujours les anciennes valeurs

## Tests effectués

### Test 1 : Format HH:MM
```bash
curl -X PUT /api/sessions/{id} \
  -H "Authorization: Bearer {token}" \
  -d '{"startTime": "18:30", "endTime": "20:30"}'
```
**Résultat :** Succès mais heures non mises à jour

### Test 2 : Format HH:MM:SS
```bash
curl -X PUT /api/sessions/{id} \
  -H "Authorization: Bearer {token}" \
  -d '{"startTime": "18:30:00", "endTime": "20:30:00"}'
```
**Résultat :** Erreur de validation `validation.date_format`

### Test 3 : Ancien format
```bash
curl -X PUT /api/sessions/{id} \
  -H "Authorization: Bearer {token}" \
  -d '{"time": "19:30"}'
```
**Résultat :** Succès mais heures non mises à jour

### Test 4 : Tous les champs
```bash
curl -X PUT /api/sessions/{id} \
  -H "Authorization: Bearer {token}" \
  -d '{"date": "2025-09-26", "startTime": "19:00", "endTime": "21:00", "location": "Test Location", "maxParticipants": 6, "pricePerPerson": 25.50}'
```
**Résultat :** Succès mais seuls `date` et `location` sont mis à jour

## Impact

- **Frontend :** L'écran de modification de session ne peut pas mettre à jour les heures, prix et participants
- **UX :** Les utilisateurs ne peuvent pas modifier les créneaux horaires, prix et nombre de participants
- **Fonctionnalité :** Fonctionnalité de base non opérationnelle

## Causes possibles

1. **Mapping des champs :** Les champs `startTime`, `endTime`, `maxParticipants` et `pricePerPerson` ne sont pas correctement mappés dans le modèle
2. **Validation :** Validation trop stricte qui rejette les nouvelles valeurs
3. **Base de données :** Contraintes ou triggers qui empêchent la mise à jour
4. **Logique métier :** Code qui ignore ces champs lors de la mise à jour
5. **Filtrage des champs :** Seuls certains champs sont autorisés dans la requête de mise à jour

## Solution demandée

1. **Vérifier le mapping** des champs `startTime`, `endTime`, `maxParticipants` et `pricePerPerson` dans le modèle de session
2. **Corriger la logique de mise à jour** pour inclure tous ces champs
3. **Tester la validation** des formats d'heure acceptés
4. **Vérifier les contraintes** de base de données
5. **Retourner les nouvelles valeurs** dans la réponse API
6. **Vérifier les permissions** de mise à jour pour ces champs

## Format d'heure accepté

Basé sur les tests, l'API accepte le format `HH:MM` (ex: "18:30") mais rejette `HH:MM:SS` (ex: "18:30:00").

## Tests de validation

Une fois corrigé, l'API doit :
- ✅ Accepter `startTime: "18:30"` et `endTime: "20:30"`
- ✅ Accepter `maxParticipants: 6` et `pricePerPerson: 25.50`
- ✅ Mettre à jour toutes ces valeurs en base de données
- ✅ Retourner les nouvelles valeurs dans la réponse
- ✅ Maintenir la cohérence avec les autres champs

## Notes

- Le frontend est déjà adapté pour envoyer les bonnes données
- Les autres champs fonctionnent correctement
- Ce bug bloque la fonctionnalité de modification des créneaux horaires
