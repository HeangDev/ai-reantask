<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * RefreshDatabase wipes every table. Refuse to do that anywhere but the test database.
     */
    protected function beforeRefreshingDatabase()
    {
        $database = (string) config('database.connections.'.config('database.default').'.database');

        if (! str_ends_with($database, '_test')) {
            throw new RuntimeException("Refusing to refresh [{$database}]: tests must use a database ending in _test (see .env.testing).");
        }
    }

    protected function actingAsAdmin(): User
    {
        return tap(User::factory()->admin()->create(), fn (User $user) => Sanctum::actingAs($user));
    }

    protected function actingAsTeacher(): User
    {
        return tap(User::factory()->teacher()->create(), fn (User $user) => Sanctum::actingAs($user));
    }

    protected function actingAsStudent(): User
    {
        return tap(User::factory()->student()->create(), fn (User $user) => Sanctum::actingAs($user));
    }
}
