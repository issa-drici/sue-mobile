# 🔧 Correction API Sessions - Backend Laravel

## 🎯 Problème identifié

L'endpoint `GET /api/sessions` retourne des objets vides `{}` au lieu des vraies données de session.

**Diagnostic :**
- ✅ `GET /api/sessions/{id}` fonctionne parfaitement
- ❌ `GET /api/sessions` retourne des objets vides
- ❌ `GET /api/sessions/my` et `/api/sessions/created` n'existent pas

## 🔍 Causes possibles

1. **Problème de sérialisation** dans le contrôleur Sessions
2. **Relations non chargées** (organizer, participants)
3. **Permissions insuffisantes** sur certaines sessions
4. **Structure de données incorrecte** dans la réponse

## 💡 Solutions à implémenter

### 1. Corriger le contrôleur Sessions

```php
// app/Http/Controllers/SessionController.php

public function index(Request $request)
{
    try {
        $user = $request->user();
        
        // Charger les sessions avec les relations
        $sessions = SportSession::with([
            'organizer:id,firstname,lastname',
            'participants.user:id,firstname,lastname',
            'comments.author:id,firstname,lastname'
        ])
        ->where(function($query) use ($user) {
            // Sessions où l'utilisateur est organisateur
            $query->where('organizer_id', $user->id)
                  // OU sessions où l'utilisateur participe
                  ->orWhereHas('participants', function($q) use ($user) {
                      $q->where('user_id', $user->id);
                  });
        })
        ->orderBy('date', 'asc')
        ->orderBy('time', 'asc')
        ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $sessions->items(),
            'pagination' => [
                'page' => $sessions->currentPage(),
                'limit' => $sessions->perPage(),
                'total' => $sessions->total(),
                'totalPages' => $sessions->lastPage(),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'SESSIONS_FETCH_ERROR',
                'message' => $e->getMessage()
            ]
        ], 500);
    }
}
```

### 2. Ajouter les endpoints manquants

```php
// Sessions créées par l'utilisateur
public function myCreated(Request $request)
{
    try {
        $user = $request->user();
        
        $sessions = SportSession::with([
            'organizer:id,firstname,lastname',
            'participants.user:id,firstname,lastname',
            'comments.author:id,firstname,lastname'
        ])
        ->where('organizer_id', $user->id)
        ->orderBy('date', 'asc')
        ->orderBy('time', 'asc')
        ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $sessions->items(),
            'pagination' => [
                'page' => $sessions->currentPage(),
                'limit' => $sessions->perPage(),
                'total' => $sessions->total(),
                'totalPages' => $sessions->lastPage(),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'SESSIONS_FETCH_ERROR',
                'message' => $e->getMessage()
            ]
        ], 500);
    }
}

// Sessions où l'utilisateur participe
public function myParticipations(Request $request)
{
    try {
        $user = $request->user();
        
        $sessions = SportSession::with([
            'organizer:id,firstname,lastname',
            'participants.user:id,firstname,lastname',
            'comments.author:id,firstname,lastname'
        ])
        ->whereHas('participants', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->orderBy('date', 'asc')
        ->orderBy('time', 'asc')
        ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $sessions->items(),
            'pagination' => [
                'page' => $sessions->currentPage(),
                'limit' => $sessions->perPage(),
                'total' => $sessions->total(),
                'totalPages' => $sessions->lastPage(),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'SESSIONS_FETCH_ERROR',
                'message' => $e->getMessage()
            ]
        ], 500);
    }
}
```

### 3. Mettre à jour les routes

```php
// routes/api.php

// Sessions
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/sessions', [SessionController::class, 'index']);
    Route::get('/sessions/my-created', [SessionController::class, 'myCreated']);
    Route::get('/sessions/my-participations', [SessionController::class, 'myParticipations']);
    Route::get('/sessions/{session}', [SessionController::class, 'show']);
    Route::post('/sessions', [SessionController::class, 'store']);
    Route::put('/sessions/{session}', [SessionController::class, 'update']);
    Route::delete('/sessions/{session}', [SessionController::class, 'destroy']);
});
```

### 4. Vérifier le modèle SportSession

```php
// app/Models/SportSession.php

class SportSession extends Model
{
    protected $fillable = [
        'title',
        'sport',
        'date',
        'time',
        'location',
        'max_participants',
        'organizer_id',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
    ];

    // Relations
    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function participants()
    {
        return $this->hasMany(SessionParticipant::class, 'session_id');
    }

    public function comments()
    {
        return $this->hasMany(SessionComment::class, 'session_id');
    }

    // Accesseurs pour la sérialisation
    public function getOrganizerFullNameAttribute()
    {
        return $this->organizer ? 
            $this->organizer->firstname . ' ' . $this->organizer->lastname : 
            'Organisateur inconnu';
    }
}
```

## 🧪 Tests à effectuer

1. **Test de l'endpoint corrigé :**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/sessions
```

2. **Test des nouveaux endpoints :**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/sessions/my-created
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/sessions/my-participations
```

3. **Vérification des données :**
- Les sessions doivent avoir tous les champs remplis
- Les relations organizer, participants, comments doivent être chargées
- La pagination doit fonctionner

## 📱 Mise à jour côté mobile

Une fois l'API corrigée, mettre à jour le hook `useGetSessions` :

```typescript
// services/sessions/getSessions.ts

// Supprimer la logique de sessions factices
function convertToSportSession(session: any): SportSession {
  // Utiliser les vraies données de l'API
  return {
    id: session.id,
    sport: session.sport,
    date: session.date,
    time: session.time,
    location: session.location,
    organizer: {
      id: session.organizer.id,
      firstName: session.organizer.firstname,
      lastName: session.organizer.lastname,
    },
    participants: session.participants || [],
    comments: session.comments || [],
  };
}
```

## ✅ Résultat attendu

Après correction :
- ✅ Les sessions s'affichent avec les vraies données
- ✅ Les relations sont correctement chargées
- ✅ La pagination fonctionne
- ✅ Les nouveaux endpoints sont disponibles
- ✅ L'application mobile affiche les vraies sessions 