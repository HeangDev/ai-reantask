<?php

namespace App\Exceptions;

class InvalidGoogleTokenException extends ApplicationException
{
    public function __construct()
    {
        parent::__construct('The Google sign-in could not be verified.');
    }

    public function status(): int
    {
        return 401;
    }

    public function errorCode(): string
    {
        return 'INVALID_GOOGLE_TOKEN';
    }
}
