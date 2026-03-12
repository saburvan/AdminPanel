<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class CourseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // поставить true для функционирования реквеста
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
//    Валидация
    public function rules(): array
    {
        return [
            'name' => 'required|max:30',
            'price' => 'required',
            'start_date' => 'required|date|before_or_equal:end_date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'img' => 'required|image|mimes:jpeg,png,jpg|max:2000',
            'description' => 'required|max:100'
        ];
    }

//    Сообщения об ошибках
    public function messages(): array
    {
        return [
            'required' => 'Пожалуйста, заполните поле',
            'date' => 'Пожалуйста, введите корректный формат даты',
            'name.max' => 'Максимальная длина названия составляет 30 символов',
            'start_date.before_or_equal' => 'Дата начала курса не должна быть позднее даты окончания',
            'end_date.after_or_equal' => 'Дата окончания курса не должна быть раньше даты начала',
            'img.required' => 'Пожалуйста, загрузите изображение',
            'img.image' => 'Пожалуйста, загрузите изображение верного формата',
            'img.mimes' => 'Пожалуйста загрузите изображение в доступных форматах (PNG, JPEG, JPG)',
            'img.max' => 'Максимальный вес изображения 2000 КБ',
        ];
    }

//    Кастомный вывод ошибок
    public function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'errors' => $validator->errors(),
        ], 422));
    }
}
