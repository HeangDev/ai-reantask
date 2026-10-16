<?php

namespace App\Services\Subjects;

use App\Enums\SubjectStatus;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SubjectService
{
    /**
     * @param  array{search?: string, status?: string, sort?: string, per_page?: int}  $filters
     */
    public function paginate(User $actor, array $filters): LengthAwarePaginator
    {
        // Visibility is applied first; filters only narrow it further.
        $query = Subject::query()->visibleTo($actor);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $term = '%'.addcslashes($filters['search'], '\\%_').'%';

            $query->where('name', 'like', $term);
        }

        $sort = $filters['sort'] ?? 'name';
        $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc')
            ->orderBy('id');

        return $query->paginate($filters['per_page'] ?? 15)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $data  validated request data
     */
    public function create(User $actor, array $data): Subject
    {
        $subject = new Subject(collect($data)->only(['name', 'description'])->all());

        // Server-owned fields are never mass-assigned.
        $subject->status = $data['status'] ?? SubjectStatus::Active->value;
        $subject->created_by_user = $actor->id;
        $subject->save();

        return $subject;
    }

    /**
     * @param  array<string, mixed>  $data  validated request data
     */
    public function update(User $actor, Subject $subject, array $data): Subject
    {
        $subject->fill(collect($data)->only(['name', 'description'])->all());

        if (isset($data['status'])) {
            $subject->status = $data['status'];
        }

        if ($subject->isDirty()) {
            $subject->updated_by_user = $actor->id;
            $subject->save();
        }

        return $subject;
    }

    /**
     * Soft-deletes only the subject; class_subjects and their history are untouched (BR-SBJ-04).
     */
    public function delete(User $actor, Subject $subject): void
    {
        DB::transaction(function () use ($actor, $subject) {
            $subject->deleted_by_user = $actor->id;
            $subject->save();
            $subject->delete();
        });
    }
}
