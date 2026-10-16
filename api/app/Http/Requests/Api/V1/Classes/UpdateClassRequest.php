<?php

namespace App\Http\Requests\Api\V1\Classes;

use App\Enums\ClassStatus;
use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateClassRequest extends FormRequest
{
    /**
     * Authorization runs before validation, so a user who cannot see the class gets 404.
     */
    public function authorize(): bool
    {
        Gate::authorize('update', $this->schoolClass());

        return true;
    }

    /**
     * The date range is checked against the stored value when only one end is sent.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $class = $this->schoolClass();
        $start = $this->input('start_at', $class->start_at->toDateString());
        $end = $this->input('end_date', $class->end_date->toDateString());

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:65535'],
            'status' => ['sometimes', 'string', Rule::enum(ClassStatus::class)],
            'start_at' => ['sometimes', 'required', 'date_format:Y-m-d', 'before_or_equal:'.$end],
            'end_date' => ['sometimes', 'required', 'date_format:Y-m-d', 'after_or_equal:'.$start],
        ];
    }

    private function schoolClass(): SchoolClass
    {
        /** @var SchoolClass */
        return $this->route('school_class');
    }
}
