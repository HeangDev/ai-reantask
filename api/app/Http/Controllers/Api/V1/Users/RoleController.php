<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\RoleResource;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Role::class);

        $roles = Role::query()
            ->visibleTo($request->user())
            ->orderBy('id')
            ->paginate($request->integer('per_page', 15));

        return RoleResource::collection($roles);
    }
}
