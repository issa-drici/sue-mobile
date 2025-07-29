# Exemple d'Implémentation Backend - Annulation de Demande d'Ami

## 🏗️ Structure Proposée

### 1. Migration de Base de Données

```php
// database/migrations/2025_01_20_add_cancelled_at_to_friend_requests_table.php

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('friend_requests', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable();
            $table->index(['user_id', 'status']);
        });
    }

    public function down()
    {
        Schema::table('friend_requests', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn('cancelled_at');
        });
    }
};
```

### 2. Modèle FriendRequest

```php
// app/Models/FriendRequest.php

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FriendRequest extends Model
{
    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'status',
        'cancelled_at'
    ];

    protected $casts = [
        'cancelled_at' => 'datetime',
    ];

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function isCancelled(): bool
    {
        return !is_null($this->cancelled_at);
    }

    public function canBeCancelled(): bool
    {
        return $this->status === 'pending' && !$this->isCancelled();
    }
}
```

### 3. Contrôleur

```php
// app/Http/Controllers/FriendRequestController.php

<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class FriendRequestController extends Controller
{
    // ... autres méthodes existantes ...

    /**
     * Annuler une demande d'ami envoyée
     */
    public function cancel(Request $request, string $userId): JsonResponse
    {
        try {
            // Récupérer la demande d'ami de l'utilisateur connecté vers l'utilisateur cible
            $friendRequest = FriendRequest::where('from_user_id', Auth::id())
                ->where('to_user_id', $userId)
                ->where('status', 'pending')
                ->first();

            if (!$friendRequest) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'FRIEND_REQUEST_NOT_FOUND',
                        'message' => 'Aucune demande d\'ami trouvée vers cet utilisateur'
                    ]
                ], 404);
            }

            // Vérifier que la demande peut être annulée
            if (!$friendRequest->canBeCancelled()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'REQUEST_ALREADY_PROCESSED',
                        'message' => 'Cette demande d\'ami a déjà été acceptée ou refusée'
                    ]
                ], 409);
            }

            // Annuler la demande
            $friendRequest->update([
                'cancelled_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'cancelled' => true,
                    'cancelledAt' => $friendRequest->cancelled_at
                ],
                'message' => 'Demande d\'ami annulée avec succès'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Une erreur est survenue lors de l\'annulation'
                ]
            ], 500);
        }
    }
}
```

### 4. Routes

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    // ... autres routes existantes ...
    
    // Annuler une demande d'ami
    Route::delete('/users/friend-requests/cancel/{userId}', [FriendRequestController::class, 'cancel'])
        ->name('friend-requests.cancel');
});
```

### 5. Validation (Optionnel)

```php
// app/Http/Requests/CancelFriendRequestRequest.php

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelFriendRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requestId' => 'required|uuid|exists:friend_requests,id'
        ];
    }

    public function messages(): array
    {
        return [
            'requestId.required' => 'L\'ID de la demande est requis',
            'requestId.uuid' => 'L\'ID de la demande doit être un UUID valide',
            'requestId.exists' => 'Demande d\'ami introuvable'
        ];
    }
}
```

### 6. Tests Unitaires

```php
// tests/Feature/FriendRequestCancellationTest.php

<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\FriendRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FriendRequestCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_cancel_own_friend_request()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();
        $friendRequest = FriendRequest::factory()->create([
            'from_user_id' => $user->id,
            'to_user_id' => $targetUser->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/users/friend-requests/cancel/{$targetUser->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Demande d\'ami annulée avec succès'
            ]);

        $this->assertNotNull($friendRequest->fresh()->cancelled_at);
    }

    public function test_user_cannot_cancel_nonexistent_friend_request()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/users/friend-requests/cancel/{$targetUser->id}");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'FRIEND_REQUEST_NOT_FOUND'
                ]
            ]);
    }

    public function test_cannot_cancel_already_processed_request()
    {
        $user = User::factory()->create();
        $targetUser = User::factory()->create();
        $friendRequest = FriendRequest::factory()->create([
            'from_user_id' => $user->id,
            'to_user_id' => $targetUser->id,
            'status' => 'accepted'
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/users/friend-requests/cancel/{$targetUser->id}");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'REQUEST_ALREADY_PROCESSED'
                ]
            ]);
    }
}
```

## 🔧 Mise à Jour de l'API Mobile

Une fois l'endpoint implémenté, mettre à jour le service mobile :

```typescript
// services/api/usersApi.ts

export class UsersApi {
    // ... autres méthodes ...

    // Annuler une demande d'ami
    static async cancelFriendRequest(userId: string): Promise<void> {
        const response = await baseApiService.delete<void>(`${FRIEND_REQUESTS_ENDPOINTS.CANCEL(userId)}`);
        return response.data;
    }
}
```

```typescript
// services/api/endpoints.ts

export const FRIEND_REQUESTS_ENDPOINTS = {
    // ... autres endpoints ...
    CANCEL: (userId: string) => `/users/friend-requests/cancel/${userId}`,
} as const;
```

## 📋 Checklist de Déploiement

- [ ] Migration de base de données créée et testée
- [ ] Modèle FriendRequest mis à jour
- [ ] Contrôleur implémenté avec gestion d'erreurs
- [ ] Routes ajoutées
- [ ] Tests unitaires écrits et passants
- [ ] Tests d'intégration effectués
- [ ] Documentation API mise à jour
- [ ] Déploiement en staging
- [ ] Tests avec l'application mobile
- [ ] Déploiement en production

---

**Note :** Cette implémentation est un exemple et peut nécessiter des ajustements selon l'architecture existante du projet. 