<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TreatmentPlanController;
use App\Http\Controllers\PatientRecordController;
use App\Http\Controllers\FinancialRecordController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\DashboardController;

// ================================
// PUBLIC API ROUTES (NO AUTH REQUIRED)
// ================================
Route::prefix('v1/public')->group(function () {
    
    // Health check endpoint
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now(),
            'service' => 'Smart Medical Clinic API'
        ]);
    });

    // Public service information (for website display)
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);
    
    // Available appointment slots (for booking widget)
    Route::get('/appointments/available-slots', [AppointmentController::class, 'getAvailableSlots']);
    
});

// ================================
// PROTECTED API ROUTES (REQUIRE AUTH)
// ================================
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    
    // ================================
    // ADMIN ONLY ROUTES
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
        
        // User Management (Admin only)
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::get('/stats', [UserController::class, 'getStats']);
            Route::get('/role/{role}', [UserController::class, 'getUsersByRole']);
            Route::post('/bulk-update', [UserController::class, 'bulkUpdate']);
            Route::put('/{id}', [UserController::class, 'update']);
            Route::patch('/{id}', [UserController::class, 'update']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
            Route::get('/{id}/activity', [UserController::class, 'getActivitySummary']);
            Route::patch('/{user}/activate', [UserController::class, 'activate']);
            Route::patch('/{user}/deactivate', [UserController::class, 'deactivate']);
            Route::patch('/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::post('/bulk-update-status', [UserController::class, 'bulkUpdateStatus']);
            Route::get('/export-data/{user}', [UserController::class, 'exportData']);
        });

        // Staff Management (Admin only)
        Route::prefix('staff')->group(function () {
            Route::get('/', [StaffController::class, 'index']);
            Route::post('/', [StaffController::class, 'store']);
            Route::get('/{staff}', [StaffController::class, 'show']);
            Route::patch('/{staff}', [StaffController::class, 'update']);
            Route::put('/{staff}', [StaffController::class, 'update']);
            Route::delete('/{staff}', [StaffController::class, 'destroy']);
        });

        // System Administration
        Route::prefix('admin')->group(function () {
            Route::get('/dashboard-stats', [DashboardController::class, 'adminDashboard']);
            Route::get('/system-health', [DashboardController::class, 'getSystemHealth']);
            Route::get('/analytics', [DashboardController::class, 'getSystemAnalytics']);
            Route::get('/user-activity', [DashboardController::class, 'getUserActivity']);
            Route::get('/financial-summary', [DashboardController::class, 'getFinancialSummary']);
            Route::post('/backup-system', [DashboardController::class, 'backupSystem']);
        });

        // Data Export (Admin only)
        Route::prefix('export')->group(function () {
            Route::get('/patients', function (Request $request) {
                $patients = \App\Models\User::where('role', 'patient')
                    ->with(['patient', 'patientAppointments', 'patientRecords'])
                    ->get();
                
                return response()->json($patients)
                    ->header('Content-Disposition', 'attachment; filename=patients_' . now()->format('Y-m-d') . '.json');
            });

            Route::get('/financial-records', function (Request $request) {
                $startDate = $request->input('start_date', now()->startOfMonth());
                $endDate = $request->input('end_date', now()->endOfMonth());
                
                $records = \App\Models\FinancialRecord::with(['patient', 'appointment'])
                    ->whereBetween('transaction_date', [$startDate, $endDate])
                    ->get();
                
                return response()->json($records)
                    ->header('Content-Disposition', 'attachment; filename=financial_records_' . now()->format('Y-m-d') . '.json');
            });
        });
    });

    // ================================
    // STAFF SPECIFIC ROUTES (Doctors, Nurses, etc.)
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':staff'])->group(function () {
        
        // Staff Dashboard
        Route::prefix('staff')->group(function () {
            Route::get('/dashboard-stats', [DashboardController::class, 'staffDashboard']);
            Route::get('/my-appointments', [AppointmentController::class, 'getStaffAppointments']);
            Route::get('/my-patients', [PatientController::class, 'getStaffPatients']);
            Route::get('/my-schedule', [ScheduleController::class, 'getMySchedule']);
            Route::get('/performance', [StaffController::class, 'getMyPerformance']);
        });

        // Patient Records Management
        Route::prefix('patient-records')->group(function () {
            Route::get('/', [PatientRecordController::class, 'index']);
            Route::post('/', [PatientRecordController::class, 'store']);
            Route::get('/{patientRecord}', [PatientRecordController::class, 'show']);
            Route::patch('/{patientRecord}', [PatientRecordController::class, 'update']);
            Route::put('/{patientRecord}', [PatientRecordController::class, 'update']);
            Route::delete('/{patientRecord}', [PatientRecordController::class, 'destroy']);
        });

        // Treatment Plan Management
        Route::prefix('treatment-plans')->group(function () {
            Route::get('/', [TreatmentPlanController::class, 'index']);
            Route::post('/', [TreatmentPlanController::class, 'store']);
            Route::get('/{treatmentPlan}', [TreatmentPlanController::class, 'show']);
            Route::patch('/{treatmentPlan}', [TreatmentPlanController::class, 'update']);
            Route::put('/{treatmentPlan}', [TreatmentPlanController::class, 'update']);
            Route::delete('/{treatmentPlan}', [TreatmentPlanController::class, 'destroy']);
            Route::post('/{treatmentPlan}/approve', [TreatmentPlanController::class, 'approve']);
            Route::post('/{treatmentPlan}/start', [TreatmentPlanController::class, 'start']);
            Route::post('/{treatmentPlan}/complete', [TreatmentPlanController::class, 'complete']);
        });
    });

    // ================================
    // PATIENT SPECIFIC ROUTES
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':patient'])->group(function () {
        
        // Patient Dashboard
        Route::prefix('patient')->group(function () {
            Route::get('/dashboard-stats', [DashboardController::class, 'patientDashboard']);
            Route::get('/my-appointments', [AppointmentController::class, 'getMyAppointments']);
            Route::get('/my-records', [PatientRecordController::class, 'getMyRecords']);
            Route::get('/my-treatment-plans', [TreatmentPlanController::class, 'getMyTreatmentPlans']);
            Route::get('/my-billing', [FinancialRecordController::class, 'getMyBilling']);
        });
    });

    // ================================
    // SHARED ROUTES (Admin + Staff access)
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
        
        // Patient Management
        Route::prefix('patients')->group(function () {
            Route::get('/', [PatientController::class, 'index']);
            Route::post('/', [PatientController::class, 'store']);
            Route::get('/{patient}', [PatientController::class, 'show']);
            Route::patch('/{patient}', [PatientController::class, 'update']);
            Route::put('/{patient}', [PatientController::class, 'update']);
            Route::delete('/{patient}', [PatientController::class, 'destroy']);
        });

        // Appointment Management - CRITICAL FOR YOUR ISSUE
        Route::prefix('appointments')->group(function () {
            Route::get('/', [AppointmentController::class, 'index']);
            Route::post('/', [AppointmentController::class, 'store']);
            Route::get('/{appointment}', [AppointmentController::class, 'show']);
            Route::patch('/{appointment}', [AppointmentController::class, 'update']); // PATCH method
            Route::put('/{appointment}', [AppointmentController::class, 'update']);   // PUT method
            Route::delete('/{appointment}', [AppointmentController::class, 'destroy']);
            Route::post('/{appointment}/check-in', [AppointmentController::class, 'checkIn']);
            Route::post('/{appointment}/complete', [AppointmentController::class, 'complete']);
            Route::post('/{appointment}/cancel', [AppointmentController::class, 'cancel']);
        });

        // Service Management
        Route::prefix('services')->group(function () {
            Route::get('/', [ServiceController::class, 'index']);
            Route::post('/', [ServiceController::class, 'store']);
            Route::get('/{service}', [ServiceController::class, 'show']);
            Route::patch('/{service}', [ServiceController::class, 'update']);
            Route::put('/{service}', [ServiceController::class, 'update']);
            Route::delete('/{service}', [ServiceController::class, 'destroy']);
        });

        // Financial Records Management
        Route::prefix('financial-records')->group(function () {
            Route::get('/', [FinancialRecordController::class, 'index']);
            Route::post('/', [FinancialRecordController::class, 'store']);
            Route::get('/{financialRecord}', [FinancialRecordController::class, 'show']);
            Route::patch('/{financialRecord}', [FinancialRecordController::class, 'update']);
            Route::put('/{financialRecord}', [FinancialRecordController::class, 'update']);
            Route::delete('/{financialRecord}', [FinancialRecordController::class, 'destroy']);
            Route::post('/{financialRecord}/mark-as-paid', [FinancialRecordController::class, 'markAsPaid']);
            Route::get('/reports/summary', [FinancialRecordController::class, 'reports']);
        });

        // Schedule Management
        Route::prefix('schedules')->group(function () {
            Route::get('/', [ScheduleController::class, 'index']);
            Route::post('/', [ScheduleController::class, 'store']);
            Route::get('/{schedule}', [ScheduleController::class, 'show']);
            Route::patch('/{schedule}', [ScheduleController::class, 'update']);
            Route::put('/{schedule}', [ScheduleController::class, 'update']);
            Route::delete('/{schedule}', [ScheduleController::class, 'destroy']);
            Route::post('/{schedule}/make-unavailable', [ScheduleController::class, 'makeUnavailable']);
            Route::post('/{schedule}/make-available', [ScheduleController::class, 'makeAvailable']);
        });

        // Reports (Admin and Staff only)
        Route::prefix('reports')->group(function () {
            Route::get('/', [ReportsController::class, 'index']);
            Route::get('/financial', [ReportsController::class, 'financial']);
            Route::get('/appointments', [ReportsController::class, 'appointments']);
            Route::get('/patients', [ReportsController::class, 'patients']);
            Route::get('/staff', [ReportsController::class, 'staff']);
            Route::get('/audit', [ReportsController::class, 'audit']);
        });

        // Export appointments (Admin and Staff)
        Route::get('/export/appointments', function (Request $request) {
            $startDate = $request->input('start_date', now()->startOfMonth());
            $endDate = $request->input('end_date', now()->endOfMonth());
            
            $appointments = \App\Models\Appointment::with(['patient', 'doctor', 'service'])
                ->whereBetween('appointment_date', [$startDate, $endDate])
                ->get();
            
            return response()->json($appointments)
                ->header('Content-Disposition', 'attachment; filename=appointments_' . now()->format('Y-m-d') . '.json');
        });
    });

    // ================================
    // GENERAL ROUTES (All authenticated users)
    // ================================
    
    // User profile and authentication
    Route::get('/user', function (Request $request) {
        return $request->user()->load('patient', 'notifications');
    });

    // User Profile Management
    Route::prefix('users')->group(function () {
        Route::get('/profile', [UserController::class, 'profile']);
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::patch('/profile', [UserController::class, 'updateProfile']);
        Route::post('/change-password', [UserController::class, 'changePassword']);
        Route::get('/search', [UserController::class, 'search']);
        Route::get('/notifications', [UserController::class, 'notifications']);
        Route::post('/notifications/mark-read', [UserController::class, 'markNotificationsRead']);
        Route::patch('/preferences', [UserController::class, 'updatePreferences']);
        Route::get('/{id}', [UserController::class, 'show']);
    });

    // Notification Management
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::patch('/{notification}/mark-unread', [NotificationController::class, 'markAsUnread']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        Route::get('/unread-count', [NotificationController::class, 'getUnreadCount']);
        Route::get('/recent', [NotificationController::class, 'getRecent']);
    });

    // Dashboard Routes (Role-based filtering applied in controller)
    Route::prefix('dashboard')->group(function () {
        Route::get('/data', [DashboardController::class, 'index']);
        Route::get('/stats', [DashboardController::class, 'getStats']);
        Route::get('/recent-activity', [DashboardController::class, 'getRecentActivity']);
        Route::get('/alerts', [DashboardController::class, 'getAlerts']);
    });

    // Available appointment slots (authenticated users)
    Route::get('/appointments/available-slots', [AppointmentController::class, 'getAvailableSlots']);

    // System Status
    Route::prefix('system')->group(function () {
        Route::get('/status', [DashboardController::class, 'getSystemStatus']);
        Route::get('/version', [DashboardController::class, 'getSystemVersion']);
    });

    // Bulk Operations (Admin only)
    Route::prefix('bulk')->middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
        
        // Bulk appointment actions
        Route::post('/appointments/cancel', function (Request $request) {
            $request->validate([
                'appointment_ids' => 'required|array',
                'appointment_ids.*' => 'exists:appointments,id',
                'reason' => 'nullable|string'
            ]);

            $count = 0;
            foreach ($request->appointment_ids as $id) {
                $appointment = \App\Models\Appointment::find($id);
                if ($appointment && $appointment->canCancel()) {
                    $appointment->cancel($request->reason);
                    $count++;
                }
            }

            return response()->json(['cancelled_count' => $count]);
        });

        // Bulk notification creation
        Route::post('/notifications/create', function (Request $request) {
            $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:appointment,reminder,treatment,system'
            ]);

            $notifications = [];
            foreach ($request->user_ids as $userId) {
                $notifications[] = [
                    'user_id' => $userId,
                    'title' => $request->title,
                    'message' => $request->message,
                    'type' => $request->type,
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            \App\Models\Notification::insert($notifications);

            return response()->json(['created_count' => count($notifications)]);
        });
    });
});

// ================================
// WEBHOOK ROUTES (No authentication, but should be secured with tokens in production)
// ================================
Route::prefix('webhooks')->group(function () {
    
    // Payment provider webhook
    Route::post('/payment-received', function (Request $request) {
        return response()->json(['status' => 'received']);
    });

    // SMS provider webhook
    Route::post('/sms-status', function (Request $request) {
        return response()->json(['status' => 'received']);
    });

    // Email provider webhook
    Route::post('/email-status', function (Request $request) {
        return response()->json(['status' => 'received']);
    });
});

// ================================
// FALLBACK ROUTE
// ================================
Route::fallback(function () {
    return response()->json([
        'error' => 'API endpoint not found',
        'message' => 'The requested API endpoint does not exist.'
    ], 404);
});