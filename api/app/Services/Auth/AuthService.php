<?php

namespace App\Services\Auth;

use App\Enums\UserStatus;
use App\Exceptions\AccountNotActiveException;
use App\Exceptions\AccountPendingException;
use App\Exceptions\InvalidCredentialsException;
use App\Exceptions\InvalidGoogleTokenException;
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

        // Status is checked only after the password is right, so a stranger cannot learn an account's state.
        if ($user->status === UserStatus::Pending) {
            throw new AccountPendingException;
        }

        // Only ACTIVE users can log in (BR-USR-10).
        if ($user->status !== UserStatus::Active) {
            throw new AccountNotActiveException;
        }

        return $this->issueToken($user, $deviceName);
    }

    /**
     * The account a verified Google identity belongs to: matched by Google id first, then by email.
     *
     * @throws InvalidGoogleTokenException when the email belongs to a different Google account
     */
    public function findGoogleUser(GoogleIdentity $identity): ?User
    {
        $user = User::where('google_id', $identity->id)->first()
            ?? User::where('email', $identity->email)->first();

        if ($user?->google_id && $user->google_id !== $identity->id) {
            throw new InvalidGoogleTokenException;
        }

        return $user;
    }

    /**
     * Google has verified the email, so no password is needed. The account must still be approved and active.
     *
     * @return array{token: string, token_type: string, expires_at: ?string, user: User}
     */
    public function loginWithGoogle(User $user, GoogleIdentity $identity, ?string $deviceName): array
    {
        if ($user->status === UserStatus::Pending) {
            throw new AccountPendingException;
        }

        if ($user->status !== UserStatus::Active) {
            throw new AccountNotActiveException;
        }

        if (! $user->google_id) {
            $user->google_id = $identity->id;
            $user->email_verified_at ??= now();
            $user->save();
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
