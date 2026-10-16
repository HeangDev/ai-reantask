<?php

namespace App\Http\Requests\Api\V1\Subjects;

use App\Enums\SubjectStatus;
use App\Models\Subject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreSubjectRequest extends FormRequest
{
    /**
     * Authorization runs before validation so non-admins get 403 instead of validation errors.
     */
    public function authorize(): bool
    {
        Gate::authorize('create', Subject::class);

        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // BR-SBJ-03: names are unique among subjects that are not deleted.
            'name' => ['required', 'string', 'max:255', Rule::unique('subjects', 'name')->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:65535'],
            'status' => ['sometimes', 'string', Rule::enum(SubjectStatus::class)],
        ];
    }
}
