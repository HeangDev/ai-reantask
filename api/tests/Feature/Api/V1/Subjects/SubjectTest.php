<?php

use App\Enums\SubjectStatus;
use App\Models\Subject;

describe('authentication', function () {
    it('returns 401 for guests on every subjects endpoint', function (string $method, string $uri) {
        $this->json($method, $uri)->assertUnauthorized()->assertJson(['code' => 'UNAUTHENTICATED']);
    })->with([
        ['GET', '/api/v1/subjects'],
        ['POST', '/api/v1/subjects'],
        ['GET', '/api/v1/subjects/1'],
        ['PATCH', '/api/v1/subjects/1'],
        ['DELETE', '/api/v1/subjects/1'],
    ]);
});

describe('GET /subjects', function () {
    it('lets an admin list every subject', function () {
        $this->actingAsAdmin();
        Subject::factory()->count(2)->create();
        Subject::factory()->inactive()->create();

        $this->getJson('/api/v1/subjects')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'name', 'description', 'status', 'created_at', 'updated_at']],
                'links',
                'meta',
            ]);
    });

    it('br_sbj_02_lists_only_active_subjects_for_teachers_and_students', function (string $actor) {
        $this->{$actor}();
        Subject::factory()->count(2)->create();
        Subject::factory()->inactive()->create();
        Subject::factory()->create()->delete();

        $response = $this->getJson('/api/v1/subjects')->assertOk()->assertJsonCount(2, 'data');

        expect(collect($response->json('data'))->pluck('status')->unique()->all())->toBe(['ACTIVE']);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('filters by status, searches by name, and sorts', function () {
        $this->actingAsAdmin();
        Subject::factory()->create(['name' => 'Algebra']);
        Subject::factory()->create(['name' => 'Biology']);
        Subject::factory()->inactive()->create(['name' => 'Chemistry']);

        $this->getJson('/api/v1/subjects?status=INACTIVE')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/subjects?search=gebra')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Algebra');
        $this->getJson('/api/v1/subjects?sort=-name')->assertJsonPath('data.0.name', 'Chemistry');
    });

    it('rejects invalid query parameters', function () {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/subjects?sort=password&status=NOPE&per_page=1000')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort', 'status', 'per_page']);
    });
});

