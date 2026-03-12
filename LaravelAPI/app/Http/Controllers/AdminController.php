<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
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

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'message' => 'Invalid data',
                'errors' => [
                    'email' => 'Неверные email или пароль',
                    'password' => 'Неверные email или пароль',
                ]
            ], 422);
        }

//        creating of Bearer Token
        $token = $admin->createToken('admin')->plainTextToken;

        return response()->json([
            'token' => $token,
            'email' => $admin->email,
        ], 200);
    }

//    Logout
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json([
            'message' => 'Вы успешно вышли из аккаунта',
            'success' => '1',
        ]);
    }
}
