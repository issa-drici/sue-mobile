# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Profils d'avatars et métriques de session pour l'écran d'accueil
- **ID :** FR-20260703-001
- **Date :** 2026-07-03
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟢 MEDIUM
- **Deadline :** 2026-07-15

## 🎯 Description

### Fonctionnalité demandée
Afin d'afficher correctement l'écran d'accueil premium (avec les bulles d'avatars des participants empilées et le statut d'inscription en couleur comme "Il manque X joueurs"), nous avons besoin uniquement que :
1. Le champ `avatar` (URL) soit ajouté pour chaque participant retourné dans les endpoints existants de sessions.

*Note : Aucun nouvel endpoint n'est nécessaire pour la "Prochaine session". L'application mobile récupère la liste complète des sessions (déjà triée par ordre chronologique), extrait le premier élément à venir de la liste, et l'affiche sous forme de carte "Prochaine session" dans le frontend.*

### Contexte
La refonte visuelle de la page d'accueil affiche désormais les visages des joueurs inscrits pour chaque match (Football, Tennis, Golf, etc.). Actuellement, les participants retournés ne contiennent que le `fullName`, sans lien vers leur photo de profil. Nous devons donc simuler ces photos de profil en local. L'ajout du champ `avatar` au format URL résoudra ce problème.

### Cas d'usage
- Un utilisateur ouvre l'application mobile. Il voit immédiatement sa prochaine session ("Football ce soir à 19h00") avec la photo de ses amis qui y participent.
- Dans la liste "À venir", l'utilisateur voit en un coup d'œil les photos des participants et combien de places sont encore libres.

## 🔧 Spécifications techniques

### Endpoints concernés / nécessaires
```
GET /api/sessions (à modifier pour ajouter le champ avatar de chaque participant dans la liste)
GET /api/sessions/{id} (à modifier pour ajouter le champ avatar de chaque participant dans le détail)
```

### Structure des données souhaitée (dans l'objet participant)
```json
{
  "id": "string",
  "fullName": "string",
  "avatar": "string|null",
  "status": "pending|accepted|declined"
}
```

## 📱 Impact sur le mobile

### Écrans concernés
- Écran d'accueil (`app/(tabs)/index.tsx`)
- Écran de détails d'une session (`app/session/[id].tsx`)

### Hooks/Composants à créer
- Aucun nouveau hook nécessaire, simple mise à jour de `convertToSportSession` dans `services/sessions/getSessions.ts` une fois le backend mis à jour.

## 🧪 Tests et validation

### Tests côté mobile
- [ ] Test d'affichage des avatars réels retournés par l'API
- [ ] Test de gestion d'erreur si un avatar ou une image est inaccessible (fallback d'image par défaut)

---

**Status :** ⏳ En attente
**Assigné à :** Équipe Backend
**Date de mise à jour :** 2026-07-03
