<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Enums\UserStatus;
use App\Http\Requests\Api\V1\Concerns\ValidatesUserFields;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    use ValidatesUserFields;

    /**
     * Authorization runs before validation on purpose, so a user who cannot see the
     * target gets 404 instead of validation errors that reveal it exists.
     *
     * Sending `role_id` or `status` without permission is a 403 (BR-USR-03, BR-USR-04).
     */
    public function authorize(): bool
    {
        /** @var User $target */
        $target = $this->route('user');

        Gate::authorize('update', $target);

        if ($this->has('role_id')) {
            Gate::authorize('changeRole', $target);
        }

        if ($this->has('status')) {
            Gate::authorize('changeStatus', $target);
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeUserFields();
    }

    /**
     * Everyone may edit fullname, username, and phone. Email is admin-only; for other
     * users it is not validated, so it is dropped from `validated()`.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');

        $fields = $this->userFieldRules($target, required: false);

        $rules = [
            'fullname' => $fields['fullname'],
            'username' => $fields['username'],
            'phone' => $fields['phone'],
            'role_id' => ['sometimes', 'integer', Rule::exists('roles', 'id')->where('status', 'ACTIVE')],
            'status' => ['sometimes', 'string', Rule::enum(UserStatus::class)->except(UserStatus::Deleted)],
        ];

        if ($this->user()->isAdmin()) {
            $rules['email'] = $fields['email'];
        }

        return $rules;
    }
}
