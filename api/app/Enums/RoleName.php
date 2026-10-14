<?php

namespace App\Enums;

enum RoleName: string
{
    case Admin = 'admin';
    case Teacher = 'teacher';
    case Student = 'student';
}