describe('POST /subjects', function () {
    it('lets an admin create a subject and records the audit field', function () {
        $admin = $this->actingAsAdmin();

        $this->postJson('/api/v1/subjects', ['name' => 'Mathematics', 'description' => 'Numbers'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Mathematics')
            ->assertJsonPath('data.status', 'ACTIVE');

        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics',
            'status' => 'ACTIVE',
            'created_by_user' => $admin->id,
        ]);
    });

    it('br_sbj_01_forbids_teachers_and_students', function (string $actor) {
        $this->{$actor}();

        $this->postJson('/api/v1/subjects', ['name' => 'Mathematics'])
            ->assertForbidden()
            ->assertJson(['code' => 'FORBIDDEN']);

        $this->assertDatabaseCount('subjects', 0);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('validates the payload', function (array $payload, string $field) {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/subjects', $payload)->assertUnprocessable()->assertJsonValidationErrors($field);
    })->with([
        'missing name' => [[], 'name'],
        'name too long' => [['name' => str_repeat('a', 256)], 'name'],
        'invalid status' => [['name' => 'Math', 'status' => 'DELETED'], 'status'],
    ]);

    it('br_sbj_03_rejects_a_duplicate_name', function () {
        $this->actingAsAdmin();
        Subject::factory()->create(['name' => 'Mathematics']);

        $this->postJson('/api/v1/subjects', ['name' => 'Mathematics'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    });

    it('br_sbj_03_allows_reusing_the_name_of_a_deleted_subject', function () {
        $this->actingAsAdmin();
        Subject::factory()->create(['name' => 'Mathematics'])->delete();

        $this->postJson('/api/v1/subjects', ['name' => 'Mathematics'])->assertCreated();
    });

    it('ignores server-owned fields', function () {
        $admin = $this->actingAsAdmin();

        $this->postJson('/api/v1/subjects', ['name' => 'Physics', 'created_by_user' => 999, 'id' => 999])
            ->assertCreated();

        $this->assertDatabaseHas('subjects', ['name' => 'Physics', 'created_by_user' => $admin->id]);
        $this->assertDatabaseMissing('subjects', ['id' => 999]);
    });
});

describe('GET /subjects/{subject}', function () {
    it('shows an active subject to every role', function (string $actor) {
        $this->{$actor}();
        $subject = Subject::factory()->create();

        $this->getJson("/api/v1/subjects/{$subject->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $subject->id);
    })->with(['actingAsAdmin', 'actingAsTeacher', 'actingAsStudent']);

    it('br_sbj_02_hides_an_inactive_subject_from_non_admins', function (string $actor) {
        $this->{$actor}();
        $subject = Subject::factory()->inactive()->create();

        $this->getJson("/api/v1/subjects/{$subject->id}")->assertNotFound();
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('shows an inactive subject to an admin', function () {
        $this->actingAsAdmin();
        $subject = Subject::factory()->inactive()->create();

        $this->getJson("/api/v1/subjects/{$subject->id}")->assertOk()->assertJsonPath('data.status', 'INACTIVE');
    });

    it('returns 404 for a deleted subject, even for an admin', function () {
        $this->actingAsAdmin();
        $subject = Subject::factory()->create();
        $subject->delete();

        $this->getJson("/api/v1/subjects/{$subject->id}")->assertNotFound();
    });
});

describe('PATCH /subjects/{subject}', function () {
    it('lets an admin update a subject and records the audit field', function () {
        $admin = $this->actingAsAdmin();
        $subject = Subject::factory()->create(['name' => 'Old']);

        $this->patchJson("/api/v1/subjects/{$subject->id}", ['name' => 'New', 'status' => 'INACTIVE'])
            ->assertOk()
            ->assertJsonPath('data.name', 'New')
            ->assertJsonPath('data.status', 'INACTIVE');

        $this->assertDatabaseHas('subjects', [
            'id' => $subject->id,
            'name' => 'New',
            'status' => 'INACTIVE',
            'updated_by_user' => $admin->id,
        ]);
    });

    it('allows keeping the same name', function () {
        $this->actingAsAdmin();
        $subject = Subject::factory()->create(['name' => 'Same']);

        $this->patchJson("/api/v1/subjects/{$subject->id}", ['name' => 'Same', 'description' => 'Changed'])
            ->assertOk();
    });

    it('br_sbj_01_forbids_non_admins_who_can_see_the_subject', function (string $actor) {
        $this->{$actor}();
        $subject = Subject::factory()->create(['name' => 'Keep']);

        $this->patchJson("/api/v1/subjects/{$subject->id}", ['name' => 'Hacked'])
            ->assertForbidden()
            ->assertJson(['code' => 'FORBIDDEN']);

        $this->assertDatabaseHas('subjects', ['id' => $subject->id, 'name' => 'Keep']);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 to non-admins for an inactive subject', function () {
        $this->actingAsTeacher();
        $subject = Subject::factory()->inactive()->create();

        $this->patchJson("/api/v1/subjects/{$subject->id}", ['name' => 'X'])->assertNotFound();
    });

    it('rejects a name used by another subject and an invalid status', function () {
        $this->actingAsAdmin();
        Subject::factory()->create(['name' => 'Taken']);
        $subject = Subject::factory()->create();

        $this->patchJson("/api/v1/subjects/{$subject->id}", ['name' => 'Taken', 'status' => 'DELETED'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'status']);
    });
});

describe('DELETE /subjects/{subject}', function () {
    it('br_sbj_04_soft_deletes_the_subject_and_records_who_deleted_it', function () {
        $admin = $this->actingAsAdmin();
        $subject = Subject::factory()->create();

        $this->deleteJson("/api/v1/subjects/{$subject->id}")->assertNoContent();

        $this->assertSoftDeleted('subjects', ['id' => $subject->id, 'deleted_by_user' => $admin->id]);
    });

    it('br_sbj_01_forbids_non_admins', function (string $actor) {
        $this->{$actor}();
        $subject = Subject::factory()->create();

        $this->deleteJson("/api/v1/subjects/{$subject->id}")->assertForbidden();

        $this->assertNotSoftDeleted('subjects', ['id' => $subject->id]);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 to non-admins for an inactive subject', function () {
        $this->actingAsStudent();
        $subject = Subject::factory()->create(['status' => SubjectStatus::Inactive]);

        $this->deleteJson("/api/v1/subjects/{$subject->id}")->assertNotFound();
    });

    it('returns 404 for a subject that does not exist', function () {
        $this->actingAsAdmin();

        $this->deleteJson('/api/v1/subjects/999')->assertNotFound();
    });
});
