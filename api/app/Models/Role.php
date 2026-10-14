<?php

namespace App\Models;

use App\Enums\RoleStatus;
use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => RoleStatus::class,
        ];
    }

    /**
     * Roles are listed by admins only; everyone else sees none.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $user->isAdmin() ? $query : $query->whereRaw('0 = 1');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
