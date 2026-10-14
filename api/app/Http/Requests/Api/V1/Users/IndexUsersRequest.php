<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUsersRequest extends FormRequest
{
    public const SORT_FIELDS = ['created_at', 'fullname', 'email'];

    public function authorize(): bool
    {
        // Access is enforced by UserPolicy::viewAny in the controller.
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
            'role' => ['string', Rule::enum(RoleName::class)],
            'status' => ['string', Rule::enum(UserStatus::class)],
            'sort' => ['string', Rule::in($sorts)],
        ];
    }
}
