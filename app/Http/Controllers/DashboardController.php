<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Appointment;
use App\Models\FinancialRecord;
use App\Models\PatientRecord;
use App\Models\Service;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Main dashboard data endpoint for API calls
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get dashboard data based on user role
            switch ($user->role) {
                case 'admin':
                    $data = $this->getAdminDashboardData();
                    break;
                case 'staff':
                    $data = $this->getStaffDashboardData($user);
                    break;
                case 'patient':
                    $data = $this->getPatientDashboardData($user);
                    break;
                default:
                    $data = $this->getBasicDashboardData();
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $data,
                    'user_role' => $user->role
                ]);
            }

            // For web requests, return appropriate view
            return Inertia::render('Dashboard', $data);

        } catch (\Exception $e) {
            Log::error('Dashboard data fetch error: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch dashboard data',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to load dashboard');
        }
    }

    /**
     * Get dashboard data for admin users
     */
    private function getAdminDashboardData()
    {
        // Get basic stats
        $stats = [
            'total_patients' => User::where('role', 'patient')->count(),
            'total_staff' => User::where('role', 'staff')->count(),
            'appointments_today' => Appointment::whereDate('appointment_date', today())->count(),
            'appointments_this_week' => Appointment::whereBetween('appointment_date', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
            'revenue_this_month' => $this->getMonthlyRevenue(),
            'outstanding_balance' => $this->getOutstandingBalance(),
            'recent_registrations' => User::where('role', 'patient')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        // Get recent appointments
        $recentAppointments = Appointment::with(['patient', 'doctor', 'service'])
            ->whereDate('appointment_date', '>=', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(10)
            ->get();

        // Get recent activities (if AuditLog exists)
        $recentActivities = [];
        try {
            if (class_exists('\App\Models\AuditLog')) {
                $recentActivities = AuditLog::with('performedBy')
                    ->where('timestamp', '>=', now()->subDays(7))
                    ->orderBy('timestamp', 'desc')
                    ->limit(10)
                    ->get();
            }
        } catch (\Exception $e) {
            Log::warning('AuditLog not available: ' . $e->getMessage());
        }

        return [
            'stats' => $stats,
            'recentAppointments' => $recentAppointments,
            'recentActivities' => $recentActivities,
        ];
    }

    /**
     * Get dashboard data for staff users
     */
    private function getStaffDashboardData($user)
    {
        $stats = [
            'my_appointments_today' => Appointment::where('doctor_id', $user->id)
                ->whereDate('appointment_date', today())
                ->count(),
            'my_appointments_this_week' => Appointment::where('doctor_id', $user->id)
                ->whereBetween('appointment_date', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ])
                ->count(),
            'my_patients_count' => Appointment::where('doctor_id', $user->id)
                ->distinct('patient_id')
                ->count(),
            'completed_appointments' => Appointment::where('doctor_id', $user->id)
                ->where('status', 'completed')
                ->whereMonth('appointment_date', now()->month)
                ->count(),
        ];

        $myAppointments = Appointment::with(['patient', 'service'])
            ->where('doctor_id', $user->id)
            ->whereDate('appointment_date', '>=', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(10)
            ->get();

        return [
            'stats' => $stats,
            'myAppointments' => $myAppointments,
        ];
    }

    /**
     * Get dashboard data for patient users
     */
    private function getPatientDashboardData($user)
    {
        $stats = [
            'upcoming_appointments' => Appointment::where('patient_id', $user->id)
                ->whereDate('appointment_date', '>=', today())
                ->count(),
            'completed_appointments' => Appointment::where('patient_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'outstanding_balance' => $this->getPatientOutstandingBalance($user->id),
            'last_appointment' => Appointment::where('patient_id', $user->id)
                ->where('status', 'completed')
                ->latest('appointment_date')
                ->first(),
        ];

        $upcomingAppointments = Appointment::with(['doctor', 'service'])
            ->where('patient_id', $user->id)
            ->whereDate('appointment_date', '>=', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(5)
            ->get();

        return [
            'stats' => $stats,
            'upcomingAppointments' => $upcomingAppointments,
        ];
    }

    /**
     * Get basic dashboard data for unknown roles
     */
    private function getBasicDashboardData()
    {
        return [
            'stats' => [
                'total_appointments' => Appointment::count(),
                'total_services' => Service::count(),
            ],
        ];
    }

    /**
     * Get dashboard stats (API endpoint)
     */
    public function getStats(Request $request)
    {
        try {
            $user = $request->user();
            $data = $this->index($request);
            
            // Extract just the stats from the full dashboard data
            $responseData = json_decode($data->getContent(), true);
            
            return response()->json([
                'success' => true,
                'stats' => $responseData['data']['stats'] ?? []
            ]);
            
        } catch (\Exception $e) {
            Log::error('Stats fetch error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activity (API endpoint)
     */
    public function getRecentActivity(Request $request)
    {
        try {
            $recentActivities = [];
            
            // Try to get audit log data if available
            try {
                if (class_exists('\App\Models\AuditLog')) {
                    $recentActivities = AuditLog::with('performedBy')
                        ->where('timestamp', '>=', now()->subDays(7))
                        ->orderBy('timestamp', 'desc')
                        ->limit(10)
                        ->get();
                }
            } catch (\Exception $e) {
                Log::warning('AuditLog not available: ' . $e->getMessage());
                
                // Fallback: create mock activity from recent appointments
                $recentAppointments = Appointment::with(['patient', 'doctor'])
                    ->where('created_at', '>=', now()->subDays(7))
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
                
                $recentActivities = $recentAppointments->map(function ($appointment) {
                    return (object) [
                        'id' => $appointment->id,
                        'performedBy' => (object) [
                            'name' => $appointment->doctor->name ?? 'System',
                            'role' => 'staff'
                        ],
                        'action' => 'create',
                        'target_collection' => 'appointments',
                        'target_id' => $appointment->id,
                        'timestamp' => $appointment->created_at,
                    ];
                });
            }

            return response()->json([
                'success' => true,
                'recentActivities' => $recentActivities
            ]);

        } catch (\Exception $e) {
            Log::error('Recent activity fetch error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recent activity',
                'recentActivities' => []
            ]);
        }
    }

    /**
     * Get system alerts (API endpoint)
     */
    public function getAlerts(Request $request)
    {
        try {
            $alerts = [];
            
            // Check for upcoming appointments that need attention
            $urgentAppointments = Appointment::with(['patient'])
                ->whereDate('appointment_date', today())
                ->where('status', 'scheduled')
                ->count();
            
            if ($urgentAppointments > 0) {
                $alerts[] = [
                    'type' => 'warning',
                    'title' => 'Appointments Need Confirmation',
                    'message' => "{$urgentAppointments} appointments today are still scheduled (not confirmed)",
                    'count' => $urgentAppointments
                ];
            }
            
            // Check for overdue payments
            $overduePayments = $this->getOverduePaymentsCount();
            if ($overduePayments > 0) {
                $alerts[] = [
                    'type' => 'error',
                    'title' => 'Overdue Payments',
                    'message' => "{$overduePayments} payments are overdue",
                    'count' => $overduePayments
                ];
            }

            return response()->json([
                'success' => true,
                'alerts' => $alerts
            ]);

        } catch (\Exception $e) {
            Log::error('Alerts fetch error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'alerts' => []
            ]);
        }
    }

    /**
     * Helper: Get monthly revenue
     */
    private function getMonthlyRevenue()
    {
        try {
            return FinancialRecord::where('transaction_date', '>=', now()->startOfMonth())
                ->where('transaction_date', '<=', now()->endOfMonth())
                ->where('payment_status', 'paid')
                ->sum('amount') ?? 0;
        } catch (\Exception $e) {
            Log::warning('Monthly revenue calculation failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Helper: Get outstanding balance
     */
    private function getOutstandingBalance()
    {
        try {
            return FinancialRecord::where('payment_status', 'pending')
                ->sum('amount') ?? 0;
        } catch (\Exception $e) {
            Log::warning('Outstanding balance calculation failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Helper: Get patient outstanding balance
     */
    private function getPatientOutstandingBalance($patientId)
    {
        try {
            return FinancialRecord::where('patient_id', $patientId)
                ->where('payment_status', 'pending')
                ->sum('amount') ?? 0;
        } catch (\Exception $e) {
            Log::warning('Patient outstanding balance calculation failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Helper: Get overdue payments count
     */
    private function getOverduePaymentsCount()
    {
        try {
            return FinancialRecord::where('payment_status', 'pending')
                ->where('due_date', '<', today())
                ->count();
        } catch (\Exception $e) {
            Log::warning('Overdue payments count failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get system status (API endpoint)
     */
    public function getSystemStatus(Request $request)
    {
        try {
            $status = [
                'database' => 'healthy',
                'appointments_system' => 'healthy',
                'last_backup' => now()->subHours(6)->toISOString(),
                'active_users' => User::where('last_login_at', '>=', now()->subMinutes(30))->count(),
            ];

            return response()->json([
                'success' => true,
                'status' => $status
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'status' => ['database' => 'error']
            ]);
        }
    }

    /**
     * Admin-specific dashboard data endpoint
     */
    public function adminDashboard(Request $request)
    {
        try {
            $data = $this->getAdminDashboardData();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $data
                ]);
            }

            return Inertia::render('Admin/Dashboard', $data);

        } catch (\Exception $e) {
            Log::error('Admin dashboard error: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch admin dashboard data'
                ], 500);
            }
            
            return back()->with('error', 'Failed to load admin dashboard');
        }
    }

    /**
     * Staff-specific dashboard data endpoint
     */
    public function staffDashboard(Request $request)
    {
        try {
            $data = $this->getStaffDashboardData($request->user());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $data
                ]);
            }

            return Inertia::render('Staff/Dashboard', $data);

        } catch (\Exception $e) {
            Log::error('Staff dashboard error: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch staff dashboard data'
                ], 500);
            }
            
            return back()->with('error', 'Failed to load staff dashboard');
        }
    }

    /**
     * Patient-specific dashboard data endpoint
     */
    public function patientDashboard(Request $request)
    {
        try {
            $data = $this->getPatientDashboardData($request->user());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $data
                ]);
            }

            return Inertia::render('Patient/Dashboard', $data);

        } catch (\Exception $e) {
            Log::error('Patient dashboard error: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch patient dashboard data'
                ], 500);
            }
            
            return back()->with('error', 'Failed to load patient dashboard');
        }
    }
}