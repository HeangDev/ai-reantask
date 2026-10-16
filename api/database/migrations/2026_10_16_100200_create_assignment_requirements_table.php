<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('type', 50);
            $table->boolean('is_required')->default(true);
            $table->decimal('weight', 5, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('updated_at')->nullable();
            $table->foreignId('updated_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->index(['assignment_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_requirements');
    }
};
