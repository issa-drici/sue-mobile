# FR-20250122-002 - Gestion des champs nullable dans la mise à jour de session

## Contexte
L'application mobile permet maintenant de vider les champs "Nombre maximum de participants" et "Prix par personne" lors de la modification d'une session. Ces champs doivent être envoyés comme `null` au backend pour indiquer qu'ils doivent être supprimés.

## Problème actuel
Actuellement, le frontend n'envoie ces champs que s'ils ont une valeur, ce qui empêche de les vider une fois qu'ils sont définis.

## Solution implémentée côté frontend
- Modification de la logique dans `app/edit-session/[id].tsx` pour toujours inclure `maxParticipants` et `pricePerPerson`
- Si les champs sont vides, ils sont envoyés comme `null`
- Modification du service `updateSession` pour toujours inclure ces champs dans la requête

## Demande backend

### Endpoint concerné
`PUT /api/sessions/{id}`

### Comportement attendu
Le backend doit accepter et traiter correctement les valeurs `null` pour :
- `maxParticipants` : si `null`, supprimer la limite de participants
- `pricePerPerson` : si `null`, supprimer le prix par personne

### Structure de la requête
```json
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM", 
  "location": "string",
  "sport": "string",
  "maxParticipants": null,  // ou un nombre
  "pricePerPerson": null    // ou un nombre décimal
}
```

### Validation
- `maxParticipants` : doit être `null` ou un entier positif
- `pricePerPerson` : doit être `null` ou un nombre décimal positif

### Base de données
- Les champs `max_participants` et `price_per_person` doivent être nullable dans la table `sessions`
- Si `null`, ces contraintes ne s'appliquent pas à la session

## Tests à effectuer
1. ✅ Créer une session avec `maxParticipants` et `pricePerPerson`
2. ✅ Modifier la session en vidant ces champs (envoyer `null`)
3. ✅ Vérifier que les champs sont bien supprimés en base
4. ✅ Vérifier que l'affichage ne montre plus ces informations

## Priorité
**Moyenne** - Fonctionnalité importante pour l'UX mais pas critique

## Statut
**En attente** - Implémentation frontend terminée, en attente de validation backend


