<?php

namespace App\Policies;

use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SchoolClassPolicy
{
    /**
     * Every signed-in user may list; `SchoolClass::visibleTo()` narrows what they see.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * BR-CLS-02: users who are not part of the class must not know it exists.
     */
    public function view(User $user, SchoolClass $class): Response
    {
        return $this->canSee($user, $class)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, SchoolClass $class): Response
    {
        return $this->manage($user, $class);
    }

    public function delete(User $user, SchoolClass $class): Response
    {
        return $this->manage($user, $class);
    }

    /**
     * BR-CLS-01: only admins manage classes. Members get 403, everyone else 404.
     */
    private function manage(User $user, SchoolClass $class): Response
    {
        if ($user->isAdmin()) {
            return Response::allow();
        }

        return $this->canSee($user, $class)
            ? Response::deny()
            : Response::denyAsNotFound();
    }

    private function canSee(User $user, SchoolClass $class): bool
    {
        return SchoolClass::query()->visibleTo($user)->whereKey($class->getKey())->exists();
    }
}
