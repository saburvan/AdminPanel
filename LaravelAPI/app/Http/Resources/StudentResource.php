<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'email' => $this->email,
            'name' => $this->name,
            'courses' => $this->courses->map(function ($course) {
                return [
                    'course_name' => $course->name,
                    'order_date' => Carbon::parse($course->pivot->order_date)->format('d.m.Y'),
                    'payment_status' => $course->pivot->payment_status,
                    'certificate' => $course->pivot->certificate_number,
                ];
            })
        ];
    }
}
