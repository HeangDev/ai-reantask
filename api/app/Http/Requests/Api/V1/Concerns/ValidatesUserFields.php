<?php

namespace App\Http\Requests\Api\V1\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Rules and normalisation shared by every request that writes user profile fields.
 */
trait ValidatesUserFields
{
    /**
     * Trim text fields and lowercase the email (authentication.md section 5.3).
     */
    protected function normalizeUserFields(): void
    {
        $normalized = [];

        foreach (['fullname', 'username', 'phone'] as $field) {
            if (is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        if (is_string($this->input('email'))) {
            $normalized['email'] = strtolower(trim($this->input('email')));
        }

        $this->merge($normalized);
    }

    /**
     * Uniqueness checks hit the table directly, so soft-deleted users still count (BR-USR-05).
     *
     * @return array<string, array<int, mixed>>
     */
    protected function userFieldRules(?User $ignore = null, bool $required = true): array
    {
        $presence = $required ? ['required'] : ['sometimes', 'required'];

        return [
            'fullname' => [...$presence, 'string', 'max:255'],
            'username' => [
                ...$presence, 'string', 'max:255', 'regex:/^[A-Za-z0-9._-]+$/',
                Rule::unique('users', 'username')->ignore($ignore?->id),
            ],
            'email' => [
                ...$presence, 'string', 'email', 'max:150',
                Rule::unique('users', 'email')->ignore($ignore?->id),
            ],
            'phone' => [
                ...$presence, 'string', 'max:20', 'regex:/^\+?[0-9][0-9 \-]{5,18}$/',
                Rule::unique('users', 'phone')->ignore($ignore?->id),
            ],
        ];
    }

    /**
     * @return array<int, mixed>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', 'confirmed', Password::defaults()];
    }
}
