<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Http\Requests\Api\V1\Concerns\ValidatesUserFields;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Public registration. `role_id`, `status`, and audit fields are never validated,
 * so they never reach `validated()` (BR-USR-02).
 */
class RegisterRequest extends FormRequest
{
    use ValidatesUserFields;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeUserFields();
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->userFieldRules(),
            'password' => $this->passwordRules(),
        ];
    }
}
