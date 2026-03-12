<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{

    use HasFactory;

    public $table = 'courses';
    public $timestamps = false;
    public $guarded = [];

    public $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function students()
    {
        // Указываем таблицу 'course_students' и ваши кастомные ключи
        return $this->belongsToMany(Students::class, 'course_students', 'course_id', 'students_id')
            ->withPivot('order_id'); // students_id и course_id добавятся автоматически, их не надо писать
    }

    public function lesson()
    {
        return $this->hasMany(Lesson::class);
    }

}
