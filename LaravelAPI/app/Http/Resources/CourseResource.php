<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'hours' => $this->hours ?? 0,
            'img' => $this->img,
            'start_date' => $this->start_date->format('d.m.Y'),
            'end_date' => $this->end_date->format('d.m.Y'),
            'price' => str_pad($this->price, 5, '0', STR_PAD_LEFT),
            'count' => $this->count
        ];
    }
}
