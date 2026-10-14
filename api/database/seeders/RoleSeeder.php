<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (RoleName::cases() as $name) {
            Role::firstOrCreate(
                ['name' => $name->value],
                ['status' => RoleStatus::Active],
            );
        }
    }
}
