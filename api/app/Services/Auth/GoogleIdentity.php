<?php

namespace App\Services\Auth;

/**
 * A Google account whose ID token passed verification.
 */
final readonly class GoogleIdentity
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
    ) {}
}
