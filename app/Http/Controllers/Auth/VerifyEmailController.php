<?php


// VerifyEmailController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified for JTIMIS.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            // Redirect to role-specific dashboard
            $user = $request->user();
            if ($user->role === 'admin') {
                return redirect()->intended('/admin/dashboard?verified=1');
            } elseif ($user->role === 'dispatcher') {
                return redirect()->intended('/dispatcher/dashboard?verified=1');
            } elseif ($user->role === 'driver') {
                return redirect()->intended('/driver/dashboard?verified=1');
            }
            
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            /** @var \Illuminate\Contracts\Auth\MustVerifyEmail $user */
            $user = $request->user();
            event(new Verified($user));
        }

        // Redirect to role-specific dashboard after verification
        $user = $request->user();
        if ($user->role === 'admin') {
            return redirect()->intended('/admin/dashboard?verified=1');
        } elseif ($user->role === 'dispatcher') {
            return redirect()->intended('/dispatcher/dashboard?verified=1');
        } elseif ($user->role === 'driver') {
            return redirect()->intended('/driver/dashboard?verified=1');
        }

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}