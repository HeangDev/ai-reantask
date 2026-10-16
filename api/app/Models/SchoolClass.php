<?php

namespace App\Models;

use App\Enums\ClassStatus;
use Database\Factories\SchoolClassFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

/**
 * A class of students (table `classes`). `Class` is a reserved word in PHP, hence the name.
 */
class SchoolClass extends Model
{
    /** @use HasFactory<SchoolClassFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    /**
     * `code`, `status`, and the audit fields are server-owned and assigned by the service.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'start_at',
        'end_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ClassStatus::class,
            'start_at' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Admins see every class. A teacher sees the classes where they teach a subject, and a
     * student sees the classes they are enrolled in; both only through ACTIVE links (BR-CLS-02).
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isTeacher()) {
            return $query->whereIn('classes.id', $this->activeLinks('class_subjects', 'teacher_id', $user));
        }

        if ($user->isStudent()) {
            return $query->whereIn('classes.id', $this->activeLinks('class_students', 'student_id', $user));
        }

        return $query->whereRaw('0 = 1');
    }

    private function activeLinks(string $table, string $column, User $user): \Illuminate\Database\Query\Builder
    {
        return DB::table($table)
            ->select('class_id')
            ->where($column, $user->getKey())
            ->where('status', 'ACTIVE')
            ->whereNull('deleted_at');
    }
}
