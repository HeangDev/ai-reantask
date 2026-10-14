<?php

use App\Models\User;

it('returns 401 for guests', function () {
    $this->getJson('/api/v1/users/1/sessions')->assertUnauthorized();
});

it('lists a user\'s own sessions and marks the current one', function () {
    $user = User::factory()->create();
    $user->createToken('Phone');
    $current = $user->createToken('Laptop');

    $response = $this->withToken($current->plainTextToken)
        ->getJson("/api/v1/users/{$user->id}/sessions")
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data' => [['id', 'device_name', 'is_current', 'last_used_at', 'expires_at', 'created_at']], 'links', 'meta']);

    $byDevice = collect($response->json('data'))->keyBy('device_name');

    expect($byDevice['Laptop']['is_current'])->toBeTrue()
        ->and($byDevice['Phone']['is_current'])->toBeFalse()
        ->and($response->getContent())->not->toContain($current->plainTextToken)->not->toContain('"token"');
});

it('lets an admin list another user\'s sessions without marking any as current', function () {
    $student = User::factory()->student()->create();
    $student->createToken('Student phone');
    $admin = User::factory()->admin()->create();
    $adminToken = $admin->createToken('Admin laptop')->plainTextToken;

    $this->withToken($adminToken)
        ->getJson("/api/v1/users/{$student->id}/sessions")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.device_name', 'Student phone')
        ->assertJsonPath('data.0.is_current', false);
});

it('only lists sessions of the requested user', function () {
    $user = User::factory()->create();
    $user->createToken('Mine');
    User::factory()->create()->createToken('Theirs');
    $token = $user->createToken('Current')->plainTextToken;

    $this->withToken($token)->getJson("/api/v1/users/{$user->id}/sessions")
        ->assertJsonCount(2, 'data');
});

it('hides expired sessions', function () {
    $user = User::factory()->create();
    $user->createToken('Old', ['*'], now()->subMinute());
    $token = $user->createToken('Active', ['*'], now()->addDay())->plainTextToken;

    $this->withToken($token)->getJson("/api/v1/users/{$user->id}/sessions")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.device_name', 'Active');
});

it('returns 404 when a non-admin asks for someone else\'s sessions', function (string $actor) {
    $this->{$actor}();
    $other = User::factory()->create();
    $other->createToken('Secret device');

    $this->getJson("/api/v1/users/{$other->id}/sessions")->assertNotFound()->assertJson(['code' => 'NOT_FOUND']);
})->with(['actingAsTeacher', 'actingAsStudent']);

it('returns 404 for missing and soft-deleted users', function () {
    $this->actingAsAdmin();
    $deleted = User::factory()->create();
    $deleted->delete();

    $this->getJson('/api/v1/users/999999/sessions')->assertNotFound();
    $this->getJson("/api/v1/users/{$deleted->id}/sessions")->assertNotFound();
});

it('paginates and caps per_page', function () {
    $user = User::factory()->create();
    foreach (range(1, 3) as $i) {
        $user->createToken("Device {$i}");
    }
    $token = $user->createToken('Current')->plainTextToken;

    $this->withToken($token)->getJson("/api/v1/users/{$user->id}/sessions?per_page=2")
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 4);

    $this->withToken($token)->getJson("/api/v1/users/{$user->id}/sessions?per_page=1000")
        ->assertJsonPath('meta.per_page', 100);
});
