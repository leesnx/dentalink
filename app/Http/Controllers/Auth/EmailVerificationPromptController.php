<?php

// EmailVerificationPromptController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page for JTIMIS.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            // Redirect to role-specific dashboard
            $user = $request->user();
            if ($user->role === 'admin') {
                return redirect()->intended('/admin/dashboard');
            } elseif ($user->role === 'dispatcher') {
                return redirect()->intended('/dispatcher/dashboard');
            } elseif ($user->role === 'driver') {
                return redirect()->intended('/driver/dashboard');
            }
            
            return redirect()->intended(route('dashboard', absolute: false));
        }
        
        return Inertia::render('auth/verify-email', ['status' => $request->session()->get('status')]);
    }
}


