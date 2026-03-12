<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course_students extends Model
{
    public $table = 'course_students';
    public $primaryKey = 'order_id';
    public $timestamps = false;
    public $guarded = [];

    use HasFactory;
}
