<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the first admin from environment variables (never hard-coded credentials).
 * Does nothing when the variables are not set.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.admin.email');
        $password = config('app.admin.password');

        if (! $email || ! $password) {
            $this->command?->warn('ADMIN_EMAIL or ADMIN_PASSWORD is not set; skipping the admin user.');

            return;
        }

        $admin = User::withTrashed()->firstOrNew(['email' => strtolower($email)]);

        if ($admin->exists) {
            return;
        }

        $admin->fill([
            'fullname' => config('app.admin.fullname'),
            'username' => config('app.admin.username'),
            'phone' => config('app.admin.phone'),
            'password' => $password,
        ]);
        $admin->role_id = Role::where('name', RoleName::Admin->value)->value('id');
        $admin->status = UserStatus::Active;
        $admin->save();
    }
}
