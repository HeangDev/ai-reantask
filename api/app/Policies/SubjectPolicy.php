<?php

namespace App\Policies;

use App\Enums\SubjectStatus;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SubjectPolicy
{
    /**
     * Every signed-in user may list; `Subject::visibleTo()` narrows what they see.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * BR-SBJ-02: non-admins must not know an INACTIVE subject exists.
     */
    public function view(User $user, Subject $subject): Response
    {
        return $this->canSee($user, $subject)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Subject $subject): Response
    {
        return $this->manage($user, $subject);
    }

    public function delete(User $user, Subject $subject): Response
    {
        return $this->manage($user, $subject);
    }

    /**
     * BR-SBJ-01: only admins manage subjects. Users who can see it get 403, others 404.
     */
    private function manage(User $user, Subject $subject): Response
    {
        if ($user->isAdmin()) {
            return Response::allow();
        }

        return $this->canSee($user, $subject)
            ? Response::deny()
            : Response::denyAsNotFound();
    }

    private function canSee(User $user, Subject $subject): bool
    {
        return $user->isAdmin() || $subject->status === SubjectStatus::Active;
    }
}
