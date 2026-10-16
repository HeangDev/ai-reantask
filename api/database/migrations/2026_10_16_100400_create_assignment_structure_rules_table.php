<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_structure_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('structure_id')->constrained('assignment_structures')->restrictOnDelete();
            $table->string('path');
            $table->string('type');
            $table->boolean('is_required')->default(true);
            $table->longText('description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('updated_at')->nullable();
            $table->foreignId('updated_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by_user')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_structure_rules');
    }
};
