<?php

namespace Database\Factories;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->slug(2),
            'status' => RoleStatus::Active,
        ];
    }

    public function admin(): static
    {
        return $this->state(['name' => RoleName::Admin->value]);
    }

    public function teacher(): static
    {
        return $this->state(['name' => RoleName::Teacher->value]);
    }

    public function student(): static
    {
        return $this->state(['name' => RoleName::Student->value]);
    }

    public function inactive(): static
    {
        return $this->state(['status' => RoleStatus::Inactive]);
    }
}
