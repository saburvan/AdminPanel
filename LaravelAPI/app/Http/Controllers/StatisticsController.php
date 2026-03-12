<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Students;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    //    Homepage statistics
    public function getStatistics(Request $request)
    {
        $courses = Course::where('end_date', '>=', Carbon::now())->count();
        $lessons = Lesson::with('courses', function ($query) {
            $query->where('start_date', '>=', Carbon::now());
        })->count();
        $students = Students::all()->count();
        $hours = Lesson::whereHas('courses', function ($query) {
            $query->where('start_date', '>=', now());
        })
            ->select('lessons.name', DB::raw('MAX(lessons.hours) as max_hours'))
            ->groupBy('lessons.name')
            ->get()
            ->sum('max_hours');

        return response()->json([
            'courses' => [
                'icon' => 'fa-chart-line',
                'stat' => $courses,
                'label' => 'активных курсов'
            ],
            'lessons' => [
                'icon' => 'fa-video',
                'stat' => $lessons,
                'label' => 'уроков'
            ],
            'students' => [
                'icon' => 'fa-user',
                'stat' => $students,
                'label' => 'студентов'
            ],
            'hours' => [
                'icon' => 'fa-clock',
                'stat' => $hours,
                'label' => 'часов контента'
            ],
        ]);
    }

//    Income chart
    public function getIncomeStats(Request $request)
    {
        $yearFrom = $request->year_from ?? intval(Carbon::now()->format('Y')) - 1;
        $monthFrom = $request->month_from ?? Carbon::now()->format('m');
        $monthFrom = str_pad($monthFrom, 2, '0', STR_PAD_LEFT);
        $startDate = $yearFrom . '-' . $monthFrom . '-01';

        $yearTo = $request->year_to ?? Carbon::now()->format('Y');
        $monthTo = $request->month_to ?? Carbon::now()->format('m');
        $monthTo = str_pad($monthTo, 2, '0', STR_PAD_LEFT);
        $endDate = $yearTo . '-' . $monthTo . '-30';

        DB::statement("SET lc_time_names = 'ru_RU'");

        $sqlView = "
            CREATE OR REPLACE VIEW view_revenue_periods AS
            WITH RECURSIVE months AS (
                -- Начало: дата начала
                SELECT DATE_FORMAT('" . $startDate . "', '%Y-%m-01') AS dt
                UNION ALL
                SELECT dt + INTERVAL 1 MONTH
                FROM months
                -- Конец: текущий месяц
                WHERE dt < DATE_FORMAT('" . $endDate . "', '%Y-%m-01')
            )
            SELECT dt AS period_start FROM months;
        ";
        DB::statement($sqlView);

        $sqlData = "
            SELECT
            DATE_FORMAT(v.period_start, '%b %Y') as date, -- Красивая дата из календаря
            COUNT(cs.students_id) as c,                            -- Считаем ID студентов (в пустых месяцах будет 0)
            IFNULL(SUM(c.price), 0) as total              -- Если суммы нет (NULL), ставим 0
            FROM view_revenue_periods v
            LEFT JOIN courses c ON DATE_FORMAT(c.start_date, '%Y-%m-01') = v.period_start
            LEFT JOIN course_students cs ON c.id = cs.course_id
            AND cs.payment_status = 'success'             -- Условие оплаты ТУТ, а не в WHERE
            GROUP BY v.period_start                           -- Группируем по календарю
            ORDER BY v.period_start;                          -- Чтобы график шел по порядку
        ";
        $data = DB::select($sqlData);

        $dates = [];
        $values = [];

        foreach ($data as $d) {
            $dates[] = $d->date;
            $values[] = $d->total;
        }

        $pie = Course::select(
            'courses.name',
            DB::raw("ROUND(
                (SUM(courses.price) /(
                SELECT SUM(`courses`.`price`)
                FROM courses
                INNER JOIN course_students ON courses.id = course_students.course_id
                WHERE payment_status = 'success'
                ) * 100 )
            , 2) AS percentage"))
            ->where('courses.start_date', '>=', $startDate)
            ->where('courses.start_date', '<=', $endDate)
            ->with('students', function ($query) {
                $query->where('payment_status', 'success');
            })
            ->groupBy('courses.name')
            ->orderBy('percentage', 'DESC')
            ->get()
            ->toArray();

        if (empty($pie)) {
            $pie = [[
                'name' => 'Статистики не найдено',
                'percentage' => 100,
            ]];
        } else {
            $mainStats = array_slice($pie, 0, 7);
            $mainPercentage = collect($mainStats)->sum('percentage');
            $pie = array_merge($mainStats, [[
                'name' => 'Остальные',
                'percentage' => str(round(100 - $mainPercentage, 2)),
            ]]);
        }

        $labels = [];
        $numbers = [];

        foreach ($pie as $d) {
            $d = collect($d)->toArray();
            $labels[] = $d['name'];
            $numbers[] = $d['percentage'];
        }

        return response()->json([
            'revenue' => [
                'dates' => $dates,
                'values' => $values
            ],
            'pie' => [
                'labels' => $labels,
                'values' => $numbers
            ]
        ]);
    }


//    Popular (top 10) chart
    public function getTopStats(Request $request)
    {
        $period = $request->period ?? 'all';

        $courses = Course::select('courses.name')
            ->withCount('students') // добавляет students_count
            ->orderByDesc('students_count')
            ->limit(10);

        if ($period === 'year') {
            $courses->whereYear('start_date', now()->year);
        } elseif ($period === 'month') {
            $courses->whereMonth('start_date', now()->month)
                ->whereYear('start_date', now()->year);
        }
        $result = $courses->get();

        $names = [];
        $values = [];
        foreach ($result as $d) {
            $names[] = $d->name;
            $values[] = $d->students_count;
        }

        return response()->json([
            'top' => [
                'names' => $names,
                'values' => $values
            ]
        ]);
    }
}
