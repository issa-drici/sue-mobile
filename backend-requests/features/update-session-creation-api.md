# Mise à jour de l'API de création de session

## Contexte
Le formulaire de création de session a été modifié pour inclure de nouveaux champs :
- Heure de début (obligatoire)
- Heure de fin (obligatoire) 
- Prix par personne (facultatif)

## Problème actuel
L'API de création de session ne supporte pas encore ces nouveaux champs et utilise encore l'ancien format avec un seul champ `time`.

## Demande de modification

### 1. Endpoint à modifier
- **POST** `/api/sessions` (création de session)

### 2. Nouvelle structure des données attendue

#### Ancienne structure (actuelle)
```json
{
  "sport": "tennis",
  "date": "2024-01-15",
  "time": "14:30",
  "location": "Tennis Club Paris",
  "maxParticipants": 4,
  "participants": [
    {
      "id": "user123",
      "firstname": "John",
      "lastname": "Doe",
      "status": "pending"
    }
  ]
}
```

#### Nouvelle structure (demandée)
```json
{
  "sport": "tennis",
  "date": "2024-01-15",
  "startTime": "14:30",
  "endTime": "16:30",
  "location": "Tennis Club Paris",
  "maxParticipants": 4,
  "pricePerPerson": 15.50,
  "participants": [
    {
      "id": "user123",
      "firstname": "John",
      "lastname": "Doe",
      "status": "pending"
    }
  ]
}
```

### 3. Modifications requises

#### Champs à modifier
- **`time`** → **`startTime`** (obligatoire)
- **`endTime`** (nouveau, obligatoire)

#### Nouveaux champs
- **`pricePerPerson`** (facultatif, type: decimal/float)

#### Validation à ajouter
- Vérifier que `endTime` est après `startTime`
- `pricePerPerson` doit être un nombre positif si fourni
- `startTime` et `endTime` sont obligatoires

### 4. Structure de réponse attendue

```json
{
  "id": "session123",
  "sport": "tennis",
  "date": "2024-01-15",
  "startTime": "14:30",
  "endTime": "16:30",
  "location": "Tennis Club Paris",
  "maxParticipants": 4,
  "pricePerPerson": 15.50,
  "createdBy": "user456",
  "participants": [
    {
      "id": "user123",
      "firstname": "John",
      "lastname": "Doe",
      "status": "pending"
    }
  ],
  "createdAt": "2024-01-10T10:30:00Z",
  "updatedAt": "2024-01-10T10:30:00Z"
}
```

### 5. Endpoints à mettre à jour

#### Création de session
- **POST** `/api/sessions`
- Accepter la nouvelle structure avec `startTime`, `endTime`, `pricePerPerson`

#### Récupération de session
- **GET** `/api/sessions/{id}`
- Retourner la nouvelle structure

#### Liste des sessions
- **GET** `/api/sessions`
- Inclure les nouveaux champs dans la réponse

#### Mise à jour de session
- **PUT** `/api/sessions/{id}`
- Permettre la modification des nouveaux champs

### 6. Migration de la base de données

#### Table `sessions`
```sql
-- Renommer la colonne time en startTime
ALTER TABLE sessions RENAME COLUMN time TO startTime;

-- Ajouter la colonne endTime
ALTER TABLE sessions ADD COLUMN endTime TIME NOT NULL;

-- Ajouter la colonne pricePerPerson
ALTER TABLE sessions ADD COLUMN pricePerPerson DECIMAL(10,2) NULL;

-- Ajouter des contraintes
ALTER TABLE sessions ADD CONSTRAINT check_end_after_start 
CHECK (endTime > startTime);

ALTER TABLE sessions ADD CONSTRAINT check_positive_price 
CHECK (pricePerPerson IS NULL OR pricePerPerson >= 0);
```

### 7. Tests à effectuer

#### Tests de validation
- [ ] Création avec `startTime` et `endTime` valides
- [ ] Rejet si `endTime` <= `startTime`
- [ ] Création avec `pricePerPerson` positif
- [ ] Création avec `pricePerPerson` null (facultatif)
- [ ] Rejet si `pricePerPerson` négatif

#### Tests de compatibilité
- [ ] Vérifier que les sessions existantes fonctionnent toujours
- [ ] Migration des données existantes
- [ ] Tests de régression sur les autres endpoints

### 8. Documentation à mettre à jour

#### API Documentation
- Mettre à jour la documentation Swagger/OpenAPI
- Ajouter les nouveaux champs dans les exemples
- Documenter les nouvelles validations

#### Changelog
- Noter les breaking changes
- Fournir un guide de migration pour les clients

### 9. Priorité
**HAUTE** - Cette modification est nécessaire pour que le frontend fonctionne correctement avec les nouvelles fonctionnalités.

### 10. Délai souhaité
**Urgent** - À implémenter avant le prochain déploiement du frontend.

---

## Notes techniques

### Format des heures
- Utiliser le format HH:MM (24h)
- Exemple : "14:30", "09:00", "18:45"

### Format du prix
- Type : DECIMAL(10,2) en base de données
- Type : float/double dans l'API
- Unité : Euros (€)
- Exemple : 15.50, 0.00, null

### Validation côté backend
```php
// Exemple de validation (Laravel)
$request->validate([
    'sport' => 'required|string',
    'date' => 'required|date',
    'startTime' => 'required|date_format:H:i',
    'endTime' => 'required|date_format:H:i|after:startTime',
    'location' => 'required|string',
    'maxParticipants' => 'nullable|integer|min:1',
    'pricePerPerson' => 'nullable|numeric|min:0',
    'participants' => 'array'
]);
```
