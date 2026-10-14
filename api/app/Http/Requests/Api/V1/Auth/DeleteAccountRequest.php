<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class DeleteAccountRequest extends FormRequest
{
    /**
     * Runs before validation so an admin gets 403 (BR-USR-04) instead of a password check.
     */
    public function authorize(): bool
    {
        Gate::authorize('deleteAccount', User::class);

        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'current_password:sanctum'],
        ];
    }
}
