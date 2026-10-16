<?php

use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Http;

const GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';

function fakeGoogle(array $claims = [], int $status = 200): void
{
    Http::fake([
        'oauth2.googleapis.com/tokeninfo*' => Http::response(array_merge([
            'iss' => 'https://accounts.google.com',
            'aud' => GOOGLE_CLIENT_ID,
            'sub' => '1234567890',
            'email' => 'Student@Gmail.com',
            'email_verified' => 'true',
            'name' => 'Chan Sreyneang',
        ], $claims), $status),
    ]);
}

describe('POST /auth/google', function () {
    beforeEach(function () {
        config(['services.google.client_id' => GOOGLE_CLIENT_ID]);
        $this->seed(RoleSeeder::class);
    });

    it('creates a pending student without a token for a new Google account', function () {
        fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertCreated()
            ->assertJsonPath('data.email', 'student@gmail.com')
            ->assertJsonPath('data.role.name', 'student')
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonMissingPath('data.token');

        $user = User::where('email', 'student@gmail.com')->firstOrFail();

        expect($user->google_id)->toBe('1234567890')
            ->and($user->phone)->toBeNull()
            ->and($user->tokens()->count())->toBe(0);
    });

    it('signs in an active user and links the Google id', function () {
        fakeGoogle();
        $user = User::factory()->create(['email' => 'student@gmail.com']);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token', 'device_name' => 'Chrome'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonStructure(['data' => ['token']]);

        expect($user->fresh()->google_id)->toBe('1234567890');
    });

    it('refuses a pending account', function () {
        fakeGoogle();
        User::factory()->status(UserStatus::Pending)->create(['email' => 'student@gmail.com']);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertForbidden()
            ->assertJsonPath('code', 'ACCOUNT_PENDING');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    });

    it('refuses a non-active account', function (UserStatus $status) {
        fakeGoogle();
        User::factory()->status($status)->create(['email' => 'student@gmail.com']);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertForbidden()
            ->assertJsonPath('code', 'ACCOUNT_NOT_ACTIVE');
    })->with([UserStatus::Inactive, UserStatus::Suspended, UserStatus::Deleted]);

    it('refuses an email that is linked to a different Google account', function () {
        fakeGoogle();
        User::factory()->create(['email' => 'student@gmail.com', 'google_id' => 'someone-else']);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_GOOGLE_TOKEN');
    });

    it('rejects a token issued for another app, an unverified email or a bad token', function (array $claims, int $status) {
        fakeGoogle($claims, $status);

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_GOOGLE_TOKEN');

        $this->assertDatabaseMissing('users', ['email' => 'student@gmail.com']);
    })->with([
        'wrong audience' => [['aud' => 'other-app'], 200],
        'unverified email' => [['email_verified' => 'false'], 200],
        'wrong issuer' => [['iss' => 'https://evil.example'], 200],
        'rejected by Google' => [['error' => 'invalid_token'], 400],
    ]);

    it('rejects every token when no client id is configured', function () {
        config(['services.google.client_id' => null]);
        fakeGoogle();

        $this->postJson('/api/v1/auth/google', ['credential' => 'id-token'])->assertUnauthorized();
    });

    it('requires a credential', function () {
        $this->postJson('/api/v1/auth/google', [])->assertUnprocessable()->assertJsonValidationErrors('credential');
    });
});
