<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Public registration creates a PENDING student until an admin or a teacher approves the account.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY status ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE'");
    }

    public function down(): void
    {
        DB::table('users')->where('status', 'PENDING')->update(['status' => 'INACTIVE']);

        DB::statement("ALTER TABLE users MODIFY status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE'");
    }
};
