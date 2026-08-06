# Guide de Test - Permission Contacts

Ce guide explique comment tester la demande de permission contacts pour les utilisateurs ayant déjà complété l'onboarding.

## 🎯 Scénario de Test

Tester que les utilisateurs qui ont déjà passé l'onboarding voient bien la demande de permission contacts lorsqu'ils accèdent à l'écran "Ajouter un ami" pour la première fois.

---

## 📱 Méthode 1 : Via le Menu Dev (Recommandé)

### Étapes

1. **Ouvrir le menu dev** dans l'application
2. **Cliquer sur "Réinitialiser Flag Contacts"**
   - Cela supprime le flag `contacts_permission_requested` dans AsyncStorage
3. **Réinitialiser la permission dans les paramètres du simulateur** (voir méthodes ci-dessous)
4. **Relancer l'application**
5. **Aller sur l'écran "Ajouter un ami"**
6. **Vérifier que l'alerte de demande de permission s'affiche**

---

## 🤖 Android - Réinitialiser les Permissions

### Méthode 1 : Via ADB (Recommandé)

```bash
# Lister les packages pour trouver le nom exact
adb shell pm list packages | grep sue

# Réinitialiser la permission READ_CONTACTS
adb shell pm reset-permissions com.alliancetech.com

# Ou réinitialiser toutes les permissions de l'app
adb shell pm revoke com.alliancetech.com android.permission.READ_CONTACTS
```

### Méthode 2 : Via l'Interface du Simulateur

1. Ouvrir **Paramètres** sur le simulateur Android
2. Aller dans **Applications** → **SUE** (ou le nom de votre app)
3. Cliquer sur **Permissions**
4. Trouver **Contacts** et le désactiver
5. Relancer l'application

### Méthode 3 : Réinstaller l'Application

```bash
# Désinstaller l'app
adb uninstall com.alliancetech.com

# Réinstaller
npx expo run:android
```

---

## 🍎 iOS - Réinitialiser les Permissions

### Méthode 1 : Via les Paramètres du Simulateur

1. Ouvrir **Réglages** sur le simulateur iOS
2. Aller dans **Confidentialité et sécurité** → **Contacts**
3. Trouver **SUE** et désactiver l'accès
4. Relancer l'application

### Méthode 2 : Réinstaller l'Application

```bash
# Désinstaller l'app du simulateur
xcrun simctl uninstall booted com.alliancetech.com

# Réinstaller
npx expo run:ios
```

### Méthode 3 : Reset Complet du Simulateur

```bash
# Lister les simulateurs
xcrun simctl list devices

# Effacer le simulateur (remplace DEVICE_ID par l'ID du simulateur)
xcrun simctl erase DEVICE_ID
```

---

## 🔧 Réinitialiser le Flag AsyncStorage

### Via le Menu Dev

1. Ouvrir le menu dev dans l'app
2. Cliquer sur "Réinitialiser Flag Contacts"

### Via le Code (Temporaire)

Ajouter temporairement dans `app/add-friend.tsx` :

```typescript
useEffect(() => {
  // TEMPORAIRE : Réinitialiser le flag pour tester
  AsyncStorage.removeItem('contacts_permission_requested');
  checkContactsPermissionStatus();
}, []);
```

**⚠️ N'oubliez pas de retirer ce code après les tests !**

### Via la Console

Dans React Native Debugger ou la console Metro :

```javascript
// Dans la console du navigateur (si React Native Debugger est activé)
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
AsyncStorage.removeItem('contacts_permission_requested').then(() => {
  console.log('Flag réinitialisé !');
});
```

---

## ✅ Checklist de Test

### Test 1 : Première Demande de Permission

- [ ] Réinitialiser le flag AsyncStorage
- [ ] Réinitialiser la permission dans les paramètres
- [ ] Relancer l'application
- [ ] Aller sur "Ajouter un ami"
- [ ] **Vérifier** : L'alerte de demande de permission s'affiche
- [ ] Cliquer sur "Autoriser"
- [ ] **Vérifier** : La permission système s'affiche
- [ ] Accepter la permission
- [ ] **Vérifier** : Les contacts se chargent

### Test 2 : Permission Déjà Accordée

- [ ] S'assurer que la permission est accordée
- [ ] Aller sur "Ajouter un ami"
- [ ] **Vérifier** : Les contacts se chargent directement (pas d'alerte)

### Test 3 : Permission Refusée

- [ ] Réinitialiser le flag AsyncStorage
- [ ] Réinitialiser la permission dans les paramètres
- [ ] Relancer l'application
- [ ] Aller sur "Ajouter un ami"
- [ ] Cliquer sur "Plus tard" ou refuser la permission système
- [ ] **Vérifier** : Le flag est sauvegardé
- [ ] Relancer l'app et retourner sur "Ajouter un ami"
- [ ] **Vérifier** : L'alerte ne se redemande plus

### Test 4 : Permission Réactivée

- [ ] Après avoir refusé, aller dans les paramètres
- [ ] Réactiver la permission contacts
- [ ] Retourner sur "Ajouter un ami"
- [ ] **Vérifier** : Les contacts se chargent automatiquement

---

## 🐛 Dépannage

### L'alerte ne s'affiche pas

1. Vérifier que le flag `contacts_permission_requested` est bien supprimé :
   ```bash
   # Dans la console Metro
   AsyncStorage.getItem('contacts_permission_requested').then(console.log)
   ```

2. Vérifier le statut de la permission :
   ```typescript
   const { status } = await Contacts.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

3. Vérifier les logs dans la console pour voir ce qui se passe dans `checkContactsPermissionStatus`

### La permission est toujours accordée

- Sur Android, utiliser `adb shell pm revoke` pour révoquer la permission
- Sur iOS, aller dans Réglages → Confidentialité → Contacts

### Les contacts ne se chargent pas après acceptation

- Vérifier les logs de `loadContacts()`
- Vérifier que `getPhoneContacts()` retourne bien des contacts
- Vérifier que la permission est bien `granted`

---

## 📝 Notes

- Le flag `contacts_permission_requested` est stocké dans AsyncStorage
- Ce flag empêche de redemander la permission à chaque fois
- Si l'utilisateur refuse, on ne redemande plus (pour éviter le spam)
- Si l'utilisateur réactive la permission dans les paramètres, les contacts se chargeront automatiquement au prochain accès

---

## 🚀 Commandes Rapides

### Android - Tout Réinitialiser

```bash
# Révoquer la permission
adb shell pm revoke com.alliancetech.com android.permission.READ_CONTACTS

# Réinstaller l'app (optionnel)
adb uninstall com.alliancetech.com && npx expo run:android
```

### iOS - Tout Réinitialiser

```bash
# Désinstaller l'app
xcrun simctl uninstall booted com.alliancetech.com

# Réinstaller
npx expo run:ios
```



