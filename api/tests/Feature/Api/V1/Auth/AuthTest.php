<?php

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

function registerPayload(array $overrides = []): array
{
    return array_merge([
        'fullname' => 'Chan Sreyneang',
        'username' => 'sreyneang',
        'email' => 'student@example.com',
        'phone' => '+855 12 000 111',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ], $overrides);
}

describe('POST /auth/register', function () {
    // Idempotent: the seeder uses firstOrCreate, like the factories.
    beforeEach(fn () => $this->seed(RoleSeeder::class));

    it('br_usr_02: registers a student and returns a token', function () {
        $this->postJson('/api/v1/auth/register', registerPayload())
            ->assertCreated()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.role.name', 'student')
            ->assertJsonPath('data.user.email', 'student@example.com')
            ->assertJsonStructure(['data' => ['token', 'expires_at', 'user' => ['id', 'fullname', 'username']]])
            ->assertJsonMissingPath('data.user.password');

        $user = User::where('email', 'student@example.com')->firstOrFail();

        expect($user->isStudent())->toBeTrue()
            ->and($user->status)->toBe(UserStatus::Active)
            ->and(Hash::check('password123', $user->password))->toBeTrue()
            ->and($user->tokens()->count())->toBe(1);
    });

    it('br_usr_02: ignores role and server-owned fields', function () {
        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $this->postJson('/api/v1/auth/register', registerPayload([
            'role_id' => $adminRole->id,
            'role' => 'admin',
            'status' => 'SUSPENDED',
            'created_by_user' => 1,
        ]))->assertCreated()->assertJsonPath('data.user.role.name', 'student');

        $user = User::where('email', 'student@example.com')->firstOrFail();

        expect($user->isStudent())->toBeTrue()
            ->and($user->status)->toBe(UserStatus::Active)
            ->and($user->created_by_user)->toBeNull();
    });

    it('validates required fields, passwords and uniqueness', function () {
        User::factory()->create(['email' => 'student@example.com', 'username' => 'sreyneang', 'phone' => '+855 12 000 111']);

        $this->postJson('/api/v1/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fullname', 'username', 'email', 'phone', 'password']);

        $this->postJson('/api/v1/auth/register', registerPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'username', 'phone']);

        $this->postJson('/api/v1/auth/register', registerPayload(['email' => 'new@example.com', 'username' => 'new', 'phone' => '+855 1 2345 67', 'password_confirmation' => 'different']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->postJson('/api/v1/auth/register', registerPayload(['email' => 'new@example.com', 'username' => 'new', 'phone' => '+855 1 2345 67', 'password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    });

    it('br_usr_05: rejects the email of a soft-deleted user', function () {
        User::factory()->create(['email' => 'student@example.com'])->delete();

        $this->postJson('/api/v1/auth/register', registerPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });

    it('rate limits registration', function () {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/register', []);
        }

        $this->postJson('/api/v1/auth/register', [])
            ->assertTooManyRequests()
            ->assertJson(['code' => 'RATE_LIMITED'])
            ->assertHeader('Retry-After');
    });
});

describe('POST /auth/login', function () {
    it('logs in with valid credentials', function () {
        $user = User::factory()->teacher()->create(['email' => 'teacher@example.com', 'password' => 'secret-password']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'Teacher@Example.com',
            'password' => 'secret-password',
            'device_name' => 'Chrome on Windows',
        ])
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role.name', 'teacher')
            ->assertJsonStructure(['data' => ['token', 'expires_at']])
            ->assertJsonMissingPath('data.user.password');

        expect($user->tokens()->first()->name)->toBe('Chrome on Windows');
    });

    it('returns the same error for a wrong password and an unknown email', function () {
        User::factory()->create(['email' => 'student@example.com', 'password' => 'correct-password']);

        $wrongPassword = $this->postJson('/api/v1/auth/login', ['email' => 'student@example.com', 'password' => 'wrong-password']);
        $unknownEmail = $this->postJson('/api/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'wrong-password']);

        $wrongPassword->assertUnauthorized()->assertJson(['code' => 'INVALID_CREDENTIALS']);
        $unknownEmail->assertUnauthorized();

        expect($unknownEmail->json())->toBe($wrongPassword->json());
    });

    it('br_usr_06: does not let a soft-deleted user log in', function () {
        $user = User::factory()->create(['email' => 'student@example.com', 'password' => 'correct-password']);
        $user->delete();

        $this->postJson('/api/v1/auth/login', ['email' => 'student@example.com', 'password' => 'correct-password'])
            ->assertUnauthorized()
            ->assertJson(['code' => 'INVALID_CREDENTIALS']);
    });

    it('validates input', function () {
        $this->postJson('/api/v1/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    });

    it('rate limits failed attempts', function () {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'x'])->assertUnauthorized();
        }

        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'x'])
            ->assertTooManyRequests()
            ->assertJson(['code' => 'RATE_LIMITED']);
    });

    it('stores only a hash of the token and works as a bearer token', function () {
        User::factory()->create(['email' => 'student@example.com', 'password' => 'correct-password']);

        $token = $this->postJson('/api/v1/auth/login', ['email' => 'student@example.com', 'password' => 'correct-password'])
            ->json('data.token');

        $this->assertDatabaseMissing('personal_access_tokens', ['token' => $token]);

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();
    });
});

describe('GET /auth/me', function () {
    it('returns 401 without a token', function () {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized()->assertJson(['code' => 'UNAUTHENTICATED']);
    });

    it('returns the current user without sensitive fields', function () {
        $user = $this->actingAsTeacher();

        $response = $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role.name', 'teacher');

        expect($response->getContent())->not->toContain('password')->not->toContain('remember_token');
    });

    it('returns 401 for an expired token', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test', ['*'], now()->subMinute())->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    });

    it('returns 401 once the user is soft-deleted', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $user->delete();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    });
});

describe('logout', function () {
    it('returns 401 without a token', function () {
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
        $this->postJson('/api/v1/auth/logout-all')->assertUnauthorized();
    });

    it('revokes only the current token', function () {
        $user = User::factory()->create();
        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('other');

        $this->withToken($current)->postJson('/api/v1/auth/logout')->assertNoContent();

        expect($user->tokens()->count())->toBe(1)
            ->and($user->tokens()->first()->name)->toBe('other');
    });

    it('revokes all tokens with logout-all', function () {
        $user = User::factory()->create();
        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('other');

        $this->withToken($current)->postJson('/api/v1/auth/logout-all')->assertNoContent();

        expect($user->tokens()->count())->toBe(0);
    });
});

describe('PUT /auth/password', function () {
    it('returns 401 without a token', function () {
        $this->putJson('/api/v1/auth/password', [])->assertUnauthorized();
    });

    it('rejects a wrong current password and a weak new one', function () {
        $user = User::factory()->create(['password' => 'old-password-1']);
        $token = $user->createToken('current')->plainTextToken;

        $this->withToken($token)->putJson('/api/v1/auth/password', [
            'current_password' => 'wrong',
            'password' => 'new-password-1',
            'password_confirmation' => 'new-password-1',
        ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);

        $this->withToken($token)->putJson('/api/v1/auth/password', [
            'current_password' => 'old-password-1',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        expect(Hash::check('old-password-1', $user->fresh()->password))->toBeTrue();
    });

    it('changes the password and revokes all other tokens', function () {
        $user = User::factory()->create(['password' => 'old-password-1']);
        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('other-1');
        $user->createToken('other-2');

        $this->withToken($current)->putJson('/api/v1/auth/password', [
            'current_password' => 'old-password-1',
            'password' => 'new-password-1',
            'password_confirmation' => 'new-password-1',
        ])->assertNoContent();

        expect(Hash::check('new-password-1', $user->fresh()->password))->toBeTrue()
            ->and($user->tokens()->count())->toBe(1);

        $this->withToken($current)->getJson('/api/v1/auth/me')->assertOk();
    });
});

describe('forgot and reset password', function () {
    it('sends a reset link pointing at the frontend', function () {
        Notification::fake();
        config(['app.frontend_url' => 'https://app.example.test']);
        $user = User::factory()->create(['email' => 'student@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'Student@Example.com'])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            return str_starts_with($notification->toMail($user)->actionUrl, 'https://app.example.test/reset-password?token=');
        });
    });

    it('answers identically for unknown, soft-deleted and known emails', function () {
        Notification::fake();
        User::factory()->create(['email' => 'known@example.com']);
        User::factory()->create(['email' => 'gone@example.com'])->delete();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'known@example.com']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com']);
        $gone = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'gone@example.com']);

        $known->assertOk();
        expect($unknown->status())->toBe(200)
            ->and($unknown->json())->toBe($known->json())
            ->and($gone->json())->toBe($known->json());

        Notification::assertSentToTimes(User::where('email', 'known@example.com')->first(), ResetPassword::class, 1);
        Notification::assertCount(1);
    });

    it('resets the password and revokes all tokens', function () {
        $user = User::factory()->create(['email' => 'student@example.com', 'password' => 'old-password-1']);
        $user->createToken('device');
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'student@example.com',
            'password' => 'new-password-1',
            'password_confirmation' => 'new-password-1',
        ])->assertOk();

        expect(Hash::check('new-password-1', $user->fresh()->password))->toBeTrue()
            ->and($user->tokens()->count())->toBe(0);
    });

    it('rejects an invalid reset token', function () {
        $user = User::factory()->create(['email' => 'student@example.com', 'password' => 'old-password-1']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'student@example.com',
            'password' => 'new-password-1',
            'password_confirmation' => 'new-password-1',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);

        expect(Hash::check('old-password-1', $user->fresh()->password))->toBeTrue();
    });

    it('validates the reset payload', function () {
        $this->postJson('/api/v1/auth/reset-password', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token', 'email', 'password']);

        $this->postJson('/api/v1/auth/forgot-password', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });
});

describe('error format', function () {
    it('returns JSON 404 and 405 with codes and no internals', function () {
        $this->getJson('/api/v1/does-not-exist')->assertNotFound()->assertJson(['code' => 'NOT_FOUND']);

        $this->actingAsAdmin();
        $this->putJson('/api/v1/users/1')->assertStatus(405)->assertJson(['code' => 'METHOD_NOT_ALLOWED']);
    });
});
