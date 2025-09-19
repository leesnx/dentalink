import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiClient from '@/services/ApiClient';
import {
    LayoutGrid,
    Calendar,
    FileText,
    Heart,
    CreditCard,
    Clock,
    CheckCircle,
    AlertTriangle,
    Bell,
    User,
    Phone,
    RefreshCw,
    CalendarPlus,
    ArrowUpRight,
    DollarSign,
    Activity
} from 'lucide-react';

// TypeScript interfaces
interface UpcomingAppointment {
    id: number;
    doctor: {
        id: number;
        name: string;
    };
    service: {
        id: number;
        name: string;
        duration_minutes: number;
    };
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason_for_visit: string;
}

interface RecentRecord {
    id: number;
    createdBy: {
        id: number;
        name: string;
    };
    appointment: {
        id: number;
        service: {
            name: string;
        };
    };
    diagnosis: string;
    treatment_notes: string;
    created_at: string;
}

interface TreatmentPlan {
    id: number;
    doctor: {
        id: number;
        name: string;
    };
    plan_title: string;
    status: string;
    estimated_cost: number;
    start_date: string;
}

interface PatientStats {
    upcoming_appointments: number;
    completed_appointments: number;
    active_treatment_plans: number;
    outstanding_balance: number;
}

const breadcrumbs = [
    { title: 'Patient Dashboard', href: '/patient/dashboard' }
];

export default function PatientDashboard() {
    const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
    const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
    const [activeTreatmentPlans, setActiveTreatmentPlans] = useState<TreatmentPlan[]>([]);
    const [stats, setStats] = useState<PatientStats>({
        upcoming_appointments: 0,
        completed_appointments: 0,
        active_treatment_plans: 0,
        outstanding_balance: 0
    });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardResponse, appointmentsResponse, recordsResponse, treatmentPlansResponse, notificationsResponse] = await Promise.all([
                apiClient.getDashboardStats(),
                apiClient.getMyAppointments({ status: 'upcoming', limit: 5 }),
                apiClient.getMyRecords({ limit: 3 }),
                apiClient.getMyTreatmentPlans({ status: 'active' }),
                apiClient.getRecentNotifications()
            ]);

            setStats(dashboardResponse.stats || stats);
            setUpcomingAppointments(appointmentsResponse.data || []);
            setRecentRecords(recordsResponse.data || []);
            setActiveTreatmentPlans(treatmentPlansResponse.data || []);
            setNotifications(notificationsResponse.notifications || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Auto-refresh every 10 minutes
        const interval = setInterval(fetchDashboardData, 600000);
        return () => clearInterval(interval);
    }, []);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format date and time
    const formatDateTime = (date: string, time: string) => {
        return new Date(`${date} ${time}`).toLocaleString('en-PH', {
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
            cancelled: 'bg-red-100 text-red-800',
            draft: 'bg-gray-100 text-gray-800',
            approved: 'bg-green-100 text-green-800',
            active: 'bg-blue-100 text-blue-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patient Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
                        <p className="text-gray-600">Welcome back! Here's your health overview.</p>
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
                            href="/patient/book-appointment"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            Book Appointment
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                                <p className="text-2xl font-bold text-blue-900">{loading ? '...' : stats.upcoming_appointments}</p>
                                <p className="text-xs text-blue-600 flex items-center mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Scheduled
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
                                <p className="text-sm font-medium text-gray-600">Completed Visits</p>
                                <p className="text-2xl font-bold text-green-900">{loading ? '...' : stats.completed_appointments}</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    All time
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
                                <p className="text-sm font-medium text-gray-600">Active Treatment Plans</p>
                                <p className="text-2xl font-bold text-purple-900">{loading ? '...' : stats.active_treatment_plans}</p>
                                <p className="text-xs text-purple-600 flex items-center mt-1">
                                    <Heart className="w-3 h-3 mr-1" />
                                    In progress
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Heart className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-red-900">
                                    {loading ? '...' : formatCurrency(stats.outstanding_balance)}
                                </p>
                                <p className="text-xs text-red-600 flex items-center mt-1">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    Pending payment
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <CreditCard className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/patient/book-appointment"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <CalendarPlus className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Book Appointment</p>
                                <p className="text-sm text-gray-600">Schedule your next visit</p>
                            </div>
                        </Link>

                        <Link
                            href="/patient/records"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-medium text-gray-900">View Records</p>
                                <p className="text-sm text-gray-600">Access medical history</p>
                            </div>
                        </Link>

                        <Link
                            href="/patient/billing"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <CreditCard className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="font-medium text-gray-900">Pay Bills</p>
                                <p className="text-sm text-gray-600">Make payments online</p>
                            </div>
                        </Link>

                        <Link
                            href="/patient/profile"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <User className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="font-medium text-gray-900">Update Profile</p>
                                <p className="text-sm text-gray-600">Manage your information</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                                <Link 
                                    href="/patient/appointments"
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
                                    <Link 
                                        href="/patient/book-appointment"
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                                    >
                                        Book an appointment
                                    </Link>
                                </div>
                            ) : (
                                upcomingAppointments.map((appointment) => (
                                    <div key={appointment.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-gray-900">Dr. {appointment.doctor.name}</p>
                                                <p className="text-sm text-gray-600">{appointment.service.name}</p>
                                                {appointment.reason_for_visit && (
                                                    <p className="text-xs text-gray-500 mt-1">{appointment.reason_for_visit}</p>
                                                )}
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

                    {/* Recent Medical Records */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Medical Records</h2>
                                <Link 
                                    href="/patient/records"
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
                            ) : recentRecords.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No medical records found</p>
                                </div>
                            ) : (
                                recentRecords.map((record) => (
                                    <div key={record.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{record.diagnosis}</p>
                                                <p className="text-sm text-gray-600">Dr. {record.createdBy.name}</p>
                                                {record.appointment && (
                                                    <p className="text-xs text-gray-500">{record.appointment.service.name}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">{formatDate(record.created_at)}</p>
                                            </div>
                                            <Link
                                                href={`/patient-records/${record.id}`}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="View Record"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Treatment Plans & Health Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Treatment Plans */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Active Treatment Plans</h2>
                                <Link 
                                    href="/patient/treatment-plans"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                    View all
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading...
                                </div>
                            ) : activeTreatmentPlans.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No active treatment plans</p>
                                </div>
                            ) : (
                                activeTreatmentPlans.map((plan) => (
                                    <div key={plan.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{plan.plan_title}</p>
                                                <p className="text-sm text-gray-600">Dr. {plan.doctor.name}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
                                                        {plan.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatCurrency(plan.estimated_cost)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Health Alerts & Reminders */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Health Alerts</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {stats.outstanding_balance > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-yellow-800">Outstanding Balance</p>
                                            <p className="text-sm text-yellow-700">
                                                You have an outstanding balance of {formatCurrency(stats.outstanding_balance)}
                                            </p>
                                        </div>
                                        <Link 
                                            href="/patient/billing"
                                            className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                                        >
                                            Pay Now
                                        </Link>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-blue-800">Appointment Reminder</p>
                                        <p className="text-sm text-blue-700">
                                            Remember to arrive 15 minutes early for your appointments
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-green-800">Health Records Updated</p>
                                        <p className="text-sm text-green-700">
                                            Your health information is up to date
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}