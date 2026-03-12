<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class LessonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|max:50',
            'hours' => 'required|integer|min:1|max:4',
            'description' => 'required|max:100'
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'Пожалуйста, заполните поле',
            'name.max' => 'Максимальная длина названия составляет 50 символов',
            'hours.integer' => 'Продолжительность урока должна быть количеством часов (от 1 до 4)',
            'hours.min' => 'Минимальная продолжительность урока составляет 1 час',
            'hours.max' => 'Максимальная продолжительность урока составляет 4 часа',
            'description.max' => 'Максимальная длина описания составляет 100 символов'
        ];
    }

    public function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'required' => 'Пожалуйста, заполните поле',
            'name.max' => 'Максимальная длина названия составляет 50 символов',
            'hours.integer' => 'Продолжительность урока должна быть количеством часов (от 1 до 4)',
            'hours.min' => 'Минимальная продолжительность урока составляет 1 час',
            'hours.max' => 'Максимальная продолжительность урока составляет 4 часа',
            'description.max' => 'Максимальная длина описания составляет 100 символов'
        ], 422));
    }
}
