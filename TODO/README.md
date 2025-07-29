# TODO - Gestion des tâches et User Stories

Ce répertoire contient l'organisation des tâches à implémenter pour l'application Sue.

## 📁 Structure

```
TODO/
├── README.md                    # Ce fichier
├── BUGS/                        # Bugs à corriger
│   ├── README.md               # Liste des bugs
│   └── [bug-description].md    # Détails d'un bug spécifique
├── EVOLUTIONS/                  # Nouvelles fonctionnalités
│   ├── README.md               # Liste des évolutions
│   └── [feature-name].md       # User Story complète
└── COMMUN/                      # Tâches communes/techniques
    ├── README.md               # Liste des tâches communes
    └── [task-name].md          # Détails d'une tâche
```

## 🎲 **Complexité (Suite de Fibonacci)**

Toutes les tâches sont évaluées selon la suite de Fibonacci pour faciliter le planning poker :

- **1** : Très simple, modification mineure (quelques heures)
- **2** : Simple, quelques heures de travail
- **3** : Facile, 1-2 jours
- **5** : Moyen, 2-3 jours
- **8** : Complexe, 1 semaine
- **13** : Très complexe, 2-3 semaines
- **21** : Extrêmement complexe, 1 mois+

### **Facteurs de complexité pris en compte :**
- **Frontend** : UI/UX, composants, navigation, états
- **Backend** : API, base de données, logique métier
- **Intégration** : Communication frontend/backend
- **Tests** : Couverture de tests nécessaire
- **Documentation** : Documentation technique et utilisateur
- **Sécurité** : Validation, permissions, protection
- **Performance** : Optimisations requises

## 🏷️ Conventions de nommage

### Bugs
- Format : `BUG-[numero]-[description-courte].md`
- Exemple : `BUG-001-erreur-connexion-api.md`

### Évolutions
- Format : `US-[numero]-[feature-name].md`
- Exemple : `US-001-suppression-invitation-session.md`

### Tâches communes
- Format : `TASK-[numero]-[description].md`
- Exemple : `TASK-001-optimisation-performance.md`

## 📋 Statuts

- **🔄 À faire** : Tâche non commencée
- **⚡ En cours** : Tâche en développement
- **✅ Terminé** : Tâche complétée
- **❌ Annulé** : Tâche abandonnée
- **🔍 En test** : Tâche en phase de test

## 📝 Format des User Stories

Chaque User Story doit contenir :

1. **Titre et ID** : Description claire de la fonctionnalité
2. **Complexité** : Évaluation selon la suite de Fibonacci
3. **Contexte** : Pourquoi cette fonctionnalité est nécessaire
4. **Critères d'acceptation** : Comment valider que c'est terminé
5. **Tâches Frontend** : Liste détaillée des tâches à implémenter
6. **Tâches Backend** : Endpoints et logique à créer
7. **Maquettes/Design** : Références visuelles si nécessaire
8. **Tests** : Scénarios de test à couvrir

## 🚀 Workflow

1. **Création** : Nouvelle US dans le bon répertoire
2. **Priorisation** : Ajout dans le README du répertoire
3. **Estimation** : Évaluation de la complexité
4. **Développement** : Mise à jour du statut
5. **Validation** : Tests et critères d'acceptation
6. **Finalisation** : Documentation et déploiement

## 📊 **Métriques de planning**

### **Total des complexités :**
- **Évolutions** : 68 points (US-001 à US-011)
- **Bugs** : 10 points (BUG-001 à BUG-003)
- **Tâches communes** : 26 points (TASK-001 à TASK-003)
- **Total général** : 104 points

### **Répartition par priorité :**
- **🔴 Haute** : 52 points (50%)
- **🟡 Moyenne** : 34 points (33%)
- **🟢 Basse** : 5 points (5%)
- **Bugs** : 10 points (10%)
- **Tâches communes** : 26 points (25%) 