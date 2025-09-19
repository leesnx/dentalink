import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiClient from '@/services/ApiClient';
import {
    Calendar,
    Clock,
    Search,
    Filter,
    Plus,
    Eye,
    Edit,
    XCircle,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    User,
    Phone,
    CalendarPlus,
    History,
    ArrowUpRight
} from 'lucide-react';

// TypeScript interfaces
interface Appointment {
    id: number;
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
    created_at: string;
}

interface AppointmentFilters {
    status: string;
    date_from: string;
    date_to: string;
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
    { title: 'Patient Dashboard', href: '/patient/dashboard' },
    { title: 'My Appointments', href: '/patient/appointments' }
];

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AppointmentFilters>({
        status: '',
        date_from: '',
        date_to: ''
    });
    const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
    const [stats, setStats] = useState({
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        total: 0
    });

    // Fetch appointments from API
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                view: viewMode
            };
            const response = await apiClient.getMyAppointments(params);
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
    }, [filters, viewMode]);

    // Handle filter change
    const handleFilterChange = (key: keyof AppointmentFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            status: '',
            date_from: '',
            date_to: ''
        });
    };

    // Handle cancel appointment
    const handleCancel = async (appointment: Appointment) => {
        try {
            await apiClient.cancelAppointment(appointment.id);
            fetchAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        }
    };

    // Handle reschedule request
    const handleReschedule = async (appointment: Appointment) => {
        try {
            await apiClient.requestReschedule(appointment.id, '', 'Patient requested reschedule');
            fetchAppointments();
        } catch (error) {
            console.error('Error requesting reschedule:', error);
        }
    };

    // Format date and time
    const formatDateTime = (date: string, time: string) => {
        return new Date(`${date} ${time}`).toLocaleString('en-PH', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date only
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        const statusObj = appointmentStatuses.find(s => s.value === status);
        return statusObj?.color || 'bg-gray-100 text-gray-800';
    };

    // Check if appointment can be cancelled
    const canCancelAppointment = (appointment: Appointment) => {
        const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`);
        const now = new Date();
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        return hoursDiff > 24 && ['scheduled', 'confirmed'].includes(appointment.status);
    };

    // Check if appointment can be rescheduled
    const canRescheduleAppointment = (appointment: Appointment) => {
        const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`);
        const now = new Date();
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        return hoursDiff > 24 && ['scheduled', 'confirmed'].includes(appointment.status);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Appointments" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                        <p className="text-gray-600">View and manage your dental appointments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('upcoming')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'upcoming'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Calendar className="w-4 h-4 mr-2 inline" />
                                Upcoming
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'history'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <History className="w-4 h-4 mr-2 inline" />
                                History
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
                            href="/patient/book-appointment"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            Book Appointment
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.upcoming}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
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
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <User className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
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
                                Clear Filters
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Appointment Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Doctor & Service
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
                                            <p className="text-lg font-medium">
                                                {viewMode === 'upcoming' ? 'No upcoming appointments' : 'No appointment history'}
                                            </p>
                                            <p className="text-sm mb-4">
                                                {viewMode === 'upcoming' 
                                                    ? 'Schedule your next dental visit'
                                                    : 'Your completed appointments will appear here'
                                                }
                                            </p>
                                            {viewMode === 'upcoming' && (
                                                <Link
                                                    href="/patient/book-appointment"
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                                >
                                                    <CalendarPlus className="w-4 h-4" />
                                                    Book Appointment
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Appointment #{appointment.id}
                                                    </p>
                                                    {appointment.reason_for_visit && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Reason: {appointment.reason_for_visit}
                                                        </p>
                                                    )}
                                                    {appointment.notes && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Notes: {appointment.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Dr. {appointment.doctor.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {appointment.service.name}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {appointment.service.duration_minutes} min
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatCurrency(appointment.service.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                                    {appointmentStatuses.find(s => s.value === appointment.status)?.label || appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/patient/appointments/${appointment.id}`}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    
                                                    {canRescheduleAppointment(appointment) && (
                                                        <Link
                                                            href={`/patient/appointments/${appointment.id}/reschedule`}
                                                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                            title="Reschedule"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    
                                                    {canCancelAppointment(appointment) && (
                                                        <button
                                                            onClick={() => handleCancel(appointment)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Cancel Appointment"
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

                {/* Appointment Policies */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Policies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Cancellation Policy</h4>
                                <p className="text-sm text-gray-600">
                                    Appointments can be cancelled up to 24 hours before the scheduled time without penalty.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Arrival Time</h4>
                                <p className="text-sm text-gray-600">
                                    Please arrive 15 minutes early for your appointment to complete any necessary paperwork.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Late Arrival</h4>
                                <p className="text-sm text-gray-600">
                                    Appointments may need to be rescheduled if you arrive more than 15 minutes late.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                                <Phone className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Emergency Contact</h4>
                                <p className="text-sm text-gray-600">
                                    For dental emergencies, please call our emergency line at (555) 123-4567.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}