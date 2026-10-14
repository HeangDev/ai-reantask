<?php

namespace App\Exceptions;

use Exception;

abstract class ApplicationException extends Exception
{
    abstract public function status(): int;

    abstract public function errorCode(): string;

    /**
     * Extra log context. Never returned to clients.
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return [];
    }
}
