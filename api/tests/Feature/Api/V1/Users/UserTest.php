<?php

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;

function validUserPayload(array $overrides = []): array
{
    $role = Role::firstOrCreate(['name' => 'teacher']);

    return array_merge([
        'fullname' => 'Sok Dara',
        'username' => 'sok_dara',
        'email' => 'teacher@example.com',
        'phone' => '+855 12 345 678',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role_id' => $role->id,
    ], $overrides);
}

describe('authentication', function () {
    it('returns 401 for guests on every users endpoint', function (string $method, string $uri) {
        $this->json($method, $uri)->assertUnauthorized()->assertJson(['code' => 'UNAUTHENTICATED']);
    })->with([
        ['GET', '/api/v1/roles'],
        ['GET', '/api/v1/users'],
        ['POST', '/api/v1/users'],
        ['GET', '/api/v1/users/1'],
        ['PATCH', '/api/v1/users/1'],
        ['DELETE', '/api/v1/users/1'],
    ]);
});

describe('GET /roles', function () {
    it('lets an admin list roles', function () {
        $this->actingAsAdmin();
        Role::firstOrCreate(['name' => 'teacher']);

        $this->getJson('/api/v1/roles')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'status']], 'links', 'meta'])
            ->assertJsonFragment(['name' => 'admin'])
            ->assertJsonFragment(['name' => 'teacher']);
    });

    it('forbids teachers and students', function (string $actor) {
        $this->{$actor}();

        $this->getJson('/api/v1/roles')->assertForbidden()->assertJson(['code' => 'FORBIDDEN']);
    })->with(['actingAsTeacher', 'actingAsStudent']);
});

describe('GET /users', function () {
    it('lets an admin list users without sensitive fields', function () {
        $this->actingAsAdmin();
        User::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'fullname', 'username', 'email', 'phone', 'avatar', 'status', 'role' => ['id', 'name'], 'created_at', 'updated_at']],
                'links',
                'meta' => ['current_page', 'per_page', 'total'],
            ]);

        expect($response->getContent())
            ->not->toContain('password')
            ->not->toContain('remember_token');
    });

    it('forbids teachers and students', function (string $actor) {
        $this->{$actor}();

        $this->getJson('/api/v1/users')->assertForbidden();
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('filters by role, status and search', function () {
        $this->actingAsAdmin();
        User::factory()->student()->create(['fullname' => 'Chan Sreyneang']);
        User::factory()->student()->status(UserStatus::Suspended)->create(['fullname' => 'Other Student']);
        User::factory()->teacher()->create(['fullname' => 'Sreyneang Teacher']);

        $this->getJson('/api/v1/users?role=student&search=sreyneang')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fullname', 'Chan Sreyneang');

        $this->getJson('/api/v1/users?status=SUSPENDED')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fullname', 'Other Student');
    });

    it('treats search wildcards literally', function () {
        $this->actingAsAdmin();
        User::factory()->create(['fullname' => 'Plain Name']);

        $this->getJson('/api/v1/users?search=%25')->assertOk()->assertJsonCount(0, 'data');
    });

    it('paginates and sorts', function () {
        $this->actingAsAdmin();
        User::factory()->count(5)->create();

        $this->getJson('/api/v1/users?per_page=2&sort=email')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 6);
    });

    it('rejects unknown sort fields and oversized pages', function () {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/users?sort=password')->assertUnprocessable()->assertJsonValidationErrors(['sort']);
        $this->getJson('/api/v1/users?per_page=101')->assertUnprocessable()->assertJsonValidationErrors(['per_page']);
    });

    it('excludes soft-deleted users', function () {
        $this->actingAsAdmin();
        User::factory()->create()->delete();

        $this->getJson('/api/v1/users')->assertOk()->assertJsonCount(1, 'data');
    });
});

