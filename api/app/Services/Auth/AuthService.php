<?php

namespace App\Services\Auth;

use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * Unknown emails and wrong passwords fail identically. Soft-deleted users are
     * excluded by the model's global scope, so they cannot log in (BR-USR-06).
     *
     * @return array{token: string, token_type: string, expires_at: ?string, user: User}
     */
    public function login(string $email, string $password, ?string $deviceName): array
    {
        $user = User::where('email', strtolower($email))->first();

        // Hash a throwaway value for unknown emails so response time does not reveal them.
        $valid = Hash::check($password, $user?->password ?? Hash::make(Str::random(32)));

        if (! $user || ! $valid) {
            throw new InvalidCredentialsException;
        }

        return $this->issueToken($user, $deviceName);
    }

    /**
     * The plain-text token is returned only here and cannot be retrieved again.
     *
     * @return array{token: string, token_type: string, expires_at: ?string, user: User}
     */
    public function issueToken(User $user, ?string $deviceName = null): array
    {
        $minutes = config('sanctum.expiration');
        $expiresAt = $minutes ? now()->addMinutes($minutes) : null;

        $token = $user->createToken($deviceName ?: 'api', ['*'], $expiresAt);

        return [
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt?->toIso8601ZuluString(),
            'user' => $user->load('role'),
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }

    /**
     * Revokes every other token; the current one keeps working.
     */
    public function changePassword(User $user, string $password): void
    {
        $user->password = $password;
        $user->save();

        $current = $user->currentAccessToken();
        $others = $user->tokens();

        if ($current instanceof PersonalAccessToken) {
            $others->whereKeyNot($current->getKey());
        }

        $others->delete();
    }
}
