<?php

use App\Exceptions\ApplicationException;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'active' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always render JSON for API routes.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $notFound = fn () => response()->json([
            'message' => 'Resource not found.',
            'code' => 'NOT_FOUND',
        ], 404);

        $forbidden = fn () => response()->json([
            'message' => 'You do not have permission to perform this action.',
            'code' => 'FORBIDDEN',
        ], 403);

        $exceptions->render(function (ApplicationException $e, Request $request) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => $e->errorCode(),
            ], $e->status());
        });

        $exceptions->context(fn (Throwable $e) => $e instanceof ApplicationException
            ? $e->context()
            : []);

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        // Laravel converts AuthorizationException and ModelNotFoundException into HTTP
        // exceptions before these callbacks run. Response::denyAsNotFound() becomes a plain
        // HttpException with status 404 (not a NotFoundHttpException), so match on status.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($notFound, $forbidden) {
            if (! $request->is('api/*')) {
                return null;
            }

            return match ($e->getStatusCode()) {
                403 => $forbidden(),
                404 => $notFound(),
                default => null,
            };
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Method not allowed.',
                    'code' => 'METHOD_NOT_ALLOWED',
                ], 405);
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Too many requests. Please try again later.',
                    'code' => 'RATE_LIMITED',
                ], 429, $e->getHeaders());
            }
        });

        // Expected client errors are not server errors.
        $exceptions->dontReport([
            ApplicationException::class,
        ]);

        $exceptions->dontFlash([
            'password',
            'password_confirmation',
            'current_password',
            'access_token',
            'token',
        ]);
    })->create();