describe('POST /users', function () {
    it('br_usr_03: lets an admin create a teacher', function () {
        $admin = $this->actingAsAdmin();

        $this->postJson('/api/v1/users', validUserPayload())
            ->assertCreated()
            ->assertJsonPath('data.fullname', 'Sok Dara')
            ->assertJsonPath('data.email', 'teacher@example.com')
            ->assertJsonPath('data.role.name', 'teacher')
            ->assertJsonPath('data.status', 'ACTIVE')
            ->assertJsonMissingPath('data.password');

        $user = User::where('email', 'teacher@example.com')->firstOrFail();

        expect($user->created_by_user)->toBe($admin->id)
            ->and($user->password)->not->toBe('password123');
    });

    it('lets an admin create an admin with a chosen status', function () {
        $this->actingAsAdmin();
        $adminRole = Role::where('name', 'admin')->first();

        $this->postJson('/api/v1/users', validUserPayload(['role_id' => $adminRole->id, 'status' => 'INACTIVE']))
            ->assertCreated()
            ->assertJsonPath('data.role.name', 'admin')
            ->assertJsonPath('data.status', 'INACTIVE');
    });

    it('forbids teachers and students, even before validating the body', function (string $actor) {
        $this->{$actor}();

        // An empty body must give 403, not 422, so non-admins cannot probe for taken emails.
        $this->postJson('/api/v1/users', [])->assertForbidden();
        $this->postJson('/api/v1/users', validUserPayload())->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'teacher@example.com']);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('validates required fields', function () {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/users', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fullname', 'username', 'email', 'phone', 'password', 'role_id']);
    });

    it('br_usr_05: rejects duplicate emails, including soft-deleted users', function () {
        $this->actingAsAdmin();
        User::factory()->create(['email' => 'teacher@example.com'])->delete();

        $this->postJson('/api/v1/users', validUserPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });

    it('rejects duplicate usernames and phones', function () {
        $this->actingAsAdmin();
        User::factory()->create(['username' => 'sok_dara', 'phone' => '+855 12 345 678']);

        $this->postJson('/api/v1/users', validUserPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username', 'phone']);
    });

    it('rejects weak passwords, bad usernames and unknown or inactive roles', function () {
        $this->actingAsAdmin();
        $inactive = Role::factory()->inactive()->create();

        $this->postJson('/api/v1/users', validUserPayload(['password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()->assertJsonValidationErrors(['password']);
        $this->postJson('/api/v1/users', validUserPayload(['username' => 'has space']))
            ->assertUnprocessable()->assertJsonValidationErrors(['username']);
        $this->postJson('/api/v1/users', validUserPayload(['role_id' => 9999]))
            ->assertUnprocessable()->assertJsonValidationErrors(['role_id']);
        $this->postJson('/api/v1/users', validUserPayload(['role_id' => $inactive->id]))
            ->assertUnprocessable()->assertJsonValidationErrors(['role_id']);
        $this->postJson('/api/v1/users', validUserPayload(['status' => 'DELETED']))
            ->assertUnprocessable()->assertJsonValidationErrors(['status']);
    });

    it('ignores server-owned fields sent by the client', function () {
        $admin = $this->actingAsAdmin();
        $other = User::factory()->create();

        $this->postJson('/api/v1/users', validUserPayload([
            'created_by_user' => $other->id,
            'deleted_by_user' => $other->id,
            'email_verified_at' => now()->toIso8601String(),
        ]))->assertCreated();

        $user = User::where('email', 'teacher@example.com')->firstOrFail();

        expect($user->created_by_user)->toBe($admin->id)
            ->and($user->deleted_by_user)->toBeNull()
            ->and($user->email_verified_at)->toBeNull();
    });

    it('stores the email trimmed and lowercased', function () {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/users', validUserPayload(['email' => '  Teacher@Example.COM ']))
            ->assertCreated()
            ->assertJsonPath('data.email', 'teacher@example.com');
    });
});

describe('GET /users/{user}', function () {
    it('lets an admin view any user', function () {
        $this->actingAsAdmin();
        $student = User::factory()->student()->create();

        $this->getJson("/api/v1/users/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $student->id)
            ->assertJsonPath('data.role.name', 'student');
    });

    it('lets users view themselves', function (string $actor) {
        $user = $this->{$actor}();

        $this->getJson("/api/v1/users/{$user->id}")->assertOk()->assertJsonPath('data.id', $user->id);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 when a user views someone else', function (string $actor) {
        $this->{$actor}();
        $other = User::factory()->create();

        $this->getJson("/api/v1/users/{$other->id}")->assertNotFound()->assertJson(['code' => 'NOT_FOUND']);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 for missing and soft-deleted users', function () {
        $this->actingAsAdmin();
        $deleted = User::factory()->create();
        $deleted->delete();

        $this->getJson('/api/v1/users/999999')->assertNotFound();
        $this->getJson("/api/v1/users/{$deleted->id}")->assertNotFound();
    });
});

describe('PATCH /users/{user}', function () {
    it('lets users update their own profile fields', function (string $actor) {
        $user = $this->{$actor}();

        $this->patchJson("/api/v1/users/{$user->id}", [
            'fullname' => 'New Name',
            'username' => 'new_name',
            'phone' => '+855 99 111 222',
        ])
            ->assertOk()
            ->assertJsonPath('data.fullname', 'New Name')
            ->assertJsonPath('data.username', 'new_name');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'fullname' => 'New Name',
            'phone' => '+855 99 111 222',
            'updated_by_user' => $user->id,
        ]);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('does not let a user change their own role', function () {
        $student = $this->actingAsStudent();
        $teacherRole = Role::firstOrCreate(['name' => 'teacher']);

        $this->patchJson("/api/v1/users/{$student->id}", ['role_id' => $teacherRole->id])
            ->assertForbidden();

        expect($student->fresh()->isStudent())->toBeTrue();
    });

    it('does not let a user change their own status', function () {
        $student = $this->actingAsStudent();

        $this->patchJson("/api/v1/users/{$student->id}", ['status' => 'SUSPENDED'])->assertForbidden();

        expect($student->fresh()->status)->toBe(UserStatus::Active);
    });

    it('ignores email changes from non-admins', function () {
        $student = $this->actingAsStudent();
        $original = $student->email;

        $this->patchJson("/api/v1/users/{$student->id}", ['email' => 'new@example.com', 'fullname' => 'Kept'])
            ->assertOk();

        expect($student->fresh()->email)->toBe($original)
            ->and($student->fresh()->fullname)->toBe('Kept');
    });

    it('ignores password changes (use PUT /auth/password)', function () {
        $student = $this->actingAsStudent();
        $hash = $student->password;

        $this->patchJson("/api/v1/users/{$student->id}", ['password' => 'new-password-1', 'fullname' => 'X'])->assertOk();

        expect($student->fresh()->password)->toBe($hash);
    });

    it('returns 404 when updating someone else, without validating first', function () {
        $this->actingAsStudent();
        $other = User::factory()->create();

        $this->patchJson("/api/v1/users/{$other->id}", ['fullname' => 'Hacked'])->assertNotFound();
        // An invalid body must not turn into a 422 that reveals the user exists.
        $this->patchJson("/api/v1/users/{$other->id}", ['username' => 'x y'])->assertNotFound();

        expect($other->fresh()->fullname)->not->toBe('Hacked');
    });

    it('br_usr_03: lets an admin change another user role and revokes their tokens', function () {
        $this->actingAsAdmin();
        $student = User::factory()->student()->create();
        $student->createToken('device');
        $teacherRole = Role::firstOrCreate(['name' => 'teacher']);

        $this->patchJson("/api/v1/users/{$student->id}", ['role_id' => $teacherRole->id])
            ->assertOk()
            ->assertJsonPath('data.role.name', 'teacher');

        expect($student->fresh()->isTeacher())->toBeTrue()
            ->and($student->tokens()->count())->toBe(0);
    });

    it('does not revoke tokens when the role is unchanged', function () {
        $this->actingAsAdmin();
        $student = User::factory()->student()->create();
        $student->createToken('device');

        $this->patchJson("/api/v1/users/{$student->id}", ['role_id' => $student->role_id, 'fullname' => 'Same Role'])
            ->assertOk();

        expect($student->tokens()->count())->toBe(1);
    });

    it('br_usr_04: forbids an admin from changing their own role or status', function () {
        $admin = $this->actingAsAdmin();
        $studentRole = Role::firstOrCreate(['name' => 'student']);

        $this->patchJson("/api/v1/users/{$admin->id}", ['role_id' => $studentRole->id])->assertForbidden();
        $this->patchJson("/api/v1/users/{$admin->id}", ['status' => 'SUSPENDED'])->assertForbidden();

        expect($admin->fresh()->isAdmin())->toBeTrue();
    });

    it('lets an admin update email and status of another user', function () {
        $admin = $this->actingAsAdmin();
        $student = User::factory()->student()->create();

        $this->patchJson("/api/v1/users/{$student->id}", ['email' => 'Changed@Example.com', 'status' => 'SUSPENDED'])
            ->assertOk()
            ->assertJsonPath('data.email', 'changed@example.com')
            ->assertJsonPath('data.status', 'SUSPENDED');

        expect($student->fresh()->updated_by_user)->toBe($admin->id);
    });

    it('validates unique fields but allows keeping your own values', function () {
        $student = $this->actingAsStudent();
        $other = User::factory()->create();

        $this->patchJson("/api/v1/users/{$student->id}", ['username' => $student->username])->assertOk();
        $this->patchJson("/api/v1/users/{$student->id}", ['username' => $other->username])
            ->assertUnprocessable()->assertJsonValidationErrors(['username']);
        $this->patchJson("/api/v1/users/{$student->id}", ['phone' => $other->phone])
            ->assertUnprocessable()->assertJsonValidationErrors(['phone']);
    });

    it('rejects blank required fields', function () {
        $student = $this->actingAsStudent();

        $this->patchJson("/api/v1/users/{$student->id}", ['fullname' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors(['fullname']);
    });
});

describe('DELETE /users/{user}', function () {
    it('br_usr_06: soft-deletes a user and revokes their tokens', function () {
        $admin = $this->actingAsAdmin();
        $student = User::factory()->student()->create();
        $student->createToken('device');

        $this->deleteJson("/api/v1/users/{$student->id}")->assertNoContent();

        $this->assertSoftDeleted('users', ['id' => $student->id, 'deleted_by_user' => $admin->id]);
        expect($student->tokens()->count())->toBe(0);
    });

    it('br_usr_04: forbids an admin from deleting their own account', function () {
        $admin = $this->actingAsAdmin();

        $this->deleteJson("/api/v1/users/{$admin->id}")->assertForbidden();

        $this->assertNotSoftDeleted('users', ['id' => $admin->id]);
    });

    it('forbids non-admins deleting themselves and hides other users', function (string $actor) {
        $user = $this->{$actor}();
        $other = User::factory()->create();

        $this->deleteJson("/api/v1/users/{$user->id}")->assertForbidden();
        $this->deleteJson("/api/v1/users/{$other->id}")->assertNotFound();

        $this->assertNotSoftDeleted('users', ['id' => $user->id]);
        $this->assertNotSoftDeleted('users', ['id' => $other->id]);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 for an already deleted user', function () {
        $this->actingAsAdmin();
        $user = User::factory()->create();
        $user->delete();

        $this->deleteJson("/api/v1/users/{$user->id}")->assertNotFound();
    });
});
