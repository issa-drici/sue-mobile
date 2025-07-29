# 📋 Demande Backend: Événements WebSocket pour les commentaires

## 🎯 **Description de la Demande**

Les événements WebSocket `comment.created` ne sont pas émis par le backend lors de la création de commentaires via l'API REST.

## 🔍 **Problème Actuel**

### **Symptômes**
- ✅ L'indicateur de frappe fonctionne (`user.typing`)
- ✅ Les commentaires se chargent via API REST
- ❌ **AUCUN** événement `comment.created` reçu via WebSocket
- ❌ Les nouveaux commentaires n'apparaissent pas en temps réel sur les autres appareils

### **Logs Frontend**
```
✅ ⌨️ Utilisateur en train de taper: {"isTyping": "4e86b99c-b306-4e1b-aefe-27644661c006", ...}
❌ 📨 Nouveau commentaire reçu via WebSocket: (JAMAIS AFFICHÉ)
```

### **Test Effectué**
1. **Appareil A** : Envoie un commentaire → Commentaire visible immédiatement
2. **Appareil B** : Aucun événement WebSocket reçu → Commentaire invisible jusqu'à fermeture/réouverture de la modal

## 🎯 **Solution Demandée**

### **Événements WebSocket Manquants**
Le backend doit émettre les événements suivants lors de la création/modification/suppression de commentaires :

```php
// Dans le CommentController ou CommentService

public function store(Request $request, $sessionId)
{
    $comment = Comment::create([
        'content' => $request->content,
        'session_id' => $sessionId,
        'user_id' => auth()->id(),
        // ... autres champs
    ]);

    // Charger les relations
    $comment->load('user:id,firstname,lastname,avatar');

    // ÉMISSION DE L'ÉVÉNEMENT WEBSOCKET
    broadcast(new CommentCreated($comment, $sessionId))->toOthers();

    return response()->json($comment);
}

public function update(Request $request, $commentId)
{
    $comment = Comment::findOrFail($commentId);
    $comment->update(['content' => $request->content]);

    // ÉMISSION DE L'ÉVÉNEMENT WEBSOCKET
    broadcast(new CommentUpdated($comment))->toOthers();

    return response()->json($comment);
}

public function destroy($commentId)
{
    $comment = Comment::findOrFail($commentId);
    $sessionId = $comment->session_id;
    $comment->delete();

    // ÉMISSION DE L'ÉVÉNEMENT WEBSOCKET
    broadcast(new CommentDeleted($commentId, $sessionId))->toOthers();

    return response()->json(['success' => true]);
}
```

### **Classes d'Événements Laravel**
```php
// app/Events/CommentCreated.php
class CommentCreated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $comment;
    public $sessionId;

    public function __construct($comment, $sessionId)
    {
        $this->comment = $comment;
        $this->sessionId = $sessionId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('session.' . $this->sessionId);
    }

    public function broadcastAs()
    {
        return 'comment.created';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->comment->id,
            'content' => $this->comment->content,
            'user' => [
                'id' => $this->comment->user->id,
                'firstname' => $this->comment->user->firstname,
                'lastname' => $this->comment->user->lastname,
                'avatar' => $this->comment->user->avatar,
            ],
            'created_at' => $this->comment->created_at,
            'updated_at' => $this->comment->updated_at,
        ];
    }
}
```

### **Configuration des Canaux**
```php
// routes/channels.php
Broadcast::channel('session.{sessionId}', function ($user, $sessionId) {
    // Vérifier que l'utilisateur a accès à cette session
    return Session::where('id', $sessionId)
        ->where(function($query) use ($user) {
            $query->where('organizer_id', $user->id)
                  ->orWhereHas('participants', function($q) use ($user) {
                      $q->where('user_id', $user->id);
                  });
        })
        ->exists();
});
```

## 📱 **Impact Frontend**

### **Avant (Problématique)**
- ❌ Nouveaux commentaires invisibles sur les autres appareils
- ❌ Fermeture/réouverture de la modal nécessaire
- ❌ Mauvaise expérience utilisateur

### **Après (Solution)**
- ✅ Nouveaux commentaires visibles immédiatement
- ✅ Expérience temps réel fluide
- ✅ Pas de rechargement manuel nécessaire

## 🚀 **Priorité**

**HAUTE** - Cette fonctionnalité est critique pour l'expérience utilisateur temps réel.

## 🔗 **Liens Utiles**

- **Endpoint concerné** : `POST /api/sessions/{sessionId}/comments`
- **Événements WebSocket** : `comment.created`, `comment.updated`, `comment.deleted`
- **Canal** : `session.{sessionId}`
- **Frontend** : Écoute déjà configurée dans `services/websocket/index.ts`

## 📝 **Notes Additionnelles**

- Les événements de frappe (`user.typing`) fonctionnent déjà
- Le frontend est prêt à recevoir ces événements
- La structure des données est compatible
- Testé avec deux appareils différents

---

**Date** : 22/07/2025  
**Environnement** : Développement  
**Version Frontend** : React Native Expo  
**Version Backend** : Laravel  
**Testé** : ✅ Deux appareils, indicateur de frappe fonctionne 