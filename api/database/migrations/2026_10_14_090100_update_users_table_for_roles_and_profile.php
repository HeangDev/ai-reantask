<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Brings `users` in line with docs/database/database.md.
 *
 * Rows that already exist (the default Laravel seed user) get a student role and
 * placeholder username/phone values so the NOT NULL and UNIQUE constraints can be applied.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'fullname');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained()->restrictOnDelete();
            $table->string('username')->nullable()->after('fullname');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('password');
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
                ->default('ACTIVE')->after('avatar');
            $table->foreignId('created_by_user')->nullable()->after('created_at')
                ->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user')->nullable()->after('updated_at')
                ->constrained('users')->nullOnDelete();
            $table->softDeletes()->after('updated_by_user');
            $table->foreignId('deleted_by_user')->nullable()->after('deleted_at')
                ->constrained('users')->nullOnDelete();
        });

        $studentRoleId = DB::table('roles')->where('name', 'student')->value('id')
            ?? DB::table('roles')->insertGetId([
                'name' => 'student',
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        DB::table('users')->orderBy('id')->each(function (object $user) use ($studentRoleId) {
            DB::table('users')->where('id', $user->id)->update([
                'role_id' => $studentRoleId,
                'username' => 'user'.$user->id,
                'phone' => '+000'.str_pad((string) $user->id, 9, '0', STR_PAD_LEFT),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->nullable(false)->change();
            $table->string('username')->nullable(false)->change();
            $table->string('phone', 20)->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
            $table->unique('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['created_by_user']);
            $table->dropForeign(['updated_by_user']);
            $table->dropForeign(['deleted_by_user']);
            $table->dropUnique(['username']);
            $table->dropUnique(['phone']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'role_id', 'username', 'phone', 'avatar', 'status',
                'created_by_user', 'updated_by_user', 'deleted_by_user',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('fullname', 'name');
        });
    }
};
