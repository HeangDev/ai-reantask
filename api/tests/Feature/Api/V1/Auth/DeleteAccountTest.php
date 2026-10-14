<?php

use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\RoleSeeder;

it('returns 401 without a token', function () {
    $this->deleteJson('/api/v1/auth/account', ['current_password' => 'password'])->assertUnauthorized();
});

it('suspends, soft-deletes and signs out the account', function (string $factoryState) {
    $user = User::factory()->{$factoryState}()->create(['email' => 'me@example.com', 'password' => 'my-password-1']);
    $token = $user->createToken('current')->plainTextToken;
    $user->createToken('other');

    $this->withToken($token)
        ->deleteJson('/api/v1/auth/account', ['current_password' => 'my-password-1'])
        ->assertNoContent();

    $this->assertSoftDeleted('users', ['id' => $user->id, 'status' => 'SUSPENDED', 'deleted_by_user' => $user->id]);
    expect($user->tokens()->count())->toBe(0);

    $this->postJson('/api/v1/auth/login', ['email' => 'me@example.com', 'password' => 'my-password-1'])
        ->assertUnauthorized();
    // The guard caches the user within a test; reset it to behave like a new request.
    app('auth')->forgetGuards();
    $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
})->with(['student', 'teacher']);

it('br_usr_05: keeps the email reserved after deletion', function () {
    $user = User::factory()->create(['email' => 'me@example.com', 'password' => 'my-password-1']);
    $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/auth/account', ['current_password' => 'my-password-1'])->assertNoContent();

    $this->seed(RoleSeeder::class);
    $this->postJson('/api/v1/auth/register', [
        'fullname' => 'New', 'email' => 'me@example.com', 'phone' => '+855 11 222 333',
        'password' => 'password123', 'password_confirmation' => 'password123',
    ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

it('requires the correct current password', function () {
    $user = User::factory()->create(['password' => 'my-password-1']);
    $token = $user->createToken('current')->plainTextToken;

    $this->withToken($token)->deleteJson('/api/v1/auth/account', [])
        ->assertUnprocessable()->assertJsonValidationErrors(['current_password']);
    $this->withToken($token)->deleteJson('/api/v1/auth/account', ['current_password' => 'wrong'])
        ->assertUnprocessable()->assertJsonValidationErrors(['current_password']);

    $this->assertNotSoftDeleted('users', ['id' => $user->id]);
    expect($user->fresh()->status)->toBe(UserStatus::Active)->and($user->tokens()->count())->toBe(1);
});

it('br_usr_04: forbids admins from deleting their own account', function () {
    $admin = User::factory()->admin()->create(['password' => 'my-password-1']);
    $token = $admin->createToken('current')->plainTextToken;

    // 403 comes before password validation.
    $this->withToken($token)->deleteJson('/api/v1/auth/account', [])->assertForbidden();
    $this->withToken($token)->deleteJson('/api/v1/auth/account', ['current_password' => 'my-password-1'])->assertForbidden();

    $this->assertNotSoftDeleted('users', ['id' => $admin->id]);
});

it('does not touch other users', function () {
    $other = User::factory()->create();
    $other->createToken('keep');
    $user = User::factory()->create(['password' => 'my-password-1']);

    $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/auth/account', ['current_password' => 'my-password-1'])->assertNoContent();

    $this->assertNotSoftDeleted('users', ['id' => $other->id]);
    expect($other->fresh()->status)->toBe(UserStatus::Active)->and($other->tokens()->count())->toBe(1);
});
