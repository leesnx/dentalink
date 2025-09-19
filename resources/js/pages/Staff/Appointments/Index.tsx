import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiStaff from '@/services/ApiStaff';
import {
    Calendar,
    Clock,
    Search,
    Filter,
    Plus,
    Edit,
    Eye,
    CheckCircle,
    XCircle,
    UserCheck,
    Phone,
    RefreshCw,
    Users,
    Activity,
    User,
    AlertCircle
} from 'lucide-react';

// TypeScript interfaces
interface Appointment {
    id: number;
    patient: {
        id: number;
        name: string;
        phone: string;
    };
    doctor: {
        id: number;
        name: string;
    };
    service: {
        id: number;
        name: string;
        duration_minutes: number;
        price: number;
    };
    appointment_date: string;
    appointment_time: string;
    status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    reason_for_visit: string;
    notes: string;
}

interface AppointmentFilters {
    date: string;
    status: string;
    patient: string;
}

const appointmentStatuses = [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
    { value: 'checked_in', label: 'Checked In', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'no_show', label: 'No Show', color: 'bg-gray-100 text-gray-800' }
];

const breadcrumbs = [
    { title: 'Staff Dashboard', href: '/staff/dashboard' },
    { title: 'Appointments', href: '/appointments' }
];

export default function StaffAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AppointmentFilters>({
        date: new Date().toISOString().split('T')[0],
        status: '',
        patient: ''
    });
    const [stats, setStats] = useState({
        today: 0,
        thisWeek: 0,
        completed: 0,
        cancelled: 0
    });
    const [viewMode, setViewMode] = useState<'today' | 'all'>('today');

    // Fetch appointments from API
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await apiStaff.getAppointments(filters);
            setAppointments(response.data || response.appointments || []);
            setStats(response.stats || stats);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [filters]);

    useEffect(() => {
        if (viewMode === 'today') {
            setFilters(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
        } else {
            setFilters(prev => ({ ...prev, date: '' }));
        }
    }, [viewMode]);

    // Handle filter change
    const handleFilterChange = (key: keyof AppointmentFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            date: viewMode === 'today' ? new Date().toISOString().split('T')[0] : '',
            status: '',
            patient: ''
        });
    };

    // Handle check-in
    const handleCheckIn = async (appointment: Appointment) => {
        try {
            await apiStaff.checkInAppointment(appointment.id);
            fetchAppointments();
        } catch (error) {
            console.error('Error checking in appointment:', error);
        }
    };

    // Handle complete
    const handleComplete = async (appointment: Appointment) => {
        try {
            await apiStaff.completeAppointment(appointment.id, 'Appointment completed successfully');
            fetchAppointments();
        } catch (error) {
            console.error('Error completing appointment:', error);
        }
    };

    // Handle cancel
    const handleCancel = async (appointment: Appointment) => {
        try {
            await apiStaff.cancelAppointment(appointment.id);
            fetchAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        }
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
        const statusObj = appointmentStatuses.find(s => s.value === status);
        return statusObj?.color || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Appointments" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                        <p className="text-gray-600">Manage your patient appointments and schedule</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('today')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'today'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'all'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                All Appointments
                            </button>
                        </div>
                        <button
                            onClick={fetchAppointments}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <Link
                            href="/appointments/create"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Book Appointment
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Week</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                            </div>
                            <Activity className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                                <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={filters.patient}
                                    onChange={(e) => handleFilterChange('patient', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {viewMode === 'all' && (
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            )}
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                {appointmentStatuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium">No appointments found</p>
                                            <p className="text-sm">
                                                {viewMode === 'today' ? 'No appointments scheduled for today' : 'No appointments match your filters'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {appointment.patient.name}
                                                        </div>
                                                        {appointment.patient.phone && (
                                                            <div className="text-sm text-gray-500 flex items-center">
                                                                <Phone className="w-3 h-3 mr-1" />
                                                                {appointment.patient.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {appointment.service.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center mt-1">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {appointment.service.duration_minutes} minutes
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                </div>
                                                {appointment.reason_for_visit && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {appointment.reason_for_visit}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                    {appointmentStatuses.find(s => s.value === appointment.status)?.label || appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/appointments/${appointment.id}`}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {appointment.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleCheckIn(appointment)}
                                                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                            title="Check In"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {appointment.status === 'in_progress' && (
                                                        <button
                                                            onClick={() => handleComplete(appointment)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Complete"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/appointments/${appointment.id}/edit`}
                                                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    {['scheduled', 'confirmed'].includes(appointment.status) && (
                                                        <button
                                                            onClick={() => handleCancel(appointment)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Cancel"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Stats for Today */}
                {viewMode === 'today' && appointments.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Patients</p>
                                    <p className="font-semibold text-gray-900">{appointments.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="font-semibold text-gray-900">
                                        {appointments.filter(apt => apt.status === 'completed').length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Remaining</p>
                                    <p className="font-semibold text-gray-900">
                                        {appointments.filter(apt => !['completed', 'cancelled', 'no_show'].includes(apt.status)).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}