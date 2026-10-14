<?php

namespace App\Services\Users;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    /**
     * @param  array{search?: string, role?: string, status?: string, sort?: string, per_page?: int}  $filters
     */
    public function paginate(User $actor, array $filters): LengthAwarePaginator
    {
        // Visibility is applied first; filters only narrow it further.
        $query = User::query()->visibleTo($actor)->with('role');

        if (isset($filters['role'])) {
            $query->whereHas('role', fn ($q) => $q->where('name', $filters['role']));
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $term = '%'.addcslashes($filters['search'], '\\%_').'%';

            $query->where(fn ($q) => $q
                ->where('fullname', 'like', $term)
                ->orWhere('username', 'like', $term)
                ->orWhere('email', 'like', $term));
        }

        $sort = $filters['sort'] ?? '-created_at';
        $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc')
            ->orderBy('id');

        return $query->paginate($filters['per_page'] ?? 15)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data  validated request data
     */
    public function create(User $actor, array $data): User
    {
        $user = new User(collect($data)->only(['fullname', 'username', 'email', 'phone', 'password'])->all());

        // Server-owned fields are never mass-assigned.
        $user->role_id = $data['role_id'];
        $user->status = $data['status'] ?? UserStatus::Active->value;
        $user->created_by_user = $actor->id;
        $user->save();

        return $user->load('role');
    }

    /**
     * Changing the role revokes the user's tokens so clients pick up the new permissions.
     *
     * @param  array<string, mixed>  $data  validated request data
     */
    public function update(User $actor, User $target, array $data): User
    {
        return DB::transaction(function () use ($actor, $target, $data) {
            $target->fill(collect($data)->only(['fullname', 'username', 'email', 'phone'])->all());

            $roleChanged = isset($data['role_id']) && (int) $data['role_id'] !== $target->role_id;

            if ($roleChanged) {
                $target->role_id = $data['role_id'];
            }

            if (isset($data['status'])) {
                $target->status = $data['status'];
            }

            if ($target->isDirty()) {
                $target->updated_by_user = $actor->id;
                $target->save();
            }

            if ($roleChanged) {
                $target->tokens()->delete();
            }

            return $target->load('role');
        });
    }

    /**
     * Self-service deletion: the account is suspended, soft-deleted, and signed out everywhere.
     * Only the user is deleted (BR-USR-07). The email, username, and phone stay reserved (BR-USR-05).
     */
    public function deleteOwnAccount(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->status = UserStatus::Suspended;
            $user->deleted_by_user = $user->id;
            $user->save();
            $user->delete();
            $user->tokens()->delete();
        });
    }

    /**
     * Soft-deletes only the user (BR-USR-07) and revokes their tokens (BR-USR-06).
     */
    public function delete(User $actor, User $target): void
    {
        DB::transaction(function () use ($actor, $target) {
            $target->deleted_by_user = $actor->id;
            $target->save();
            $target->delete();
            $target->tokens()->delete();
        });
    }
}
