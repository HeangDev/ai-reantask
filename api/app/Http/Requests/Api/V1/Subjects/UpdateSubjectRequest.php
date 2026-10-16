<?php

namespace App\Http\Requests\Api\V1\Subjects;

use App\Enums\SubjectStatus;
use App\Models\Subject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
{
    /**
     * Authorization runs before validation, so a user who cannot see the subject gets 404.
     */
    public function authorize(): bool
    {
        /** @var Subject $subject */
        $subject = $this->route('subject');

        Gate::authorize('update', $subject);

        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Subject $subject */
        $subject = $this->route('subject');

        return [
            'name' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('subjects', 'name')->whereNull('deleted_at')->ignore($subject),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:65535'],
            'status' => ['sometimes', 'string', Rule::enum(SubjectStatus::class)],
        ];
    }
}
