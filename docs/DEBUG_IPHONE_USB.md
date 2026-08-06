# 🔍 Déboguer l'App sur iPhone via USB avec Xcode

Ce guide explique comment voir les logs de l'application installée depuis l'App Store sur un iPhone branché en USB.

## 📱 Méthode 1 : Console Xcode (Recommandée)

### Étapes :

1. **Brancher votre iPhone en USB** à votre Mac
2. **Ouvrir Xcode**
3. **Ouvrir la Console** :
   - Menu : `Window` → `Devices and Simulators` (ou `Cmd + Shift + 2`)
   - Sélectionner votre iPhone dans la liste de gauche
   - Cliquer sur l'onglet **"Open Console"** en bas

4. **Filtrer les logs** :
   - Dans la barre de recherche de la console, tapez : `sue` ou `com.alliancetech.com`
   - Vous verrez tous les logs de l'application

5. **Lancer l'app** sur votre iPhone et utiliser la fonctionnalité
6. **Les logs apparaîtront en temps réel** dans la console Xcode

---

## 📱 Méthode 2 : Console.app (Alternative)

### Étapes :

1. **Brancher votre iPhone en USB**
2. **Ouvrir l'application Console** (dans `/Applications/Utilities/`)
3. **Sélectionner votre iPhone** dans la barre latérale gauche
4. **Filtrer les logs** :
   - Dans la barre de recherche, tapez : `sue` ou `com.alliancetech.com`
   - Ou filtrez par "Subsystem" : `com.alliancetech.com`

5. **Les logs apparaîtront en temps réel**

---

## 📱 Méthode 3 : Terminal avec `xcrun simctl` (Pour Simulateur)

Si vous utilisez le simulateur iOS :

```bash
# Voir tous les logs du simulateur
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "sue"'

# Ou avec plus de détails
xcrun simctl spawn booted log stream --level debug
```

---

## 📱 Méthode 4 : Terminal avec `idevicesyslog` (Pour Appareil Physique)

Si vous avez `libimobiledevice` installé :

```bash
# Installer libimobiledevice (si pas déjà installé)
brew install libimobiledevice

# Voir les logs de l'appareil
idevicesyslog | grep -i "sue\|com.alliancetech"
```

---

## 🔍 Filtrer les Logs Utiles

### Rechercher les logs de contacts :
```
grep -i "contacts\|loadContacts\|checkContacts"
```

### Rechercher les logs d'API :
```
grep -i "API\|check-contacts\|phoneNumbers"
```

### Rechercher les erreurs :
```
grep -i "error\|❌\|failed"
```

---

## 📝 Format des Logs à Chercher

Avec les logs que nous avons ajoutés, vous devriez voir :

```
🔄 [loadContacts] Début du chargement des contacts...
📱 [contactsService] Local contacts fetched: X
📞 [loadContacts] Numéros de téléphone extraits: X
🚀 [loadContacts] Appel API checkContacts avec X numéros
🌐 [UsersApi.checkContacts] Appel API avec X numéros
📥 [loadContacts] Réponse API brute: {...}
👥 [loadContacts] Utilisateurs trouvés sur Sue: X
✅ [loadContacts] Contacts sur Sue: X
✅ [loadContacts] Contacts à inviter: X
```

---

## ⚠️ Notes Importantes

1. **L'app doit être installée** sur l'iPhone (peut être la version App Store)
2. **L'iPhone doit être déverrouillé** et faire confiance à l'ordinateur
3. **Les logs peuvent être nombreux** - utilisez les filtres pour trouver ce qui vous intéresse
4. **Les logs système iOS** peuvent aussi apparaître - filtrez par le nom de l'app

---

## 🚀 Alternative : React Native Debugger

Même avec une app production, vous pouvez parfois utiliser React Native Debugger si l'app a été compilée avec les outils de débogage :

1. **Installer React Native Debugger** :
   ```bash
   brew install --cask react-native-debugger
   ```

2. **Lancer l'app** sur votre iPhone
3. **Secouer l'appareil** pour ouvrir le menu de débogage (si disponible)
4. **Sélectionner "Debug"** ou "Open Debugger"

**Note** : Cette méthode ne fonctionne que si l'app a été compilée avec les outils de débogage activés (pas le cas pour les apps App Store en général).

---

## 🎯 Méthode Recommandée

**Pour votre cas** (app installée depuis l'App Store) :

1. ✅ Utilisez **Xcode Console** (Méthode 1) - C'est la plus simple et la plus fiable
2. ✅ Ou utilisez **Console.app** (Méthode 2) - Alternative simple

Ces deux méthodes fonctionnent même avec une app production installée depuis l'App Store.


