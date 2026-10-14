<?php

namespace App\Exceptions;

class AccountNotActiveException extends ApplicationException
{
    public function __construct()
    {
        parent::__construct('Your account is not active. Please contact an administrator.');
    }

    public function status(): int
    {
        return 403;
    }

    public function errorCode(): string
    {
        return 'ACCOUNT_NOT_ACTIVE';
    }
}
