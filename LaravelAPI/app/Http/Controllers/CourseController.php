<?php

namespace App\Http\Controllers;

use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    //    All courses
    public function index(Request $request)
    {
        $page = $request->page ?? 1;
        $per_page = $request->per_page ?? 8;
        $courses = Course::select(
            DB::raw("(SELECT COUNT(course_id) FROM lessons WHERE course_id = courses.id) AS count"),
            DB::raw('(SELECT SUM(lessons.hours)  FROM lessons WHERE lessons.course_id = courses.id) AS hours'),
            'courses.*'
        )
            ->where('end_date', '>=', Carbon::now())
            ->orderBy('start_date', 'asc')
            ->paginate($per_page);

        return CourseResource::collection($courses);
    }

    //    Create course
    public function store(CourseRequest $request)
    {
        $data = $request->validated();

        $image = $request->file('img');
        $fileName = time() . '-' . $image->getClientOriginalName();
        $image->move(public_path('img/'), $fileName);

        $data['img'] = $fileName;

        Course::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Курс был успешно добавлен'
        ]);
    }

//   Delete course
    public function destroy(Request $request)
    {
        $course_id = $request->course;

//        If the course has orders, it cannot be removed
        $isNotDeletable = Course::where('id', $course_id)->whereDoesntHave('students')->exists();

        if (!$isNotDeletable) {
            return response()->json([
                'id' => $course_id,
                'statement' => $isNotDeletable,
                'success' => false,
                'message' => 'Не удалось удалить курс <br> (на данный курс уже есть записи)'
            ]);
        } else {
            $course = Course::where('id', $course_id);
            $image = $course->first()->img;

            if (file_exists(public_path('img/' . $image))) {
                unlink(public_path('img/' . $image));
            }
            $course->delete();

            return response()->json([
                'success' => true,
                'message' => 'Курс успешно удален'
            ]);
        }
    }
}
