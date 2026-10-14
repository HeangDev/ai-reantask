<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Users\RoleController;
use App\Http\Controllers\Api\V1\Users\SessionController;
use App\Http\Controllers\Api\V1\Users\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        // Public, rate-limited.
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register']);
            Route::post('login', [AuthController::class, 'login']);
            Route::post('forgot-password', [PasswordController::class, 'forgot']);
            Route::post('reset-password', [PasswordController::class, 'reset']);
        });

        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
            Route::put('password', [PasswordController::class, 'update']);
            Route::delete('account', [AuthController::class, 'deleteAccount']);
        });
    });

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('roles', [RoleController::class, 'index']);

        Route::get('users', [UserController::class, 'index']);
        Route::get('users/pending-students', [UserController::class, 'pendingStudents']);
        Route::post('users', [UserController::class, 'store']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
        Route::post('users/{user}/approve', [UserController::class, 'approve']);
        Route::get('users/{user}/sessions', [SessionController::class, 'index']);
    });
});
