<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Users\IndexUsersRequest;
use App\Http\Requests\Api\V1\Users\StoreUserRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Services\Users\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(IndexUsersRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        return UserResource::collection(
            $this->users->paginate($request->user(), $request->validated())
        );
    }

    public function pendingStudents(IndexUsersRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewPending', User::class);

        return UserResource::collection(
            $this->users->paginatePendingStudents((int) $request->validated('per_page', 15))
        );
    }

    public function approve(Request $request, User $user): UserResource
    {
        Gate::authorize('approve', $user);

        return new UserResource($this->users->approve($request->user(), $user));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create($request->user(), $request->validated());

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return new UserResource($user->load('role'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        return new UserResource($this->users->update($request->user(), $user, $request->validated()));
    }

    public function destroy(Request $request, User $user): Response
    {
        Gate::authorize('delete', $user);

        $this->users->delete($request->user(), $user);

        return response()->noContent();
    }
}
