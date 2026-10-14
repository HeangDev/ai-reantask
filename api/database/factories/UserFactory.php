<?php

namespace Database\Factories;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state. Users are students unless a role state is applied.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role_id' => fn () => $this->roleId(RoleName::Student),
            'fullname' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->unique()->numerify('+855#########'),
            'password' => static::$password ??= Hash::make('password'),
            'avatar' => null,
            'status' => UserStatus::Active,
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role_id' => $this->roleId(RoleName::Admin)]);
    }

    public function teacher(): static
    {
        return $this->state(fn () => ['role_id' => $this->roleId(RoleName::Teacher)]);
    }

    public function student(): static
    {
        return $this->state(fn () => ['role_id' => $this->roleId(RoleName::Student)]);
    }

    public function status(UserStatus $status): static
    {
        return $this->state(['status' => $status]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    private function roleId(RoleName $name): int
    {
        return Role::firstOrCreate(['name' => $name->value])->id;
    }
}
