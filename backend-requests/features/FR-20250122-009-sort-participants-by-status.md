# FR-20250122-009: Tri des participants par statut

## 📋 **Résumé**
Modifier le tri des participants dans les réponses API pour afficher en premier ceux qui ont accepté l'invitation.

## 🎯 **Objectif**
Améliorer l'expérience utilisateur en affichant les participants acceptés en premier dans toutes les listes.

## 📍 **Endpoints concernés**

### 1. **GET /sessions**
- **Fichier** : `app/(tabs)/index.tsx`
- **Usage** : Liste des sessions actives
- **Problème** : Participants triés par ordre d'ajout

### 2. **GET /sessions/{id}**
- **Fichier** : `app/session/[id].tsx`
- **Usage** : Détail d'une session
- **Problème** : Participants triés par ordre d'ajout

### 3. **GET /sessions/history**
- **Fichier** : `app/(tabs)/history.tsx`
- **Usage** : Historique des sessions
- **Problème** : Participants triés par ordre d'ajout

## 🔧 **Modification demandée**

### **Tri des participants**
```json
{
  "participants": [
    // 1. Participants acceptés (status: "accepted")
    {
      "id": "user-1",
      "firstname": "Jean",
      "lastname": "Dupont",
      "status": "accepted"
    },
    {
      "id": "user-2", 
      "firstname": "Marie",
      "lastname": "Martin",
      "status": "accepted"
    },
    // 2. Participants en attente (status: "pending")
    {
      "id": "user-3",
      "firstname": "Paul",
      "lastname": "Durand", 
      "status": "pending"
    },
    // 3. Participants refusés (status: "declined")
    {
      "id": "user-4",
      "firstname": "Sophie",
      "lastname": "Leroy",
      "status": "declined"
    }
  ]
}
```

### **Ordre de tri**
1. **`accepted`** (acceptés) - en premier
2. **`pending`** (en attente) - au milieu  
3. **`declined`** (refusés) - en dernier

## 💡 **Avantages**

### **Pour l'utilisateur**
- ✅ **Visibilité** : Voir immédiatement qui participe
- ✅ **Priorité** : Les participants confirmés en premier
- ✅ **Cohérence** : Même tri dans toutes les vues

### **Pour l'interface**
- ✅ **Liste des sessions** : Les 5 premiers affichés sont les acceptés
- ✅ **Détail session** : Participants confirmés visibles en premier
- ✅ **Historique** : Cohérence avec les autres vues

## 🎨 **Impact visuel**

### **Avant (ordre d'ajout)**
```
Participants (2) :
- Paul Durand ? (en attente)
- Jean Dupont ✓ (accepté)  
- Sophie Leroy ✕ (refusé)
- Marie Martin ✓ (accepté)
+1 autre
```

### **Après (tri par statut)**
```
Participants (2) :
- Jean Dupont ✓ (accepté)
- Marie Martin ✓ (accepté)
- Paul Durand ? (en attente)
- Sophie Leroy ✕ (refusé)
+1 autre
```

## 🔄 **Implémentation suggérée**

### **Backend (Laravel)**
```php
// Dans le modèle Session ou le contrôleur
public function getParticipantsAttribute()
{
    return $this->participants()
        ->orderByRaw("CASE 
            WHEN status = 'accepted' THEN 1 
            WHEN status = 'pending' THEN 2 
            WHEN status = 'declined' THEN 3 
            ELSE 4 END")
        ->orderBy('created_at', 'asc') // Tri secondaire par date d'ajout
        ->get();
}
```

### **Alternative avec Collection**
```php
// Si les participants sont déjà chargés
$sortedParticipants = $session->participants->sortBy(function($participant) {
    $order = [
        'accepted' => 1,
        'pending' => 2, 
        'declined' => 3
    ];
    return $order[$participant->status] ?? 4;
});
```

## 📝 **Notes**
- **Tri secondaire** : Par date d'ajout pour maintenir l'ordre dans chaque groupe
- **Rétrocompatibilité** : Aucun changement de structure, seulement l'ordre
- **Performance** : Impact minimal, tri simple par statut

## 🏷️ **Labels**
- `enhancement`
- `user-experience` 
- `api`
- `sorting`

## 📅 **Priorité**
**Moyenne** - Amélioration UX, pas critique mais appréciée

---
**Créé le** : 2025-01-22  
**Demandé par** : Frontend Team  
**Statut** : En attente





