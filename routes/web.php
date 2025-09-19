<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DashboardController;
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
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Default dashboard route - redirect based on medical clinic roles
Route::get('/dashboard', function () {
    // Check if user is authenticated first
    if (!Auth::check()) {
        return redirect()->route('login');
    }
    
    $user = Auth::user();
    
    if ($user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    } elseif ($user->role === 'staff') {
        return redirect()->route('staff.dashboard');
    } elseif ($user->role === 'patient') {
        return redirect()->route('patient.dashboard');
    }
    
    // Default fallback dashboard
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    
    // ================================
    // ADMIN ROUTES - System Administration for Smart Medical Clinic
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
        Route::get('/admin/dashboard', function () {
            return Inertia::render('Admin/Dashboard');
        })->name('admin.dashboard');
        
        Route::get('/admin/analytics', function () {
            return Inertia::render('Admin/Analytics');
        })->name('admin.analytics');
        
        // User Management
        Route::get('/admin/users', function () {
            return Inertia::render('Admin/Users/Index');
        })->name('admin.users');
        
        // Staff Management
        Route::get('/admin/staff', function () {
            return Inertia::render('Admin/Staff/Index');
        })->name('admin.staff');
        
        // Patients Overview
        Route::get('/admin/patients', function () {
            return Inertia::render('Admin/Patients/Index');
        })->name('admin.patients');
        
        // Appointments Management
        Route::get('/admin/appointments', function () {
            return Inertia::render('Admin/Appointments/Index');
        })->name('admin.appointments');
        
        // Financial Management
        Route::get('/admin/financial', function () {
            return Inertia::render('Admin/Financial/Index');
        })->name('admin.financial');
        
        // Services Management
        Route::get('/admin/services', function () {
            return Inertia::render('Admin/Services/Index');
        })->name('admin.services');
        
        // System Monitoring
        Route::get('/admin/monitoring', function () {
            return Inertia::render('Admin/SystemMonitoring');
        })->name('admin.monitoring');

        // Reports
        Route::get('/admin/reports', function () {
            return Inertia::render('Admin/Reports');
        })->name('admin.reports');
        
        // System Settings
        Route::get('/admin/settings', function () {
            return Inertia::render('Admin/Settings/Index');
        })->name('admin.settings');
        
        // System Security
        Route::get('/admin/security', function () {
            return Inertia::render('Admin/Security/Index');
        })->name('admin.security');
        
        // Audit Logs
        Route::get('/admin/audit', function () {
            return Inertia::render('Admin/Audit/Index');
        })->name('admin.audit');
        
        // ADDITIONAL ADMIN APPOINTMENT ROUTES
        Route::prefix('admin/appointments')->name('admin.appointments.')->group(function () {
            Route::get('/calendar', function () {
                return Inertia::render('Admin/Appointments/Calendar');
            })->name('calendar');
            
            Route::get('/create', function () {
                return Inertia::render('Admin/Appointments/Create');
            })->name('create');
            
            Route::get('/{appointment}', function ($appointment) {
                return Inertia::render('Admin/Appointments/Show', ['appointmentId' => $appointment]);
            })->name('show');
            
            Route::get('/{appointment}/edit', function ($appointment) {
                return Inertia::render('Admin/Appointments/Edit', ['appointmentId' => $appointment]);
            })->name('edit');
        });
    });
    
    // ================================
    // STAFF ROUTES - Medical staff (doctors, nurses, technicians, etc.)
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':staff'])->group(function () {
        Route::get('/staff/dashboard', function () {
            return Inertia::render('Staff/Dashboard');
        })->name('staff.dashboard');
        
        Route::get('/staff/appointments', function () {
            return Inertia::render('Staff/Appointments/Index');
        })->name('staff.appointments');
        
        Route::get('/staff/patients', function () {
            return Inertia::render('Staff/Patients/Index');
        })->name('staff.patients');
        
        Route::get('/staff/schedule', function () {
            return Inertia::render('Staff/Schedule/Index');
        })->name('staff.schedule');
        
        Route::get('/staff/patient-records', function () {
            return Inertia::render('Staff/PatientRecords/Index');
        })->name('staff.patient-records');
        
        Route::get('/staff/treatment-plans', function () {
            return Inertia::render('Staff/TreatmentPlans/Index');
        })->name('staff.treatment-plans');
        
        Route::get('/staff/performance', function () {
            return Inertia::render('Staff/Performance/Index');
        })->name('staff.performance');

        Route::get('/staff/billing', function () {
            return Inertia::render('Staff/Billing/Index');
        })->name('staff.billing');
        
        // ADDITIONAL STAFF APPOINTMENT ROUTES
        Route::prefix('staff/appointments')->name('staff.appointments.')->group(function () {
            Route::get('/calendar', function () {
                return Inertia::render('Staff/Appointments/Calendar');
            })->name('calendar');
            
            Route::get('/today', function () {
                return Inertia::render('Staff/Appointments/Today');
            })->name('today');
            
            Route::get('/{appointment}', function ($appointment) {
                return Inertia::render('Staff/Appointments/Show', ['appointmentId' => $appointment]);
            })->name('show');
        });
    });

    // ================================
    // PATIENT ROUTES - Patient portal
    // ================================
    Route::middleware([\App\Http\Middleware\CheckRole::class.':patient'])->group(function () {
        Route::get('/patient/dashboard', function () {
            return Inertia::render('Patient/Dashboard');
        })->name('patient.dashboard');
        
        Route::get('/patient/appointments', function () {
            return Inertia::render('Patient/Appointments/Index');
        })->name('patient.appointments');
        
        Route::get('/patient/book-appointment', function () {
            return Inertia::render('Patient/Appointments/Book');
        })->name('patient.book-appointment');
        
        Route::get('/patient/medical-records', function () {
            return Inertia::render('Patient/Records/Index');
        })->name('patient.records');
        
        Route::get('/patient/treatment-plans', function () {
            return Inertia::render('Patient/TreatmentPlans/Index');
        })->name('patient.treatment-plans');
        
        Route::get('/patient/billing', function () {
            return Inertia::render('Patient/Billing/Index');
        })->name('patient.billing');
        
        Route::get('/patient/profile', function () {
            return Inertia::render('Patient/Profile/Edit');
        })->name('patient.profile');
        
        // ADDITIONAL PATIENT APPOINTMENT ROUTES
        Route::prefix('patient/appointments')->name('patient.appointments.')->group(function () {
            Route::get('/history', function () {
                return Inertia::render('Patient/Appointments/History');
            })->name('history');
            
            Route::get('/{appointment}', function ($appointment) {
                return Inertia::render('Patient/Appointments/Show', ['appointmentId' => $appointment]);
            })->name('show');
            
            Route::get('/{appointment}/reschedule', function ($appointment) {
                return Inertia::render('Patient/Appointments/Reschedule', ['appointmentId' => $appointment]);
            })->name('reschedule');
        });
    });

    // ================================
    // RESOURCE ROUTES (Role-based access controlled in controllers or middleware)
    // ================================
    
    // Patient Management (Admin + Staff)
    Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
        Route::resource('patients', PatientController::class);
        
        // Appointment Management
        Route::resource('appointments', AppointmentController::class);
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::post('appointments/{appointment}/check-in', [AppointmentController::class, 'checkIn']);
        Route::post('appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
        Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
        
        // Service Management
        Route::resource('services', ServiceController::class);
        
        // Treatment Plan Management
        Route::resource('treatment-plans', TreatmentPlanController::class);
        Route::post('treatment-plans/{treatmentPlan}/approve', [TreatmentPlanController::class, 'approve'])->name('treatment-plans.approve');
        Route::post('treatment-plans/{treatmentPlan}/start', [TreatmentPlanController::class, 'start'])->name('treatment-plans.start');
        Route::post('treatment-plans/{treatmentPlan}/complete', [TreatmentPlanController::class, 'complete'])->name('treatment-plans.complete');
        
        // Patient Records Management
        Route::resource('patient-records', PatientRecordController::class);
        
        // Financial Records Management
        Route::resource('financial-records', FinancialRecordController::class);
        Route::post('financial-records/{financialRecord}/mark-paid', [FinancialRecordController::class, 'markAsPaid'])->name('financial-records.mark-paid');
        Route::get('financial-reports', [FinancialRecordController::class, 'reports'])->name('financial-records.reports');
        
        // Schedule Management
        Route::resource('schedules', ScheduleController::class);
        Route::post('schedules/{schedule}/make-unavailable', [ScheduleController::class, 'makeUnavailable'])->name('schedules.make-unavailable');
        Route::post('schedules/{schedule}/make-available', [ScheduleController::class, 'makeAvailable'])->name('schedules.make-available');
    });

    // User Management (Admin only)
    Route::middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
        Route::resource('users', UserController::class);
        Route::post('users/{user}/activate', [UserController::class, 'activate'])->name('users.activate');
        Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])->name('users.deactivate');
        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::post('users/bulk-update-status', [UserController::class, 'bulkUpdateStatus'])->name('users.bulk-update-status');
        Route::get('users/{user}/activity', [UserController::class, 'activitySummary'])->name('users.activity');
        Route::get('users/{user}/export-data', [UserController::class, 'exportData'])->name('users.export-data');
    });
        
    // ================================
    // SHARED ROUTES (All authenticated users - access control in controllers)
    // ================================
    
    // Available appointment slots
    Route::get('appointments/available-slots', [AppointmentController::class, 'getAvailableSlots'])->name('appointments.available-slots');
    
    // Appointment calendar data (for all users with proper filtering in controller)
    Route::get('appointments/calendar-data', [AppointmentController::class, 'getCalendarData'])->name('appointments.calendar-data');
    
    // ================================
    // PROFILE ROUTES (All authenticated users)
    // ================================
    Route::get('/profile', function () {
        $user = Auth::user();
        
        if ($user->role === 'admin') {
            return Inertia::render('Admin/Profile');
        } elseif ($user->role === 'staff') {
            return Inertia::render('Staff/Profile');
        } elseif ($user->role === 'patient') {
            return redirect()->route('patient.profile');
        }
        
        return Inertia::render('Profile/Edit');
    })->name('profile.show');
    
    Route::get('/profile/edit', [UserController::class, 'editProfile'])->name('profile.edit');
    Route::patch('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    Route::get('/profile/password', [UserController::class, 'editPassword'])->name('profile.password.edit');
    Route::patch('/profile/password', [UserController::class, 'updatePassword'])->name('profile.password.update');
    Route::patch('/profile/preferences', [UserController::class, 'updatePreferences'])->name('profile.preferences.update');
    
    // ================================
    // NOTIFICATION ROUTES (All authenticated users)
    // ================================
    Route::resource('notifications', NotificationController::class)->only(['index', 'destroy']);
    Route::post('notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::post('notifications/{notification}/mark-unread', [NotificationController::class, 'markAsUnread'])->name('notifications.mark-unread');
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    
    // ================================
    // REPORTS ROUTES (Admin and Staff only)
    // ================================
    Route::prefix('reports')->middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->name('reports.')->group(function () {
        Route::get('/', [ReportsController::class, 'index'])->name('index');
        Route::get('/financial', [ReportsController::class, 'financial'])->name('financial');
        Route::get('/appointments', [ReportsController::class, 'appointments'])->name('appointments');
        Route::get('/patients', [ReportsController::class, 'patients'])->name('patients');
        Route::get('/staff', [ReportsController::class, 'staff'])->name('staff');
        Route::get('/audit', [ReportsController::class, 'audit'])->name('audit');
    });
    
    // ================================
    // API ROUTES FOR FRONTEND (JSON responses)
    // ================================
    Route::prefix('api')->group(function () {
        
        // ================================
        // DASHBOARD API ROUTES - UPDATED SECTION
        // ================================
        
        // Main dashboard data (role-based filtering in controller)
        Route::get('/dashboard/data', [DashboardController::class, 'index'])->name('api.dashboard.data');
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats'])->name('api.dashboard.stats');
        Route::get('/dashboard/alerts', [DashboardController::class, 'getAlerts'])->name('api.dashboard.alerts');
        Route::get('/dashboard/recent-activity', [DashboardController::class, 'getRecentActivity'])->name('api.dashboard.recent-activity');
        
        // Role-specific dashboard endpoints
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
            Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard'])->name('api.dashboard.admin');
        });
        
        Route::middleware([\App\Http\Middleware\CheckRole::class.':staff'])->group(function () {
            Route::get('/dashboard/staff', [DashboardController::class, 'staffDashboard'])->name('api.dashboard.staff');
        });
        
        Route::middleware([\App\Http\Middleware\CheckRole::class.':patient'])->group(function () {
            Route::get('/dashboard/patient', [DashboardController::class, 'patientDashboard'])->name('api.dashboard.patient');
        });
        
        // System status (All authenticated users)
        Route::get('/system/status', [DashboardController::class, 'getSystemStatus'])->name('api.system.status');
        
        // ================================
        // APPOINTMENT API ROUTES
        // ================================
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
            // Appointment CRUD operations
            Route::get('/appointments', [AppointmentController::class, 'index'])->name('api.appointments.index');
            Route::post('/appointments', [AppointmentController::class, 'store'])->name('api.appointments.store');
            Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('api.appointments.show');
            Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('api.appointments.update');
            Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('api.appointments.destroy');
            
            // Appointment status operations
            Route::post('/appointments/{appointment}/check-in', [AppointmentController::class, 'checkIn'])->name('api.appointments.checkin');
            Route::post('/appointments/{appointment}/complete', [AppointmentController::class, 'complete'])->name('api.appointments.complete');
            Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('api.appointments.cancel');
            
            // Appointment utilities
            Route::get('/appointments/available-slots', [AppointmentController::class, 'getAvailableSlots'])->name('api.appointments.available-slots');
        });
        
        // ================================
        // PATIENT API ROUTES
        // ================================
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
            Route::get('/patients', [PatientController::class, 'index'])->name('api.patients.index');
            Route::post('/patients', [PatientController::class, 'store'])->name('api.patients.store');
            Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('api.patients.show');
            Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('api.patients.update');
            Route::patch('/patients/{patient}', [PatientController::class, 'update'])->name('api.patients.patch');
            Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('api.patients.destroy');
        });
        
        // ================================
        // SERVICE API ROUTES
        // ================================
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
            Route::get('/services', [ServiceController::class, 'index'])->name('api.services.index');
            Route::post('/services', [ServiceController::class, 'store'])->name('api.services.store');
            Route::get('/services/{service}', [ServiceController::class, 'show'])->name('api.services.show');
            Route::put('/services/{service}', [ServiceController::class, 'update'])->name('api.services.update');
            Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->name('api.services.destroy');
            Route::patch('/services/{service}/toggle-status', [ServiceController::class, 'toggleStatus'])->name('api.services.toggle-status');
            Route::post('/services/bulk-update-status', [ServiceController::class, 'bulkUpdateStatus'])->name('api.services.bulk-update-status');
        });
        
        // ================================
        // USER API ROUTES (Admin only)
        // ================================
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin'])->group(function () {
            Route::get('/users', [UserController::class, 'index'])->name('api.users.index');
            Route::post('/users', [UserController::class, 'store'])->name('api.users.store');
            Route::get('/users/{id}', [UserController::class, 'show'])->name('api.users.show');
            Route::put('/users/{user}', [UserController::class, 'update'])->name('api.users.update');
            Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('api.users.destroy');
        });
        
        // ================================
        // FINANCIAL RECORDS API ROUTES
        // ================================
        Route::middleware([\App\Http\Middleware\CheckRole::class.':admin,staff'])->group(function () {
            Route::get('/financial-records', [FinancialRecordController::class, 'index'])->name('api.financial-records.index');
            Route::post('/financial-records', [FinancialRecordController::class, 'store'])->name('api.financial-records.store');
            Route::get('/financial-records/{financialRecord}', [FinancialRecordController::class, 'show'])->name('api.financial-records.show');
            Route::put('/financial-records/{financialRecord}', [FinancialRecordController::class, 'update'])->name('api.financial-records.update');
            Route::patch('/financial-records/{financialRecord}', [FinancialRecordController::class, 'update'])->name('api.financial-records.patch');
            Route::delete('/financial-records/{financialRecord}', [FinancialRecordController::class, 'destroy'])->name('api.financial-records.destroy');
            Route::post('/financial-records/{financialRecord}/mark-as-paid', [FinancialRecordController::class, 'markAsPaid'])->name('api.financial-records.mark-paid');
        });
        
        // ================================
        // GENERAL API ROUTES (All authenticated users)
        // ================================
        
        // User search (All authenticated users)
        Route::get('/users/search', [UserController::class, 'search'])->name('api.users.search');
        
        // User notifications
        Route::get('/notifications', [UserController::class, 'notifications'])->name('api.user.notifications');
        Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('api.notifications.unread-count');
        Route::get('/notifications/recent', [NotificationController::class, 'getRecent'])->name('api.notifications.recent');
        Route::post('/notifications/mark-read', [UserController::class, 'markNotificationsRead'])->name('api.user.notifications.mark-read');
        
        // Appointment-specific API routes
        Route::prefix('appointments')->name('api.appointments.')->group(function () {
            Route::get('/stats', [AppointmentController::class, 'getStats'])->name('stats');
            Route::get('/upcoming', [AppointmentController::class, 'getUpcoming'])->name('upcoming');
            Route::get('/today', [AppointmentController::class, 'getToday'])->name('today');
            Route::get('/calendar/{year}/{month}', [AppointmentController::class, 'getMonthlyCalendar'])->name('calendar.monthly');
        });
    });
});

// ================================
// PUBLIC ROUTES (No authentication required)
// ================================
Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('/services-info', function () {
    return Inertia::render('PublicServices');
})->name('public.services');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::get('/book-appointment', function () {
    return Inertia::render('BookAppointment');
})->name('public.book-appointment');

// Public system health check
Route::get('/system-health', function () {
    return Inertia::render('PublicSystemHealth');
})->name('public.system-health');

// Emergency contact information
Route::get('/emergency-contacts', function () {
    return Inertia::render('EmergencyContacts');
})->name('public.emergency-contacts');

// ================================
// FALLBACK ROUTES
// ================================
Route::fallback(function () {
    return Inertia::render('Error', [
        'status' => 404,
        'message' => 'Page not found'
    ]);
});

require __DIR__.'/auth.php';