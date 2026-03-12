<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Students extends Model
{
    use HasFactory, HasApiTokens;

    public $table = 'students';
    public $timestamps = false;
    public $guarded = [];

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_students', 'course_id', 'students_id')
            ->withPivot(['order_date', 'payment_status', 'certificate_number']);
    }
}
