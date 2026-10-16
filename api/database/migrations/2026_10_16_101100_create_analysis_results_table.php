<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analysis_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('analysis_runs')->restrictOnDelete();
            $table->foreignId('requirement_id')->constrained('assignment_requirements')->restrictOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->longText('explanation')->nullable();
            $table->json('evidence')->nullable();
            $table->enum('status', ['PASS', 'PARTIAL', 'FAIL', 'NOT_CHECKED'])->default('PASS');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analysis_results');
    }
};
