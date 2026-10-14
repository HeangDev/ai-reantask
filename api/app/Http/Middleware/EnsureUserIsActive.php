<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Exceptions\AccountNotActiveException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks users whose status is not ACTIVE (BR-USR-10), even if they still hold a valid token.
 * Runs after `auth:sanctum`.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->status !== UserStatus::Active) {
            throw new AccountNotActiveException;
        }

        return $next($request);
    }
}
