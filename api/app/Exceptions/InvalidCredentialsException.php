<?php

namespace App\Exceptions;

class InvalidCredentialsException extends ApplicationException
{
    public function __construct()
    {
        parent::__construct('The provided credentials are incorrect.');
    }

    public function status(): int
    {
        return 401;
    }

    public function errorCode(): string
    {
        return 'INVALID_CREDENTIALS';
    }
}
