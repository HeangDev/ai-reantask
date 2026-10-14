<?php

namespace App\Exceptions;

class UserNotPendingException extends ApplicationException
{
    public function __construct()
    {
        parent::__construct('This user is not waiting for approval.');
    }

    public function status(): int
    {
        return 409;
    }

    public function errorCode(): string
    {
        return 'USER_NOT_PENDING';
    }
}
