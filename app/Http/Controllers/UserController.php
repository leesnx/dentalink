<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of all users (Admin only)
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Optional filters
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%$search%")
                ->orWhere('email', 'like', "%$search%");
        }

        if ($request->has('role') && $request->role !== '') {
            $query->where('role', $request->role);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        // Stats
        $stats = [
            'total_users' => User::count(),
            'total_patients' => User::where('role', 'patient')->count(),
            'total_staff' => User::where('role', 'staff')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'active_users' => User::where('status', 'active')->count(),
            'inactive_users' => User::where('status', 'inactive')->count(),
        ];

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'users' => $users,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Users/Index', [
            'users' => $users,
            'stats' => $stats,
        ]);
    }



    public function store(Request $request)
{
    $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255|unique:users',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string|max:500',
        'role' => 'required|in:admin,staff,patient',
        'status' => 'sometimes|required|in:active,inactive',
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
        
        // Staff-specific fields
        'employee_id' => 'nullable|string|unique:users,employee_id',
        'position' => 'nullable|in:dentist,hygienist,receptionist,assistant',
        'license_number' => 'nullable|string|max:100',
        'license_expiry' => 'nullable|date',
        'hire_date' => 'nullable|date|before_or_equal:today',
        'hourly_rate' => 'nullable|numeric|min:0',
        'specializations' => 'nullable|array',
        'bio' => 'nullable|string',
        'years_experience' => 'nullable|integer|min:0',
        
        // Patient-specific fields
        'birthday' => 'nullable|date',
        'gender' => 'nullable|in:male,female,other',
        'emergency_contact_name' => 'nullable|string|max:255',
        'emergency_contact_phone' => 'nullable|string|max:20',
        'emergency_contact_relationship' => 'nullable|string|max:100',
        'insurance_provider' => 'nullable|string|max:255',
        'insurance_number' => 'nullable|string|max:100',
        'medical_history' => 'nullable|string',
        'allergies' => 'nullable|string',
        'current_medications' => 'nullable|string',
        'blood_type' => 'nullable|string|max:10',
    ];

    // Normalize specializations if it's a string
    if ($request->has('specializations') && is_string($request->specializations)) {
        $request->merge([
            'specializations' => array_values(array_filter(array_map('trim', explode(',', $request->specializations))))
        ]);
    }

    $validated = $request->validate($rules);

    // Create the user
    $userData = [
        'name' => $validated['name'],
        'email' => $validated['email'],
        'phone' => $validated['phone'] ?? null,
        'address' => $validated['address'] ?? null,
        'role' => $validated['role'],
        'status' => $validated['status'] ?? 'active',
        'password' => Hash::make($validated['password']),
    ];

    // Add staff-specific fields if role is staff
    if ($validated['role'] === 'staff') {
        $userData = array_merge($userData, [
            'employee_id' => $validated['employee_id'] ?? null,
            'position' => $validated['position'] ?? null,
            'license_number' => $validated['license_number'] ?? null,
            'license_expiry' => $validated['license_expiry'] ?? null,
            'hire_date' => $validated['hire_date'] ?? null,
            'hourly_rate' => $validated['hourly_rate'] ?? null,
            'specializations' => $validated['specializations'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'years_experience' => $validated['years_experience'] ?? null,
        ]);
    }

    $user = User::create($userData);

    // Create patient record if role is patient
    if ($validated['role'] === 'patient') {
        $user->patient()->create([
            'birthday' => $validated['birthday'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
            'emergency_contact_relationship' => $validated['emergency_contact_relationship'] ?? null,
            'insurance_provider' => $validated['insurance_provider'] ?? null,
            'insurance_number' => $validated['insurance_number'] ?? null,
            'medical_history' => $validated['medical_history'] ?? null,
            'allergies' => $validated['allergies'] ?? null,
            'current_medications' => $validated['current_medications'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
        ]);
    }

    AuditLog::logCreate(Auth::id(), Auth::user()->role, 'users', $user->id, [
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'created_by_admin' => true,
    ]);

    // Handle both API and web requests
    if ($request->expectsJson() || $request->wantsJson()) {
        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user->fresh()->load($user->role === 'patient' ? 'patient' : [])
        ], 201);
    }

    return redirect()->route('users.show', $user)
        ->with('success', 'User created successfully.');
}


    /**
     * Display the user's profile page
     */
    public function profile()
    {
        $user = Auth::user();
        
        // Load patient relationship if user is a patient
        if ($user->isPatient()) {
            $user->load('patient');
        }

        $recentActivities = AuditLog::where('performed_by', $user->id)
            ->where('timestamp', '>=', now()->subDays(30))
            ->limit(10)
            ->orderBy('timestamp', 'desc')
            ->get();

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return Inertia::render('Profile/Show', [
            'user' => $user,
            'recentActivities' => $recentActivities,
            'unreadNotifications' => $unreadNotifications,
        ]);
    }

    /**
     * Show the form for editing the user's profile
     */
    public function editProfile()
    {
        $user = Auth::user();
        
        // Load patient relationship if user is a patient
        if ($user->isPatient()) {
            $user->load('patient');
        }

        return Inertia::render('Profile/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the user's profile information
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user->update($validated);

        AuditLog::logUpdate($user->id, $user->role, 'users', $user->id, [
            'action' => 'profile_updated',
            'updated_fields' => array_keys($validated),
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => $user->fresh()
            ]);
        }

        return redirect()->route('profile.show')
            ->with('success', 'Profile updated successfully.');
    }

    /**
     * Show the form for changing password
     */
    public function editPassword()
    {
        return Inertia::render('Profile/EditPassword');
    }

    /**
     * Update the user's password
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = Auth::user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLog::logUpdate($user->id, $user->role, 'users', $user->id, [
            'action' => 'password_changed',
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Password updated successfully.'
            ]);
        }

        return redirect()->route('profile.show')
            ->with('success', 'Password updated successfully.');
    }

    /**
     * Show a specific user (Admin/Staff only)
     */
    public function show(User $user)
    {
        // Load relationships based on user role
        $relationships = [];
        if ($user->isPatient()) {
            $relationships[] = 'patient';
        }
        
        if (!empty($relationships)) {
            $user->load($relationships);
        }

        $stats = [
            'total_appointments' => $user->isPatient() 
                ? $user->patientAppointments()->count() 
                : ($user->isStaff() ? $user->doctorAppointments()->count() : 0),
            'completed_appointments' => $user->isPatient()
                ? $user->patientAppointments()->where('status', 'completed')->count()
                : ($user->isStaff() ? $user->doctorAppointments()->where('status', 'completed')->count() : 0),
            'upcoming_appointments' => $user->isPatient()
                ? $user->patientAppointments()->where('appointment_date', '>=', now())->where('status', '!=', 'cancelled')->count()
                : ($user->isStaff() ? $user->doctorAppointments()->where('appointment_date', '>=', now())->where('status', '!=', 'cancelled')->count() : 0),
            'unread_notifications' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
        ];

        if ($user->isPatient()) {
            $stats['total_records'] = $user->patientRecords()->count();
            $stats['active_treatment_plans'] = $user->patientTreatmentPlans()->whereIn('status', ['approved', 'in_progress'])->count();
        } elseif ($user->isStaff()) {
            $stats['patients_treated'] = $user->doctorAppointments()->distinct('patient_id')->count();
            $stats['records_created'] = $user->createdPatientRecords()->count();
        }

        $recentActivities = AuditLog::where('performed_by', $user->id)
            ->where('timestamp', '>=', now()->subDays(30))
            ->limit(15)
            ->orderBy('timestamp', 'desc')
            ->get();

        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json([
                'user' => $user,
                'stats' => $stats,
                'recentActivities' => $recentActivities,
            ]);
        }

        return Inertia::render('Users/Show', [
            'user' => $user,
            'stats' => $stats,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Show the form for editing a user (Admin only)
     */
    public function edit(User $user)
    {
        if ($user->isPatient()) {
            $user->load('patient');
        }

        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update a user (Admin only)
     */
    public function update(Request $request, User $user)
    {
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes','required','email','max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'role' => 'sometimes|required|in:admin,staff,patient',
            'status' => 'sometimes|required|in:active,inactive',
            'employee_id' => 'sometimes|nullable|string|unique:users,employee_id,' . $user->id,
            'position' => 'sometimes|nullable|in:dentist,hygienist,receptionist,assistant',
            'license_number' => 'sometimes|nullable|string|max:100',
            'license_expiry' => 'sometimes|nullable|date',
            'hire_date' => 'sometimes|nullable|date|before_or_equal:today',
            'hourly_rate' => 'sometimes|nullable|numeric|min:0',
            'specializations' => 'sometimes|nullable|array',
            'bio' => 'sometimes|nullable|string',
            'years_experience' => 'sometimes|nullable|integer|min:0',
        ];

        // Normalize kung sakaling string ang specializations (e.g., "ortho,perio")
        if ($request->has('specializations') && is_string($request->specializations)) {
            $request->merge([
                'specializations' => array_values(array_filter(array_map('trim', explode(',', $request->specializations))))
            ]);
        }

        $validated = $request->validate($rules);

        // Kung hindi staff ang role, alisin ang staff-only fields (safe kahit wala sila)
        if (($validated['role'] ?? $user->role) !== 'staff') {
            unset(
                $validated['employee_id'], $validated['position'], $validated['license_number'],
                $validated['license_expiry'], $validated['hire_date'], $validated['hourly_rate'],
                $validated['specializations'], $validated['bio'], $validated['years_experience']
            );
        }

        $user->update($validated);

        // Ensure patient record kapag naging patient
        if (($validated['role'] ?? $user->role) === 'patient' && !$user->patient()->exists()) {
            $user->ensurePatientRecord();
        }

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'users', $user->id, [
            'updated_fields' => array_keys($validated),
            'updated_by_admin' => true,
        ]);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->fresh()
        ]);
    }


    /**
     * Activate a user (Admin only)
     */
    public function activate(User $user)
    {
        $user->update(['status' => 'active']);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'users', $user->id, [
            'action' => 'activated',
        ]);

        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json([
                'message' => 'User activated successfully.',
                'user' => $user->fresh()
            ]);
        }

        return back()->with('success', 'User activated successfully.');
    }

    /**
     * Deactivate a user (Admin only)
     */
    public function deactivate(User $user)
    {
        $user->update(['status' => 'inactive']);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'users', $user->id, [
            'action' => 'deactivated',
        ]);

        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json([
                'message' => 'User deactivated successfully.',
                'user' => $user->fresh()
            ]);
        }

        return back()->with('success', 'User deactivated successfully.');
    }

    /**
     * Reset user password (Admin only)
     */
    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'users', $user->id, [
            'action' => 'password_reset_by_admin',
        ]);

        // Create notification for user
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Password Reset',
            'message' => 'Your password has been reset by an administrator. Please log in with your new password.',
            'type' => 'system',
            'is_read' => false,
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Password reset successfully.'
            ]);
        }

        return back()->with('success', 'Password reset successfully.');
    }

    /**
     * Delete a user (Admin only)
     */
    public function destroy(User $user)
    {
        // Prevent deletion if user has related data
        if ($user->isPatient() && $user->patientAppointments()->exists()) {
            $errorMessage = 'Cannot delete user with existing appointments.';
            
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json(['message' => $errorMessage], 422);
            }
            
            return back()->with('error', $errorMessage);
        }

        if ($user->isStaff() && $user->doctorAppointments()->exists()) {
            $errorMessage = 'Cannot delete staff member with existing appointments.';
            
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json(['message' => $errorMessage], 422);
            }
            
            return back()->with('error', $errorMessage);
        }

        AuditLog::logDelete(Auth::id(), Auth::user()->role, 'users', $user->id, [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);

        // Delete related patient record if exists
        if ($user->patient()->exists()) {
            $user->patient()->delete();
        }

        $user->delete();

        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json(['message' => 'User deleted successfully.']);
        }

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Get user activity summary
     */
    public function activitySummary(User $user)
    {
        $activities = AuditLog::where('performed_by', $user->id)
            ->selectRaw('action, COUNT(*) as count, MAX(timestamp) as last_performed')
            ->groupBy('action')
            ->orderBy('count', 'desc')
            ->get();

        $recentSessions = AuditLog::where('performed_by', $user->id)
            ->whereIn('action', ['login', 'logout'])
            ->orderBy('timestamp', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'activities' => $activities,
            'recentSessions' => $recentSessions,
        ]);
    }

    /**
     * Bulk update user status (Admin only)
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'status' => 'required|in:active,inactive',
        ]);

        $updatedCount = User::whereIn('id', $validated['user_ids'])
            ->update(['status' => $validated['status']]);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'users', null, [
            'action' => 'bulk_status_update',
            'affected_users' => $validated['user_ids'],
            'new_status' => $validated['status'],
            'count' => $updatedCount,
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => "{$updatedCount} users updated successfully.",
                'count' => $updatedCount
            ]);
        }

        return back()->with('success', "{$updatedCount} users updated successfully.");
    }

    /**
     * Search users (AJAX endpoint)
     */
    public function search(Request $request)
    {
        $search = $request->input('q');
        $role = $request->input('role');
        $limit = $request->input('limit', 10);

        $users = User::when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($role, function ($query, $role) {
                return $query->where('role', $role);
            })
            ->active()
            ->limit($limit)
            ->get(['id', 'name', 'email', 'role']);

        return response()->json($users);
    }

    /**
     * Get user notifications
     */
    public function notifications(Request $request)
    {
        $user = Auth::user();
        $limit = $request->input('limit', 10);

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markNotificationsRead()
    {
        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json(['success' => true]);
    }

    /**
     * Export user data (for GDPR compliance)
     */
    public function exportData(User $user)
    {
        // Load relationships for complete data export
        $userData = [
            'personal_info' => $user->toArray(),
            'appointments' => $user->isPatient() 
                ? $user->patientAppointments()->get()->toArray()
                : ($user->isStaff() ? $user->doctorAppointments()->get()->toArray() : []),
            'notifications' => Notification::where('user_id', $user->id)->get()->toArray(),
            'audit_logs' => AuditLog::where('performed_by', $user->id)->get()->toArray(),
        ];

        if ($user->isPatient()) {
            $userData['patient_info'] = $user->patient ? $user->patient->toArray() : null;
            $userData['medical_records'] = $user->patientRecords()->get()->toArray();
            $userData['treatment_plans'] = $user->patientTreatmentPlans()->get()->toArray();
            $userData['financial_records'] = $user->financialRecords()->get()->toArray();
        }

        $fileName = "user_data_{$user->id}_" . now()->format('Y-m-d_H-i-s') . ".json";
        
        return response()->json($userData)
            ->header('Content-Disposition', "attachment; filename={$fileName}");
    }
}