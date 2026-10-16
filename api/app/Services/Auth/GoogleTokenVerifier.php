<?php

namespace App\Services\Auth;

use App\Exceptions\InvalidGoogleTokenException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class GoogleTokenVerifier
{
    private const TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    /**
     * Google checks the signature and expiry; this checks the token was issued for
     * this app (`aud`) and that Google has verified the email address.
     *
     * @throws InvalidGoogleTokenException
     */
    public function verify(string $idToken): GoogleIdentity
    {
        $clientId = config('services.google.client_id');

        if (! $clientId) {
            throw new InvalidGoogleTokenException;
        }

        try {
            $response = Http::timeout(5)->get(self::TOKEN_INFO_URL, ['id_token' => $idToken]);
        } catch (ConnectionException) {
            throw new InvalidGoogleTokenException;
        }

        $claims = $response->json();

        if (
            ! $response->successful()
            || ! is_array($claims)
            || ($claims['aud'] ?? null) !== $clientId
            || ! in_array($claims['iss'] ?? null, self::ISSUERS, true)
            || ! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            || empty($claims['sub'])
            || empty($claims['email'])
        ) {
            throw new InvalidGoogleTokenException;
        }

        $email = strtolower($claims['email']);

        return new GoogleIdentity(
            id: (string) $claims['sub'],
            email: $email,
            name: (string) ($claims['name'] ?? strstr($email, '@', true)),
        );
    }
}
