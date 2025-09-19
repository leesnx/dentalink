import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiStaff from '@/services/ApiStaff';
import {
    LayoutGrid,
    Calendar,
    Users,
    Activity,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    FileText,
    Heart,
    RefreshCw,
    Eye,
    CalendarCheck,
    UserCheck,
    ArrowUpRight
} from 'lucide-react';

// TypeScript interfaces
interface StaffStats {
    appointments_today: number;
    appointments_this_week: number;
    total_patients: number;
    completed_treatments: number;
    pending_appointments: number;
    overdue_tasks: number;
}

interface TodayAppointment {
    id: number;
    patient: {
        id: number;
        name: string;
        phone: string;
    };
    service: {
        id: number;
        name: string;
        duration_minutes: number;
    };
    appointment_time: string;
    status: string;
    reason_for_visit: string;
}

interface UpcomingAppointment {
    id: number;
    patient: {
        id: number;
        name: string;
    };
    service: {
        id: number;
        name: string;
    };
    appointment_date: string;
    appointment_time: string;
    status: string;
}

interface RecentActivity {
    id: number;
    type: string;
    description: string;
    patient_name: string;
    timestamp: string;
}

const breadcrumbs = [
    { title: 'Staff Dashboard', href: '/staff/dashboard' }
];

export default function StaffDashboard() {
    const [stats, setStats] = useState<StaffStats>({
        appointments_today: 0,
        appointments_this_week: 0,
        total_patients: 0,
        completed_treatments: 0,
        pending_appointments: 0,
        overdue_tasks: 0
    });
    const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await apiStaff.getDashboardData();
            
            setStats(response.stats || stats);
            setTodayAppointments(response.todayAppointments || []);
            setUpcomingAppointments(response.upcomingAppointments || []);
            setRecentActivities(response.recentActivities || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
        return () => clearInterval(interval);
    }, []);

    // Format time
    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status: string) => {
        const colors = {
            scheduled: 'bg-blue-100 text-blue-800',
            confirmed: 'bg-green-100 text-green-800',
            checked_in: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    // Handle check-in
    const handleCheckIn = async (appointmentId: number) => {
        try {
            await apiStaff.checkInAppointment(appointmentId);
            fetchDashboardData();
        } catch (error) {
            console.error('Error checking in patient:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                        <p className="text-gray-600">Welcome back! Here's your daily overview.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <Link
                            href="/patient-records/create"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <FileText className="w-4 h-4" />
                            New Record
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.appointments_today}</p>
                                <p className="text-xs text-blue-600 flex items-center mt-1">
                                    <CalendarCheck className="w-3 h-3 mr-1" />
                                    {stats.pending_appointments} pending
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Week</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.appointments_this_week}</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Appointments scheduled
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">My Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total_patients}</p>
                                <p className="text-xs text-purple-600 flex items-center mt-1">
                                    <Users className="w-3 h-3 mr-1" />
                                    Under your care
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed Treatments</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.completed_treatments}</p>
                                <p className="text-xs text-orange-600 flex items-center mt-1">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    This month
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Heart className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/appointments/create"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <CalendarCheck className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Book Appointment</p>
                                <p className="text-sm text-gray-600">Schedule new appointment</p>
                            </div>
                        </Link>

                        <Link
                            href="/patient-records/create"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-medium text-gray-900">New Record</p>
                                <p className="text-sm text-gray-600">Add patient record</p>
                            </div>
                        </Link>

                        <Link
                            href="/treatment-plans/create"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Heart className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="font-medium text-gray-900">Treatment Plan</p>
                                <p className="text-sm text-gray-600">Create new plan</p>
                            </div>
                        </Link>

                        <Link
                            href="/patients/create"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Users className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="font-medium text-gray-900">Add Patient</p>
                                <p className="text-sm text-gray-600">Register new patient</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Appointments */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                                <Link 
                                    href={`/appointments?date=${new Date().toISOString().split('T')[0]}`}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                    View all
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading...
                                </div>
                            ) : todayAppointments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No appointments today</p>
                                </div>
                            ) : (
                                todayAppointments.map((appointment) => (
                                    <div key={appointment.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {formatTime(appointment.appointment_time)}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-gray-900">{appointment.patient.name}</p>
                                                <p className="text-sm text-gray-600">{appointment.service.name}</p>
                                                {appointment.reason_for_visit && (
                                                    <p className="text-xs text-gray-500 mt-1">{appointment.reason_for_visit}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status.replace('_', ' ')}
                                                </span>
                                                {appointment.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleCheckIn(appointment.id)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Check In"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                                <Link 
                                    href="/appointments"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                    View all
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading...
                                </div>
                            ) : upcomingAppointments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No upcoming appointments</p>
                                </div>
                            ) : (
                                upcomingAppointments.map((appointment) => (
                                    <div key={appointment.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{appointment.patient.name}</p>
                                                <p className="text-sm text-gray-600">{appointment.service.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(`${appointment.appointment_date} ${appointment.appointment_time}`)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                {appointment.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Tasks & Alerts */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Tasks & Alerts</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {stats.overdue_tasks > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Pending Tasks</p>
                                        <p className="text-sm text-yellow-700">
                                            You have {stats.overdue_tasks} overdue task{stats.overdue_tasks > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <Link 
                                        href="/patient-records?status=pending"
                                        className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                                    >
                                        Review
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-green-800">All Systems Operational</p>
                                    <p className="text-sm text-green-700">Your schedule and systems are running smoothly</p>
                                </div>
                                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}