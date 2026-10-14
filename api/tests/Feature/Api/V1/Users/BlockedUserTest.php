<?php

use App\Enums\UserStatus;
use App\Models\User;

it('br_usr_10: blocks a non-active user who still holds a token', function (UserStatus $status) {
    $user = User::factory()->create();
    $token = $user->createToken('device')->plainTextToken;
    $user->forceFill(['status' => $status])->save();

    $this->withToken($token)->getJson('/api/v1/auth/me')
        ->assertForbidden()
        ->assertJsonPath('code', 'ACCOUNT_NOT_ACTIVE');
    $this->withToken($token)->getJson("/api/v1/users/{$user->id}")->assertForbidden();
})->with([UserStatus::Pending, UserStatus::Inactive, UserStatus::Suspended, UserStatus::Deleted]);

it('still answers 401 for a missing token before checking status', function () {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('br_usr_10: revokes all tokens when an admin blocks a user', function (string $status) {
    $this->actingAsAdmin();
    $student = User::factory()->student()->create();
    $student->createToken('phone');
    $student->createToken('laptop');

    $this->patchJson("/api/v1/users/{$student->id}", ['status' => $status])
        ->assertOk()
        ->assertJsonPath('data.status', $status);

    expect($student->tokens()->count())->toBe(0);
})->with(['SUSPENDED', 'INACTIVE']);

it('keeps tokens when the status stays ACTIVE', function () {
    $this->actingAsAdmin();
    $student = User::factory()->student()->create();
    $student->createToken('phone');

    $this->patchJson("/api/v1/users/{$student->id}", ['status' => 'ACTIVE', 'fullname' => 'Same'])->assertOk();

    expect($student->tokens()->count())->toBe(1);
});

it('lets a suspended user log in again after an admin reactivates them', function () {
    $this->actingAsAdmin();
    $student = User::factory()->student()->status(UserStatus::Suspended)->create(['email' => 's@example.com', 'password' => 'correct-password']);

    $this->patchJson("/api/v1/users/{$student->id}", ['status' => 'ACTIVE'])->assertOk();

    app('auth')->forgetGuards();
    $this->postJson('/api/v1/auth/login', ['email' => 's@example.com', 'password' => 'correct-password'])->assertOk();
});
