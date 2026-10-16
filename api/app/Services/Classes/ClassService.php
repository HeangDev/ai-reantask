<?php

namespace App\Services\Classes;

use App\Enums\ClassStatus;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClassService
{
    /**
     * @param  array{search?: string, status?: string, sort?: string, per_page?: int}  $filters
     */
    public function paginate(User $actor, array $filters): LengthAwarePaginator
    {
        // Visibility is applied first; filters only narrow it further.
        $query = SchoolClass::query()->visibleTo($actor);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $term = '%'.addcslashes($filters['search'], '\\%_').'%';

            $query->where(fn ($q) => $q
                ->where('name', 'like', $term)
                ->orWhere('code', 'like', $term));
        }

        $sort = $filters['sort'] ?? '-start_at';
        $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc')
            ->orderBy('id');

        return $query->paginate($filters['per_page'] ?? 15)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data  validated request data
     */
    public function create(User $actor, array $data): SchoolClass
    {
        $class = new SchoolClass(collect($data)->only(['name', 'description', 'start_at', 'end_date'])->all());

        // Server-owned fields are never mass-assigned.
        $class->code = $this->generateCode();
        $class->status = $data['status'] ?? ClassStatus::Active->value;
        $class->created_by_user = $actor->id;
        $class->save();

        return $class;
    }

    /**
     * The code never changes after creation (BR-CLS-03).
     *
     * @param  array<string, mixed>  $data  validated request data
     */
    public function update(User $actor, SchoolClass $class, array $data): SchoolClass
    {
        $class->fill(collect($data)->only(['name', 'description', 'start_at', 'end_date'])->all());

        if (isset($data['status'])) {
            $class->status = $data['status'];
        }

        if ($class->isDirty()) {
            $class->updated_by_user = $actor->id;
            $class->save();
        }

        return $class;
    }

    /**
     * Soft-deletes only the class; its subjects, students, and history are untouched (BR-CLS-04).
     */
    public function delete(User $actor, SchoolClass $class): void
    {
        DB::transaction(function () use ($actor, $class) {
            $class->deleted_by_user = $actor->id;
            $class->save();
            $class->delete();
        });
    }

    /**
     * Soft-deleted classes keep their code reserved, because the unique index includes them.
     */
    private function generateCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (SchoolClass::withTrashed()->where('code', $code)->exists());

        return $code;
    }
}
