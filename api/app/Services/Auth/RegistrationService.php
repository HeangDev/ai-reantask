<?php

namespace App\Services\Auth;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;

class RegistrationService
{
    /**
     * Public registration always creates a student (BR-USR-02).
     *
     * @param  array<string, mixed>  $data  validated request data
     */
    public function register(array $data): User
    {
        $user = new User(collect($data)->only(['fullname', 'username', 'email', 'phone', 'password'])->all());

        $user->role_id = Role::where('name', RoleName::Student->value)->firstOrFail()->id;
        $user->status = UserStatus::Active;
        $user->save();

        return $user->load('role');
    }
}
