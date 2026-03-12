<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\StudentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ЭНДПОИНТЫ АДМИНИСТРАТОРА
Route::post('/admin/auth', [AdminController::class, 'auth']);
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('courses', CourseController::class);
    Route::apiResource('courses.lessons', LessonController::class);

    Route::get('/admin/logout', [AdminController::class, 'logout']);
    Route::get('/stats', [StatisticsController::class, 'getStatistics']);
    Route::post('/stats/top', [StatisticsController::class, 'getTopStats']);
    Route::get('/students', [StudentController::class, 'orders']);
    Route::post('/students/filter', [StudentController::class, 'orders']);
});
Route::post('/stats/revenue', [StatisticsController::class, 'getIncomeStats']);


// ЭНДПОИНТЫ КЛИЕНТА
Route::post('/auth', [StudentController::class, 'auth']);
Route::post('/register', [StudentController::class, 'reg']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/courses/{course_id}/buy', [StudentController::class, 'enrolCourse']);
    Route::get('/student/courses', [StudentController::class, 'myCourses']);
    Route::get('student/courses/{course_id}/cancel', [StudentController::class, 'cancel']);
});










