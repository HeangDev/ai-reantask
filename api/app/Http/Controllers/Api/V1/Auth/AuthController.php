<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\DeleteAccountRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Services\Auth\AuthService;
use App\Services\Auth\RegistrationService;
use App\Services\Users\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly RegistrationService $registration,
        private readonly UserService $users,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->registration->register($request->validated());

        return $this->tokenResponse($this->auth->issueToken($user, Str::limit((string) $request->userAgent(), 255, '')), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->validated('device_name'),
        );

        return $this->tokenResponse($result);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('role'));
    }

    public function logout(Request $request): Response
    {
        $this->auth->logout($request->user());

        return response()->noContent();
    }

    public function logoutAll(Request $request): Response
    {
        $request->user()->tokens()->delete();

        return response()->noContent();
    }

    public function deleteAccount(DeleteAccountRequest $request): Response
    {
        $this->users->deleteOwnAccount($request->user());

        return response()->noContent();
    }

    /**
     * @param  array{token: string, token_type: string, expires_at: ?string, user: User}  $result
     */
    private function tokenResponse(array $result, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => [
                'token' => $result['token'],
                'token_type' => $result['token_type'],
                'expires_at' => $result['expires_at'],
                'user' => new UserResource($result['user']),
            ],
        ], $status);
    }
}
