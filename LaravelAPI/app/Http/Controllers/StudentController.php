<?php

namespace App\Http\Controllers;

use App\Http\Resources\StudentResource;
use App\Models\Course;
use App\Models\Course_students;
use App\Models\Students;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    //    Authorization
    public function auth(Request $request)
    {
        $data = Validator::make($request->all(), [
            'email' => 'required',
            'password' => 'required',
        ], [
            'required' => 'Пожалуйста, заполните поле',
        ]);

        if ($data->fails()) {
            return response()->json([
                'message' => 'Invalid data',
                'errors' => $data->errors()
            ], 422);
        }

        $student = Students::where('email', $request->email)->first();

        if (!$student || !Hash::check($request->password, $student->password)) {
            return response()->json([
                'message' => 'Invalid data',
                'errors' => [
                    'email' => 'Неверные email или пароль',
                    'password' => 'Неверные email или пароль',
                ]
            ], 422);
        }

        $token = $student->createToken('student')->plainTextToken;

        return response()->json([
            'token' => $token,
        ], 200);
    }

    //    Registration
    public function reg(Request $request)
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|between:3,100',
            'email' => 'required|email|unique:students',
            'password' => 'required|min:3|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_#!%]).+$/',
        ], [
            'required' => 'Пожалуйста, заполните поле',
            'name.between' => 'Имя должно содержать от 3 до 100 символов',
            'email.email' => 'Пожалуйста, введите корректный email',
            'email.unique' => 'Пользователь с таким email уже существует',
            'password.min' => 'Пароль должен содержать минимум 3 символа',
            'password.regex' => 'Пароль должен содержать в себе минимум один символ верхнего и нижнего регистра, одну цифры и один из спецсимволов «_», «#», «!», «%».'
        ]);

        if ($data->fails()) {
            return response()->json([
                'message' => 'Invalid data',
                'errors' => $data->errors()
            ], 422);
        }

        $all = $request->all();
        $all['password'] = Hash::make($all['password']);

        Students::create($all);

        return response()->json([
            'success' => true,
        ], 200);
    }

//    Enrol the course
    public function enrolCourse($course_id, Request $request)
    {
        $course = Course::where('id', $course_id)->first();

        if (!$course) {
            return response()->json([
                'message' => 'Такого курса не существует'
            ], 404);
        }

        $now = Carbon::now();
        if ($now > $course->start_date) {
            return response()->json([
                'message' => 'Запись на данный курс закрыта'
            ], 403);
        }

        $last = Course_students::create([
            'course_id' => $course_id,
            'students_id' => $request->user()->id,
        ]);

        return response()->json([
            'order_id' => $last->order_id,
        ]);
    }

//    Showing the courses of certain student
    public function myCourses(Request $request)
    {
        $studentId = $request->user()->id; // Получаем ID текущего юзера

        $courses = Course::join('course_students', 'course_students.course_id', '=', 'courses.id')
            ->where('course_students.students_id', $studentId)->get()->map(function ($course) {
                return [
                    'id' => $course->order_id,
                    'payment_status' => $course->payment_status,
                    'courses' => [
                        'id' => $course->id,
                        'name' => $course->name,
                        'description' => $course->description,
                        'hours' => $course->hours,
                        'img' => $course->img,
                        'start_date' => $course->start_date->format('d-m-Y'),
                        'end_date' => $course->end_date->format('d-m-Y'),
                        'price' => str_pad($course->price, 5, '0', STR_PAD_LEFT),
                    ],
                ];
            });

        return response()->json($courses);
    }

//    Cancel course signing
    public function cancel($course_id, Request $request)
    {
        $studentId = $request->user()->id;
        $course = Course_students::where('course_id', $course_id)->where('students_id', $studentId)->first();
        if (!$course) {
            return response()->json([
                'status' => 'Такого курса не существует или вы не записаны на него'
            ], 404);
        }
        if ($course->payment_status == 'success') {
            return response()->json([
                'status' => 'Запись на уже оплаченный курс невозможно отменить'
            ], 418);
        }

        Course_students::where('course_id', $course_id)->where('students_id', $studentId)->delete();

        return response()->json([
            'status' => 'Запись на курс успешно отменена'
        ]);
    }

//    Fetching the students with their orders
    public function orders(Request $request)
    {
        // If has filters
        $search = $request->search ?? '';
        $certificate = $request->certificate ?? -1; // -1 all, 1 with certificate, 0 without certificate
        $payment_status = $request->payment; // 'success', 'pending', 'failed' or null


        $studentsQuery = Students::query();

        // Search
        if (!empty($search)) {
            $studentsQuery->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%$search%")
                    ->orWhere('email', 'LIKE', "%$search%");
            });
        }

        // If the filters should be applied
        $applyFilters = ($certificate != -1) || in_array($payment_status, ['success', 'pending', 'failed'], true);

        // Leaving the students with at least one course
        // if necessary filter by status and certificate
        $studentsQuery->whereHas('courses', function ($query) use ($certificate, $payment_status, $applyFilters) {
            if ($applyFilters) {
                // Фильтр по статусу оплаты
                if (in_array($payment_status, ['success', 'pending', 'failed'], true)) {
                    $query->where('course_students.payment_status', $payment_status);
                }
                // Фильтр по сертификату
                if ($certificate == 1) {
                    $query->whereNotNull('course_students.certificate_number');
                } elseif ($certificate == 0) {
                    $query->whereNull('course_students.certificate_number');
                }
            }
        });

        // Loading only filtered orders (if there is no filters, loading all the orders)
        $studentsQuery->with(['courses' => function ($query) use ($certificate, $payment_status, $applyFilters) {
            if ($applyFilters) {
                if (in_array($payment_status, ['success', 'pending', 'failed'], true)) {
                    $query->where('course_students.payment_status', $payment_status);
                }
                if ($certificate == 1) {
                    $query->whereNotNull('course_students.certificate_number');
                } elseif ($certificate == 0) {
                    $query->whereNull('course_students.certificate_number');
                }
            }
        }]);

        $students = $studentsQuery->get();

        return StudentResource::collection($students)->additional([
            'total_students' => $students->count(),
            'total_signs' => $students->sum(fn($item) => $item['courses']->count()),
        ]);
    }
}
