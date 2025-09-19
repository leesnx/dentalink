<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page for the dental clinic.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request for dental clinic users.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:patient,staff,admin',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'patient',
            'phone' => $request->phone,
            'address' => $request->address,
            'status' => 'active',
        ]);

        event(new Registered($user));
        Auth::login($user);

        // Create audit log for registration
        AuditLog::logCreate($user->id, $user->role, 'users', $user->id, [
            'registration_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // If patient, ensure patient record is created
        if ($user->isPatient()) {
            $user->ensurePatientRecord();
        }

        // Redirect based on dental clinic user role
        $redirectUrl = match($user->role) {
            'admin' => '/admin/dashboard',
            'staff' => '/staff/dashboard',
            'patient' => '/patient/dashboard',
            default => route('dashboard')
        };

        return redirect($redirectUrl);
    }
}