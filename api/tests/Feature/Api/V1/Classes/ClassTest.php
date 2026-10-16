<?php

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function validClassPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Web Dev 2026',
        'description' => 'Morning class',
        'start_at' => '2026-11-01',
        'end_date' => '2027-03-01',
    ], $overrides);
}

function teachClass(SchoolClass $class, User $teacher, string $status = 'ACTIVE'): void
{
    DB::table('class_subjects')->insert([
        'class_id' => $class->id,
        'subject_id' => Subject::factory()->create()->id,
        'teacher_id' => $teacher->id,
        'status' => $status,
    ]);
}

function enrollInClass(SchoolClass $class, User $student, string $status = 'ACTIVE'): void
{
    DB::table('class_students')->insert([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => $status,
    ]);
}

describe('authentication', function () {
    it('returns 401 for guests on every classes endpoint', function (string $method, string $uri) {
        $this->json($method, $uri)->assertUnauthorized()->assertJson(['code' => 'UNAUTHENTICATED']);
    })->with([
        ['GET', '/api/v1/classes'],
        ['POST', '/api/v1/classes'],
        ['GET', '/api/v1/classes/1'],
        ['PATCH', '/api/v1/classes/1'],
        ['DELETE', '/api/v1/classes/1'],
    ]);
});

