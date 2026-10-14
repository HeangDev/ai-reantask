<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('fullname');
        });

        // Restore the NOT NULL + UNIQUE shape with placeholder values.
        DB::table('users')->orderBy('id')->each(fn (object $user) => DB::table('users')
            ->where('id', $user->id)->update(['username' => 'user'.$user->id]));

        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }
};
