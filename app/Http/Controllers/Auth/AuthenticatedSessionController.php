<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request for the dental clinic system.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        Log::info('Login attempt started', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        try {
            // Check if user exists first
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                Log::warning('Login failed: User not found', [
                    'email' => $request->email,
                    'ip' => $request->ip()
                ]);
                
                return back()->withErrors([
                    'email' => 'These credentials do not match our records.',
                ]);
            }

            // Check if user status is active
            if ($user->status !== 'active') {
                Log::warning('Login failed: User account is not active', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'status' => $user->status
                ]);
                
                return back()->withErrors([
                    'email' => 'Your account is not active. Please contact administrator.',
                ]);
            }

            // Attempt authentication
            $request->authenticate();
            $request->session()->regenerate();

            $authenticatedUser = Auth::user();

            // Create audit log for successful login
            AuditLog::logLogin($authenticatedUser->id, $authenticatedUser->role, [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            Log::info('User successfully authenticated', [
                'user_id' => $authenticatedUser->id,
                'email' => $authenticatedUser->email,
                'role' => $authenticatedUser->role,
            ]);

            // Redirect based on user role in dental clinic system
            $redirectUrl = match($authenticatedUser->role) {
                'admin' => '/admin/dashboard',
                'staff' => '/staff/dashboard',
                'patient' => '/patient/dashboard',
                default => route('dashboard')
            };

            return redirect()->intended($redirectUrl);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Login validation failed', [
                'email' => $request->email,
                'errors' => $e->errors()
            ]);
            throw $e;
            
        } catch (\Exception $e) {
            Log::error('Login error occurred', [
                'email' => $request->email,
                'error' => $e->getMessage(),
            ]);
            
            return back()->withErrors([
                'email' => 'An error occurred during login. Please try again.',
            ]);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        if ($user) {
            // Create audit log for logout
            AuditLog::logLogout($user->id, $user->role, [
                'ip_address' => $request->ip(),
            ]);
            
            Log::info('User logout initiated', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}