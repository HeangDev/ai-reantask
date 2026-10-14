<?php

namespace App\Exceptions;

class AccountPendingException extends ApplicationException
{
    public function __construct()
    {
        parent::__construct('Your account is waiting for approval.');
    }

    public function status(): int
    {
        return 403;
    }

    public function errorCode(): string
    {
        return 'ACCOUNT_PENDING';
    }
}
