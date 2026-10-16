<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repositories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('git_connection_id')->constrained('git_connections')->restrictOnDelete();
            $table->string('provider', 50);
            $table->string('external_id');
            $table->string('owner');
            $table->string('name');
            $table->string('full_name');
            $table->string('url');
            $table->string('default_branch')->default('main');
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('updated_at')->nullable();
            $table->foreignId('updated_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->index(['git_connection_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repositories');
    }
};
