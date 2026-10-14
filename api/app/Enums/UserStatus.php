<?php

namespace App\Enums;

enum UserStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Inactive = 'INACTIVE';
    case Suspended = 'SUSPENDED';
    case Deleted = 'DELETED';
}
