import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiAdmin from '@/services/ApiAdmin';
import {
    LayoutGrid,
    Users,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download,
    Eye,
    UserPlus,
    CalendarPlus,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

// TypeScript interfaces
interface DashboardStats {
    total_patients: number;
    total_staff: number;
    appointments_today: number;
    appointments_this_week: number;
    revenue_this_month: number;
    outstanding_balance: number;
    recent_registrations: number;
}

interface RecentAppointment {
    id: number;
    patient: {
        id: number;
        name: string;
    };
    doctor: {
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
    performedBy: {
        id: number;
        name: string;
        role: string;
    };
    action: string;
    target_collection: string;
    target_id: number;
    timestamp: string;
    details: any;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' }
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        total_patients: 0,
        total_staff: 0,
        appointments_today: 0,
        appointments_this_week: 0,
        revenue_this_month: 0,
        outstanding_balance: 0,
        recent_registrations: 0
    });
    const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Helper function to unwrap response data
    const unwrapData = (response: any, key: string) => {
        if (!response) return null;
        if (response[key]) return response[key];
        if (response.data?.[key]) return response.data[key];
        return response.data || response;
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Try to get dashboard data from API
            let dashboardResponse;
            try {
                dashboardResponse = await apiAdmin.getDashboardData();
            } catch (dashboardError) {
                console.warn('Dashboard API failed, fetching individual components:', dashboardError);
                // Fallback: fetch individual components
                dashboardResponse = await fetchFallbackData();
            }
            
            console.log('Dashboard response:', dashboardResponse);
            
            // Extract stats
            const statsData = unwrapData(dashboardResponse, 'stats');
            if (statsData) {
                setStats({
                    total_patients: Number(statsData.total_patients || 0),
                    total_staff: Number(statsData.total_staff || 0),
                    appointments_today: Number(statsData.appointments_today || 0),
                    appointments_this_week: Number(statsData.appointments_this_week || 0),
                    revenue_this_month: Number(statsData.revenue_this_month || 0),
                    outstanding_balance: Number(statsData.outstanding_balance || 0),
                    recent_registrations: Number(statsData.recent_registrations || 0)
                });
            }
            
            // Extract recent appointments
            const appointmentsData = unwrapData(dashboardResponse, 'recentAppointments');
            if (Array.isArray(appointmentsData)) {
                setRecentAppointments(appointmentsData.slice(0, 10));
            }
            
            // Extract recent activities
            const activitiesData = unwrapData(dashboardResponse, 'recentActivities');
            if (Array.isArray(activitiesData)) {
                setRecentActivities(activitiesData.slice(0, 10));
            }
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Try fallback approach
            await fetchFallbackData();
        } finally {
            setLoading(false);
        }
    };

    // Fallback: fetch data from individual endpoints
    const fetchFallbackData = async () => {
        try {
            const [usersRes, appointmentsRes, financialRes] = await Promise.allSettled([
                apiAdmin.getUsers({}),
                apiAdmin.getAppointments({ 
                    date: new Date().toISOString().split('T')[0],
                    limit: 10 
                }),
                apiAdmin.getFinancialRecords({ limit: 5 })
            ]);

            // Process users data for stats
            if (usersRes.status === 'fulfilled') {
                const userData = usersRes.value;
                const users = Array.isArray(userData?.data) ? userData.data : 
                             Array.isArray(userData?.users) ? userData.users : 
                             Array.isArray(userData) ? userData : [];
                
                const patients = users.filter((u: any) => u.role === 'patient');
                const staff = users.filter((u: any) => u.role === 'staff');
                
                setStats(prev => ({
                    ...prev,
                    total_patients: patients.length,
                    total_staff: staff.length,
                    recent_registrations: patients.filter((p: any) => {
                        const createdAt = new Date(p.created_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return createdAt >= weekAgo;
                    }).length
                }));
            }

            // Process appointments data
            if (appointmentsRes.status === 'fulfilled') {
                const appointmentData = appointmentsRes.value;
                const appointments = Array.isArray(appointmentData?.data) ? appointmentData.data : 
                                  Array.isArray(appointmentData?.appointments) ? appointmentData.appointments :
                                  Array.isArray(appointmentData) ? appointmentData : [];
                
                setRecentAppointments(appointments.slice(0, 10));
                
                // Calculate appointment stats
                const today = new Date().toISOString().split('T')[0];
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                
                const todayAppointments = appointments.filter((a: any) => 
                    a.appointment_date === today || a.appointment_date?.startsWith(today)
                );
                
                const weekAppointments = appointments.filter((a: any) => {
                    const appointmentDate = new Date(a.appointment_date);
                    return appointmentDate >= startOfWeek;
                });
                
                setStats(prev => ({
                    ...prev,
                    appointments_today: todayAppointments.length,
                    appointments_this_week: weekAppointments.length
                }));
            }

            // Process financial data
            if (financialRes.status === 'fulfilled') {
                const financialData = financialRes.value;
                const summary = financialData?.summary || financialData?.data?.summary || {};
                
                setStats(prev => ({
                    ...prev,
                    revenue_this_month: Number(summary.monthly_revenue || 0),
                    outstanding_balance: Number(summary.outstanding_balance || 0)
                }));
            }

            return {
                stats: stats,
                recentAppointments: recentAppointments,
                recentActivities: []
            };
        } catch (error) {
            console.error('Fallback data fetch failed:', error);
            return null;
        }
    };

    // Refresh dashboard
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
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
        if (!dateString) return 'N/A';
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
            cancelled: 'bg-red-100 text-red-800',
            no_show: 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    // Get action icon
    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create':
                return <UserPlus className="w-4 h-4" />;
            case 'update':
                return <Activity className="w-4 h-4" />;
            case 'delete':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Welcome to the Smart Medical Clinic administration panel</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link
                            href="/admin/reports"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4" />
                            Export Reports
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Patients */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total_patients}</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {stats.recent_registrations} new this week
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Total Staff */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total_staff}</p>
                                <p className="text-xs text-gray-500 mt-1">Active personnel</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Appointments Today */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Appointments Today</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.appointments_today}</p>
                                <p className="text-xs text-blue-600 flex items-center mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {stats.appointments_this_week} this week
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Calendar className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    {/* Revenue This Month */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(stats.revenue_this_month)}
                                </p>
                                <p className="text-xs text-red-600 flex items-center mt-1">
                                    <ArrowDownRight className="w-3 h-3 mr-1" />
                                    {formatCurrency(stats.outstanding_balance)} outstanding
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/admin/patients"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <UserPlus className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Add Patient</p>
                                <p className="text-sm text-gray-600">Register new patient</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/appointments"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <CalendarPlus className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-medium text-gray-900">Book Appointment</p>
                                <p className="text-sm text-gray-600">Schedule new appointment</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/financial-records"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <DollarSign className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="font-medium text-gray-900">Add Transaction</p>
                                <p className="text-sm text-gray-600">Record payment</p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Users className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="font-medium text-gray-900">Add Staff</p>
                                <p className="text-sm text-gray-600">Register staff member</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Appointments */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
                                <Link 
                                    href="/admin/appointments"
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
                            ) : recentAppointments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    No recent appointments
                                </div>
                            ) : (
                                recentAppointments.map((appointment) => (
                                    <div key={appointment.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{appointment.patient?.name || 'Unknown Patient'}</p>
                                                <p className="text-sm text-gray-600">{appointment.service?.name || 'Unknown Service'}</p>
                                                <p className="text-xs text-gray-500">
                                                    Dr. {appointment.doctor?.name || 'Unknown Doctor'} • {formatDate(appointment.appointment_date)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                {appointment.status?.replace('_', ' ') || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                                <Link 
                                    href="/admin/reports/audit"
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
                            ) : recentActivities.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    No recent activities available
                                    <div className="mt-2 text-xs text-gray-400">
                                        Activities will appear here when users perform actions
                                    </div>
                                </div>
                            ) : (
                                recentActivities.map((activity) => (
                                    <div key={activity.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                                                {getActionIcon(activity.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {activity.performedBy?.name || 'System'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {activity.action}d {activity.target_collection?.replace('_', ' ') || 'item'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}