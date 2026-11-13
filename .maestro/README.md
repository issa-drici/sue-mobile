# Tests de bout en bout (Maestro)

Scénarios qui pilotent l'app dans le simulateur iOS comme un vrai utilisateur.

## Prérequis

- simulateur démarré avec l'app de développement installée ;
- Metro (`npx expo start --dev-client`) et le backend local (`php artisan serve`) lancés ;
- dans le `.env` du backend : `REVIEW_PHONE` (compte de démo) et `REVIEW_OTP_CODE` (son code fixe).

Chaque scénario part d'une app vierge et se connecte au compte de démo. À chaque demande de code,
le backend recrée les données de démo (`php artisan demo:review-account`) : amis, sessions,
invitations, créneaux à voter, lien d'invitation fixe… Les scénarios sont donc indépendants et
peuvent être relancés autant de fois qu'on veut.

## Lancer

Tous les scénarios (numéro sans le +33) :

    maestro test .maestro -e DEMO_PHONE=639980000 -e DEMO_CODE=<REVIEW_OTP_CODE>

Un seul :

    maestro test .maestro/session-create-edit-cancel.yaml -e DEMO_PHONE=639980000 -e DEMO_CODE=<code>

## Parcours couverts

| Scénario | Parcours |
|---|---|
| `auth-login` | Connexion par téléphone + code |
| `auth-logout` | Déconnexion, retour à l'écran de connexion |
| `session-open` | Accueil → fiche de la prochaine session |
| `session-create-edit-cancel` | Créer une session avec date, la modifier (lieu, limite), l'annuler |
| `session-create-find-slot` | Créer en « Trouver un créneau », proposer un créneau, copier le lien, inviter 2 amis |
| `session-leave` | Quitter une session, puis revenir avec « Finalement je viens » |
| `invitation-accept` / `invitation-decline` | Répondre à une invitation |
| `slot-vote` | Donner ses disponibilités, les modifier, « aucun créneau ne me va » |
| `slot-confirm` | Organisateur : choisir le créneau final |
| `join-link` | Lien d'invitation invalide, puis valide → rejoindre la session |
| `chat-send` / `chat-mention` | Envoyer un message, mentionner un membre |
| `profile` / `profile-edit` | Profil affiché, modifier prénom et nom |
| `profile-privacy` | Compte & confidentialité (changement de numéro, suppression jusqu'à la confirmation) |

## Écrire un scénario

- Les libellés avec icône commencent par le glyphe de l'icône : viser `".*Texte"` ou un `testID`.
- La barre d'onglets flotte au-dessus du bas de l'écran : un élément tout en bas peut être
  « visible » mais caché dessous. Le faire remonter avant de taper (voir `subflows/open-home-session.yaml`).
- Le menu « … » de la fiche est un menu natif iOS : `subflows/open-session-menu.yaml`.
- Pas de dates en dur : elles dépendent du jour (viser les heures, ou « le 15 du mois prochain »
  avec `subflows/pick-next-month-15.yaml`).
- `eraseText` perd des caractères sur iOS : préférer des `pressKey: backspace` répétés.
