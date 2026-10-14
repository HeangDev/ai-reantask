<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $target): Response
    {
        return $this->canSee($user, $target)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * Admins and the user themselves; everyone else must not know the account exists.
     */
    public function viewSessions(User $user, User $target): Response
    {
        return $this->view($user, $target);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $target): Response
    {
        return $this->view($user, $target);
    }

    /**
     * BR-USR-03, BR-USR-04: only admins change roles, never their own.
     */
    public function changeRole(User $user, User $target): bool
    {
        return $user->isAdmin() && $user->isNot($target);
    }

    /**
     * Same restriction as roles, so an admin cannot suspend their own account.
     */
    public function changeStatus(User $user, User $target): bool
    {
        return $this->changeRole($user, $target);
    }

    /**
     * BR-USR-04: admins cannot delete their own account.
     */
    public function delete(User $user, User $target): Response
    {
        if ($user->isAdmin() && $user->isNot($target)) {
            return Response::allow();
        }

        // The user can already see this account, so a 403 leaks nothing.
        return $this->canSee($user, $target)
            ? Response::deny()
            : Response::denyAsNotFound();
    }

    /**
     * Self-service account deletion. Admins cannot delete their own account (BR-USR-04).
     */
    public function deleteAccount(User $user): bool
    {
        return ! $user->isAdmin();
    }

    private function canSee(User $user, User $target): bool
    {
        return $user->isAdmin() || $user->is($target);
    }
}
