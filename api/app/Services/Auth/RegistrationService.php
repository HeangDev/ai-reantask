<?php

namespace App\Services\Auth;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;

class RegistrationService
{
    /**
     * Public registration always creates a student (BR-USR-02), who stays PENDING until an admin or a teacher approves.
     *
     * @param  array<string, mixed>  $data  validated request data
     */
    public function register(array $data): User
    {
        $user = new User(collect($data)->only(['fullname', 'email', 'phone', 'password'])->all());

        $user->role_id = Role::where('name', RoleName::Student->value)->firstOrFail()->id;
        $user->status = UserStatus::Pending;
        $user->save();

        return $user->load('role');
    }

    /**
     * Same rules as register(): a student who stays PENDING until approved. Google gives no phone
     * number, and the random password is never shown; the user can set one with "forgot password".
     */
    public function registerFromGoogle(GoogleIdentity $identity): User
    {
        $user = new User(['fullname' => $identity->name, 'email' => $identity->email, 'password' => Str::random(40)]);

        $user->google_id = $identity->id;
        $user->email_verified_at = now();
        $user->role_id = Role::where('name', RoleName::Student->value)->firstOrFail()->id;
        $user->status = UserStatus::Pending;
        $user->save();

        return $user->load('role');
    }
}
