<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Enums\UserStatus;
use App\Http\Requests\Api\V1\Concerns\ValidatesUserFields;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    use ValidatesUserFields;

    /**
     * Authorization runs before validation on purpose: the unique rules would otherwise
     * let a non-admin probe which emails and phones are taken.
     */
    public function authorize(): bool
    {
        Gate::authorize('create', User::class);

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
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')->where('status', 'ACTIVE')],
            'status' => ['sometimes', 'string', Rule::enum(UserStatus::class)->except(UserStatus::Deleted)],
        ];
    }
}
