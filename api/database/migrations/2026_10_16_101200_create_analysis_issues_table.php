<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analysis_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('analysis_runs')->restrictOnDelete();
            $table->string('category', 50);
            $table->string('severity', 50);
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('file_path')->nullable();
            $table->integer('line_number')->nullable();
            $table->longText('suggestion')->nullable();
            $table->enum('status', ['OPEN', 'RESOLVED', 'IGNORED'])->default('OPEN');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by_user')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['analysis_run_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analysis_issues');
    }
};
