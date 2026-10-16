<?php

namespace App\Http\Requests\Api\V1\Subjects;

use App\Enums\SubjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexSubjectsRequest extends FormRequest
{
    public const SORT_FIELDS = ['created_at', 'name'];

    public function authorize(): bool
    {
        // Access is enforced by SubjectPolicy::viewAny in the controller.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $sorts = collect(self::SORT_FIELDS)
            ->flatMap(fn (string $field) => [$field, '-'.$field])
            ->all();

        return [
            'page' => ['integer', 'min:1'],
            'per_page' => ['integer', 'min:1', 'max:100'],
            'search' => ['string', 'max:255'],
            'status' => ['string', Rule::enum(SubjectStatus::class)],
            'sort' => ['string', Rule::in($sorts)],
        ];
    }
}