describe('GET /classes', function () {
    it('lets an admin list every class', function () {
        $this->actingAsAdmin();
        SchoolClass::factory()->count(2)->create();
        SchoolClass::factory()->inactive()->create();

        $this->getJson('/api/v1/classes')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'name', 'code', 'description', 'status', 'start_at', 'end_date', 'created_at', 'updated_at']],
                'links',
                'meta',
            ]);
    });

    it('br_cls_02_lists_only_classes_a_teacher_teaches', function () {
        $teacher = $this->actingAsTeacher();
        $mine = SchoolClass::factory()->create();
        $paused = SchoolClass::factory()->create();
        SchoolClass::factory()->create();
        teachClass($mine, $teacher);
        teachClass($paused, $teacher, 'INACTIVE');
        teachClass(SchoolClass::factory()->create(), User::factory()->teacher()->create());

        $this->getJson('/api/v1/classes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    });

    it('br_cls_02_lists_only_classes_a_student_is_enrolled_in', function () {
        $student = $this->actingAsStudent();
        $mine = SchoolClass::factory()->inactive()->create();
        $removed = SchoolClass::factory()->create();
        SchoolClass::factory()->create();
        enrollInClass($mine, $student);
        enrollInClass($removed, $student, 'DELETED');

        $this->getJson('/api/v1/classes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    });

    it('does not list deleted classes', function () {
        $this->actingAsAdmin();
        SchoolClass::factory()->create()->delete();

        $this->getJson('/api/v1/classes')->assertOk()->assertJsonCount(0, 'data');
    });

    it('filters by status, searches by name or code, and sorts', function () {
        $this->actingAsAdmin();
        SchoolClass::factory()->create(['name' => 'Alpha', 'code' => 'AAAAAA']);
        SchoolClass::factory()->create(['name' => 'Beta', 'code' => 'XYZ123']);
        SchoolClass::factory()->inactive()->create(['name' => 'Gamma']);

        $this->getJson('/api/v1/classes?status=INACTIVE')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/classes?search=lph')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Alpha');
        $this->getJson('/api/v1/classes?search=XYZ')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Beta');
        $this->getJson('/api/v1/classes?sort=-name')->assertJsonPath('data.0.name', 'Gamma');
    });

    it('rejects invalid query parameters', function () {
        $this->actingAsAdmin();

        $this->getJson('/api/v1/classes?sort=code&status=NOPE&per_page=1000')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort', 'status', 'per_page']);
    });
});

describe('POST /classes', function () {
    it('br_cls_03_creates_a_class_with_a_generated_code_and_audit_field', function () {
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/v1/classes', validClassPayload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Web Dev 2026')
            ->assertJsonPath('data.status', 'ACTIVE')
            ->assertJsonPath('data.start_at', '2026-11-01')
            ->assertJsonPath('data.end_date', '2027-03-01');

        expect($response->json('data.code'))->toMatch('/^[A-Z0-9]{6}$/');

        $this->assertDatabaseHas('classes', [
            'name' => 'Web Dev 2026',
            'code' => $response->json('data.code'),
            'created_by_user' => $admin->id,
        ]);
    });

    it('br_cls_03_ignores_a_client_supplied_code', function () {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/v1/classes', validClassPayload(['code' => 'HACKED']))->assertCreated();

        expect($response->json('data.code'))->not->toBe('HACKED');
    });

    it('br_cls_01_forbids_teachers_and_students', function (string $actor) {
        $this->{$actor}();

        $this->postJson('/api/v1/classes', validClassPayload())
            ->assertForbidden()
            ->assertJson(['code' => 'FORBIDDEN']);

        $this->assertDatabaseCount('classes', 0);
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('validates the payload', function (array $payload, string $field) {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/classes', validClassPayload($payload))
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);
    })->with([
        'missing name' => [['name' => null], 'name'],
        'name too long' => [['name' => str_repeat('a', 256)], 'name'],
        'bad start date' => [['start_at' => '01/11/2026'], 'start_at'],
        'missing end date' => [['end_date' => null], 'end_date'],
        'end before start' => [['end_date' => '2026-10-01'], 'end_date'],
        'invalid status' => [['status' => 'DELETED'], 'status'],
    ]);
});

describe('GET /classes/{class}', function () {
    it('shows any class to an admin', function () {
        $this->actingAsAdmin();
        $class = SchoolClass::factory()->inactive()->create();

        $this->getJson("/api/v1/classes/{$class->id}")->assertOk()->assertJsonPath('data.id', $class->id);
    });

    it('shows a class to its teacher and its students', function () {
        $class = SchoolClass::factory()->create();
        $teacher = User::factory()->teacher()->create();
        $student = User::factory()->student()->create();
        teachClass($class, $teacher);
        enrollInClass($class, $student);

        $this->actingAs($teacher, 'sanctum')->getJson("/api/v1/classes/{$class->id}")->assertOk();
        $this->actingAs($student, 'sanctum')->getJson("/api/v1/classes/{$class->id}")->assertOk();
    });

    it('br_cls_02_returns_404_to_users_outside_the_class', function (string $actor) {
        $this->{$actor}();
        $class = SchoolClass::factory()->create();

        $this->getJson("/api/v1/classes/{$class->id}")->assertNotFound();
    })->with(['actingAsTeacher', 'actingAsStudent']);

    it('returns 404 for a deleted class, even for an admin', function () {
        $this->actingAsAdmin();
        $class = SchoolClass::factory()->create();
        $class->delete();

        $this->getJson("/api/v1/classes/{$class->id}")->assertNotFound();
    });
});

describe('PATCH /classes/{class}', function () {
    it('lets an admin update a class and records the audit field', function () {
        $admin = $this->actingAsAdmin();
        $class = SchoolClass::factory()->create(['start_at' => '2026-11-01', 'end_date' => '2027-03-01']);
        $code = $class->code;

        $this->patchJson("/api/v1/classes/{$class->id}", [
            'name' => 'Renamed',
            'status' => 'INACTIVE',
            'end_date' => '2027-06-01',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed')
            ->assertJsonPath('data.status', 'INACTIVE')
            ->assertJsonPath('data.end_date', '2027-06-01');

        $this->assertDatabaseHas('classes', ['id' => $class->id, 'updated_by_user' => $admin->id, 'code' => $code]);
    });

    it('br_cls_03_never_changes_the_code', function () {
        $this->actingAsAdmin();
        $class = SchoolClass::factory()->create(['code' => 'ABC123']);

        $this->patchJson("/api/v1/classes/{$class->id}", ['name' => 'X', 'code' => 'ZZZZZZ'])->assertOk();

        $this->assertDatabaseHas('classes', ['id' => $class->id, 'code' => 'ABC123']);
    });

    it('checks a single date against the stored range', function () {
        $this->actingAsAdmin();
        $class = SchoolClass::factory()->create(['start_at' => '2026-11-01', 'end_date' => '2027-03-01']);

        $this->patchJson("/api/v1/classes/{$class->id}", ['end_date' => '2026-10-01'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('end_date');

        $this->patchJson("/api/v1/classes/{$class->id}", ['start_at' => '2027-04-01'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('start_at');
    });

    it('br_cls_01_forbids_members_and_hides_the_class_from_others', function () {
        $class = SchoolClass::factory()->create(['name' => 'Keep']);
        $teacher = User::factory()->teacher()->create();
        $student = User::factory()->student()->create();
        $outsider = User::factory()->teacher()->create();
        teachClass($class, $teacher);
        enrollInClass($class, $student);

        $this->actingAs($teacher, 'sanctum')->patchJson("/api/v1/classes/{$class->id}", ['name' => 'Hacked'])
            ->assertForbidden()->assertJson(['code' => 'FORBIDDEN']);
        $this->actingAs($student, 'sanctum')->patchJson("/api/v1/classes/{$class->id}", ['name' => 'Hacked'])
            ->assertForbidden();
        $this->actingAs($outsider, 'sanctum')->patchJson("/api/v1/classes/{$class->id}", ['name' => 'Hacked'])
            ->assertNotFound();

        $this->assertDatabaseHas('classes', ['id' => $class->id, 'name' => 'Keep']);
    });
});

describe('DELETE /classes/{class}', function () {
    it('br_cls_04_soft_deletes_only_the_class', function () {
        $admin = $this->actingAsAdmin();
        $class = SchoolClass::factory()->create();
        $student = User::factory()->student()->create();
        enrollInClass($class, $student);

        $this->deleteJson("/api/v1/classes/{$class->id}")->assertNoContent();

        $this->assertSoftDeleted('classes', ['id' => $class->id, 'deleted_by_user' => $admin->id]);
        $this->assertDatabaseHas('class_students', ['class_id' => $class->id, 'student_id' => $student->id, 'deleted_at' => null]);
    });

    it('br_cls_01_forbids_members_and_hides_the_class_from_others', function () {
        $class = SchoolClass::factory()->create();
        $teacher = User::factory()->teacher()->create();
        $outsider = User::factory()->student()->create();
        teachClass($class, $teacher);

        $this->actingAs($teacher, 'sanctum')->deleteJson("/api/v1/classes/{$class->id}")->assertForbidden();
        $this->actingAs($outsider, 'sanctum')->deleteJson("/api/v1/classes/{$class->id}")->assertNotFound();

        $this->assertNotSoftDeleted('classes', ['id' => $class->id]);
    });

    it('returns 404 for a class that does not exist', function () {
        $this->actingAsAdmin();

        $this->deleteJson('/api/v1/classes/999')->assertNotFound();
    });
});
