<?php

namespace App\Http\Controllers;

use App\Http\Requests\LessonRequest;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    //    All lessons
    public function index($course_id)
    {
        $lessons = Lesson::where('course_id', $course_id)->get()->toArray();
        $course = Course::select('name')->where('id', $course_id)->first();

        if (empty($lessons)) {
            return response()->json([
                'message' => 'Уроков у данного курса не найдено',
                'course' => $course,
            ], 404);
        }

        return response()->json([
            'data' => $lessons,
            'course' => $course
        ]);
    }

    //    Creating lesson for certain course
    public function store(LessonRequest $request)
    {
        $data = $request->validated();
        $data['course_id'] = $request->course;

        Lesson::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Урок был успешно добавлен',
            'id' => $data['course_id'],
            'data' => $data,
        ]);
    }

//    Delete lesson
    public function destroy(Request $request)
    {
        $course_id = $request->course_id;
        $id = $request->id;

//        If the course has orders, it cannot be removed
        $isNotDeletable = Course::whereDoesntHave('students')->where('id', $course_id)->exists();

        if (!$isNotDeletable) {
            return response()->json([
                'success' => false,
                'message' => 'Не удалось удалить урок <br> (на данный курс уже есть записи)'
            ]);
        } else {
            Lesson::where('id', $id)->delete();
            return response()->json([
                'success' => true,
                'message' => 'Урок успешно удален'
            ]);
        }
    }
}
