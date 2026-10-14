<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SessionResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\PersonalAccessToken;

class SessionController extends Controller
{
    /**
     * Lists the user's active (unexpired) login sessions, newest first.
     */
    public function index(Request $request, User $user): AnonymousResourceCollection
    {
        Gate::authorize('viewSessions', $user);

        $sessions = $user->tokens()
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100))
            ->withQueryString();

        // Only the owner can tell which session is theirs.
        $current = $request->user()->is($user) ? $request->user()->currentAccessToken() : null;

        $request->attributes->set('current_token_id', $current instanceof PersonalAccessToken ? $current->id : null);

        return SessionResource::collection($sessions);
    }
}
