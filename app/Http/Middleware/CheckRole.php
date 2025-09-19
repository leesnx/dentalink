<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request for Dental Clinic Management System.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required',
                    'error_code' => 'UNAUTHENTICATED'
                ], 401);
            }
            return redirect()->route('login');
        }

        // Check if user account is active
        if ($request->user()->status !== 'active') {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been suspended. Please contact administrator.',
                    'error_code' => 'ACCOUNT_SUSPENDED'
                ], 403);
            }
            
            auth()->logout();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been suspended. Please contact administrator.'
            ]);
        }

        // Validate role exists in Dental Clinic system
        $validRoles = ['admin', 'staff', 'patient'];
        if (!in_array($role, $validRoles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role specified',
                    'error_code' => 'INVALID_ROLE'
                ], 400);
            }
            abort(400, 'Invalid role specified');
        }

        // Check if user has the required role
        if ($request->user()->role !== $role) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient permissions. Required role: ' . $role,
                    'error_code' => 'INSUFFICIENT_PERMISSIONS',
                    'required_role' => $role,
                    'user_role' => $request->user()->role
                ], 403);
            }
            
            // Redirect based on user's actual role in Dental Clinic
            return match($request->user()->role) {
                'admin' => redirect()->route('admin.dashboard')->with('error', 'You do not have permission to access that page.'),
                'staff' => redirect()->route('staff.dashboard')->with('error', 'You do not have permission to access that page.'),
                'patient' => redirect()->route('patient.dashboard')->with('error', 'You do not have permission to access that page.'),
                default => redirect()->route('dashboard')->with('error', 'Invalid user role. Please contact administrator.')
            };
        }

        // Additional role-specific validations for Dental Clinic
        if ($role === 'staff') {
            // Check if staff has required information
            if (empty($request->user()->employee_id)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Staff profile incomplete. Please contact administrator.',
                        'error_code' => 'STAFF_PROFILE_INCOMPLETE'
                    ], 403);
                }
                
                return redirect()->route('profile.edit')->withErrors([
                    'profile' => 'Your staff profile is incomplete. Please update your information.'
                ]);
            }

            // Check if staff position is set
            if (empty($request->user()->position)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Staff position not assigned. Please contact administrator.',
                        'error_code' => 'STAFF_POSITION_MISSING'
                    ], 403);
                }
                
                return redirect()->route('dashboard')->withErrors([
                    'position' => 'Your staff position is not assigned. Please contact administrator.'
                ]);
            }

            // Check license requirements for dentists
            if ($request->user()->position === 'dentist') {
                if (empty($request->user()->license_number)) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Dental license required. Please contact administrator.',
                            'error_code' => 'LICENSE_MISSING'
                        ], 403);
                    }
                    
                    return redirect()->route('profile.edit')->withErrors([
                        'license' => 'Your dental license information is required.'
                    ]);
                }

                // Check if license is expired
                if ($request->user()->license_expiry && $request->user()->license_expiry->isPast()) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Your dental license has expired. Please contact administrator.',
                            'error_code' => 'LICENSE_EXPIRED'
                        ], 403);
                    }
                    
                    return redirect()->route('dashboard')->withErrors([
                        'license' => 'Your dental license has expired. Please update your credentials.'
                    ]);
                }
            }
        }

        if ($role === 'patient') {
            // Ensure patient record exists
            $request->user()->ensurePatientRecord();

            // Check if patient profile is complete enough for appointments
            $patient = $request->user()->patient;
            if ($patient && (empty($patient->emergency_contact_name) || $patient->emergency_contact_name === 'To be updated')) {
                // Allow access but show warning for incomplete profile
                session()->flash('warning', 'Please complete your patient profile for better service.');
            }
        }

        return $next($request);
    }

    /**
     * Handle multiple roles (for routes that allow multiple roles).
     */
    public function handleMultiple(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required',
                    'error_code' => 'UNAUTHENTICATED'
                ], 401);
            }
            return redirect()->route('login');
        }

        // Check if user account is active
        if ($request->user()->status !== 'active') {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been suspended.',
                    'error_code' => 'ACCOUNT_SUSPENDED'
                ], 403);
            }
            
            auth()->logout();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been suspended.'
            ]);
        }

        // Check if user has any of the required roles
        if (!in_array($request->user()->role, $roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient permissions',
                    'error_code' => 'INSUFFICIENT_PERMISSIONS',
                    'required_roles' => $roles,
                    'user_role' => $request->user()->role
                ], 403);
            }
            
            // Redirect based on user's actual role
            return match($request->user()->role) {
                'admin' => redirect()->route('admin.dashboard'),
                'staff' => redirect()->route('staff.dashboard'),
                'patient' => redirect()->route('patient.dashboard'),
                default => redirect()->route('dashboard')
            };
        }

        return $next($request);
    }

    /**
     * Check if user has permission for specific dental clinic actions
     */
    public function checkPermission(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        $user = $request->user();
        
        // Define permissions for each role
        $permissions = [
            'admin' => [
                'manage_users',
                'manage_staff',
                'manage_patients', 
                'view_all_appointments',
                'manage_services',
                'view_financial_records',
                'manage_schedules',
                'view_reports',
                'manage_system_settings'
            ],
            'staff' => [
                'view_patients',
                'create_appointments',
                'edit_appointments',
                'view_patient_records',
                'create_patient_records',
                'edit_patient_records',
                'view_treatment_plans',
                'create_treatment_plans',
                'edit_treatment_plans',
                'manage_own_schedule',
                'view_own_appointments'
            ],
            'patient' => [
                'view_own_profile',
                'edit_own_profile',
                'view_own_appointments',
                'request_appointments',
                'view_own_records',
                'view_own_treatment_plans',
                'view_own_financial_records'
            ]
        ];

        // Check if user's role has the required permission
        if (!isset($permissions[$user->role]) || !in_array($permission, $permissions[$user->role])) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to perform this action.',
                    'error_code' => 'PERMISSION_DENIED',
                    'required_permission' => $permission
                ], 403);
            }
            
            return back()->with('error', 'You do not have permission to perform this action.');
        }

        return $next($request);
    }

    /**
     * Check if staff member can access patient data
     */
    public function checkPatientAccess(Request $request, Closure $next, $patientId = null): Response
    {
        if (!$request->user() || !$request->user()->isStaff()) {
            return redirect()->route('login');
        }

        $user = $request->user();

        // Admin can access all patient data
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Staff can only access patients they have appointments with or have treated
        if ($patientId) {
            $hasAccess = $user->doctorAppointments()
                ->where('patient_id', $patientId)
                ->exists() || 
                $user->createdPatientRecords()
                ->where('patient_id', $patientId)
                ->exists();

            if (!$hasAccess) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have access to this patient\'s data.',
                        'error_code' => 'PATIENT_ACCESS_DENIED'
                    ], 403);
                }
                
                return back()->with('error', 'You do not have access to this patient\'s data.');
            }
        }

        return $next($request);
    }

    /**
     * Check if user can manage appointments
     */
    public function checkAppointmentManagement(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        $user = $request->user();

        // Admin and staff can manage appointments
        if ($user->isAdmin() || $user->isStaff()) {
            return $next($request);
        }

        // Patients can only view/manage their own appointments
        if ($user->isPatient()) {
            $appointmentId = $request->route('appointment')?->id ?? $request->input('appointment_id');
            
            if ($appointmentId) {
                $appointment = \App\Models\Appointment::find($appointmentId);
                
                if (!$appointment || $appointment->patient_id !== $user->id) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You can only manage your own appointments.',
                            'error_code' => 'APPOINTMENT_ACCESS_DENIED'
                        ], 403);
                    }
                    
                    return back()->with('error', 'You can only manage your own appointments.');
                }
            }
            
            return $next($request);
        }

        return back()->with('error', 'Insufficient permissions.');
    }
}