import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiAdmin from '@/services/ApiAdmin';
import {
    DollarSign,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    CreditCard,
    Receipt,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    Download,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    FileText
} from 'lucide-react';

// TypeScript interfaces
interface FinancialRecord {
    id: number;
    patient: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    appointment?: {
        id: number;
        service: {
            id: number;
            name: string;
        };
    };
    amount: number;
    payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
    payment_method: string | null;
    transaction_date: string;
    description: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface FinancialFilters {
    search: string;
    payment_status: string;
    payment_method: string;
    date_from: string;
    date_to: string;
}

interface FinancialFormData {
    patient_id: string;
    appointment_id: string;
    amount: string;
    payment_status: string;
    payment_method: string;
    transaction_date: string;
    description: string;
    notes: string;
}

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface Appointment {
    id: number;
    patient: {
        name: string;
    };
    service: {
        name: string;
        price: number;
    };
    appointment_date: string;
}

const initialFormData: FinancialFormData = {
    patient_id: '',
    appointment_id: '',
    amount: '',
    payment_status: 'pending',
    payment_method: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
};

const paymentStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { value: 'partial', label: 'Partial', color: 'bg-blue-100 text-blue-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' }
];

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'insurance', label: 'Insurance' }
];

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Financial Records', href: '/admin/financial-records' }
];

export default function FinancialRecordsPage() {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
    const [formData, setFormData] = useState<FinancialFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [filters, setFilters] = useState<FinancialFilters>({
        search: '',
        payment_status: '',
        payment_method: '',
        date_from: '',
        date_to: ''
    });
    const [summary, setSummary] = useState({
        total_revenue: 0,
        outstanding_balance: 0,
        monthly_revenue: 0,
        pending_count: 0,
        paid_count: 0,
        overdue_count: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Helper function to unwrap response data
    const unwrapList = <T,>(res: any, keys: string[] = ['data', 'records']): T[] => {
        if (!res) return [];
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data)) return res.data;
        for (const k of keys) {
            if (Array.isArray(res?.[k])) return res[k];
            if (Array.isArray(res?.data?.[k])) return res.data[k];
        }
        return [];
    };

    // Fetch financial records from API
    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await apiAdmin.getFinancialRecords({
                ...filters,
                page: currentPage
            });
            
            console.log('Financial records response:', response);
            
            // Handle different response structures
            let recordsList = unwrapList<FinancialRecord>(response, ['records', 'data']);
            let summaryData = response?.summary || response?.data?.summary || {};
            
            setRecords(recordsList);
            
            if (summaryData && Object.keys(summaryData).length > 0) {
                setSummary({
                    total_revenue: Number(summaryData.total_revenue || 0),
                    outstanding_balance: Number(summaryData.outstanding_balance || 0),
                    monthly_revenue: Number(summaryData.monthly_revenue || 0),
                    pending_count: Number(summaryData.pending_count || 0),
                    paid_count: Number(summaryData.paid_count || 0),
                    overdue_count: Number(summaryData.overdue_count || 0)
                });
            }
            
            setTotalPages(response?.last_page || response?.data?.last_page || 1);
        } catch (error) {
            console.error('Error fetching financial records:', error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch dropdown data
    const fetchDropdownData = async () => {
        try {
            const [patientsRes, appointmentsRes] = await Promise.all([
                apiAdmin.getUsers({ role: 'patient' }),
                apiAdmin.getAppointments({ status: 'completed' })
            ]);

            setPatients(unwrapList<Patient>(patientsRes, ['users', 'data']));
            setAppointments(unwrapList<Appointment>(appointmentsRes, ['appointments', 'data']));
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setPatients([]);
            setAppointments([]);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [filters, currentPage]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        try {
            const recordData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            if (isEditMode && selectedRecord) {
                await apiAdmin.updateFinancialRecord(selectedRecord.id, recordData);
            } else {
                await apiAdmin.createFinancialRecord(recordData);
            }

            setIsModalOpen(false);
            setFormData(initialFormData);
            setSelectedRecord(null);
            setIsEditMode(false);
            await fetchRecords();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
        }
    };

    // Handle record deletion
    const handleDelete = async (record: FinancialRecord) => {
        try {
            await apiAdmin.deleteFinancialRecord(record.id, `${record.patient.name}'s transaction`);
            await fetchRecords();
        } catch (error) {
            console.error('Error deleting financial record:', error);
        }
    };

    // Handle edit
    const handleEdit = async (record: FinancialRecord) => {
        setSelectedRecord(record);
        setFormData({
            patient_id: record.patient.id.toString(),
            appointment_id: record.appointment?.id.toString() || '',
            amount: record.amount.toString(),
            payment_status: record.payment_status,
            payment_method: record.payment_method || '',
            transaction_date: record.transaction_date,
            description: record.description,
            notes: record.notes || ''
        });
        setIsEditMode(true);
        setIsModalOpen(true);
        setFormErrors({});
        await fetchDropdownData();
    };

    // Handle create new
    const handleCreateNew = async () => {
        setSelectedRecord(null);
        setFormData(initialFormData);
        setIsEditMode(false);
        setIsModalOpen(true);
        setFormErrors({});
        await fetchDropdownData();
    };

    // Handle filter change
    const handleFilterChange = (key: keyof FinancialFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            search: '',
            payment_status: '',
            payment_method: '',
            date_from: '',
            date_to: ''
        });
        setCurrentPage(1);
    };

    // Mark as paid
    const handleMarkAsPaid = async (record: FinancialRecord) => {
        try {
            await apiAdmin.markFinancialRecordAsPaid(record.id, {
                payment_method: 'cash',
                notes: 'Marked as paid from admin panel'
            });
            await fetchRecords();
        } catch (error) {
            console.error('Error marking as paid:', error);
        }
    };

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

    // Get status color
    const getStatusColor = (status: string) => {
        const statusObj = paymentStatuses.find(s => s.value === status);
        return statusObj?.color || 'bg-gray-100 text-gray-800';
    };

    // Get payment method display
    const getPaymentMethodDisplay = (method: string | null) => {
        if (!method) return 'Not specified';
        const methodObj = paymentMethods.find(m => m.value === method);
        return methodObj?.label || method;
    };

    // Get error message
    const getErr = (errors: string[] | undefined) => {
        return Array.isArray(errors) ? errors[0] : errors;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Financial Records Management" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
                        <p className="text-gray-600">Manage payments, invoices, and financial transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/financial-records/reports"
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <FileText className="w-4 h-4" />
                            Reports
                        </Link>
                        <button
                            onClick={fetchRecords}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Transaction
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(summary.total_revenue)}
                                </p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    All time
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-red-900">
                                    {loading ? '...' : formatCurrency(summary.outstanding_balance)}
                                </p>
                                <p className="text-xs text-red-600 flex items-center mt-1">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {summary.overdue_count} overdue
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {loading ? '...' : formatCurrency(summary.monthly_revenue)}
                                </p>
                                <p className="text-xs text-blue-600 flex items-center mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    This month
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-green-600">{summary.paid_count} paid</span>
                                    <span className="text-xs text-yellow-600">{summary.pending_count} pending</span>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Receipt className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <select
                                    value={filters.payment_status}
                                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Status</option>
                                    {paymentStatuses.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={filters.payment_method}
                                    onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Methods</option>
                                    {paymentMethods.map(method => (
                                        <option key={method.value} value={method.value}>{method.label}</option>
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

                {/* Financial Records Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Info
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No financial records found
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.patient.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.patient.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {record.description}
                                                    </div>
                                                    {record.appointment && (
                                                        <div className="text-sm text-gray-500">
                                                            Service: {record.appointment.service.name}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-400 flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(record.transaction_date)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {formatCurrency(record.amount)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {getPaymentMethodDisplay(record.payment_method)}
                                                </div>
                                                {record.payment_method && (
                                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                                        <CreditCard className="w-3 h-3 mr-1" />
                                                        Payment method
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.payment_status)}`}>
                                                    {paymentStatuses.find(s => s.value === record.payment_status)?.label || record.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/financial-records/${record.id}`}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {record.payment_status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(record)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Mark as Paid"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Record Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                {isEditMode ? 'Edit Financial Record' : 'Add New Transaction'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Patient & Appointment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient *
                                        </label>
                                        <select
                                            value={formData.patient_id}
                                            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.patient_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">Select patient</option>
                                            {patients.map(patient => (
                                                <option key={patient.id} value={patient.id.toString()}>
                                                    {patient.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.patient_id && (
                                            <p className="text-red-500 text-sm mt-1">{getErr(formErrors.patient_id)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Related Appointment (Optional)
                                        </label>
                                        <select
                                            value={formData.appointment_id}
                                            onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select appointment</option>
                                            {appointments.map(appointment => (
                                                <option key={appointment.id} value={appointment.id.toString()}>
                                                    {appointment.patient.name} - {appointment.service.name} ({formatDate(appointment.appointment_date)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Amount & Description */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount (₱) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.amount ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="0.00"
                                        />
                                        {formErrors.amount && (
                                            <p className="text-red-500 text-sm mt-1">{getErr(formErrors.amount)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Transaction Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.transaction_date}
                                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.transaction_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.transaction_date && (
                                            <p className="text-red-500 text-sm mt-1">{getErr(formErrors.transaction_date)}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter transaction description"
                                    />
                                    {formErrors.description && (
                                        <p className="text-red-500 text-sm mt-1">{getErr(formErrors.description)}</p>
                                    )}
                                </div>

                                {/* Payment Status & Method */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Status *
                                        </label>
                                        <select
                                            value={formData.payment_status}
                                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.payment_status ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            {paymentStatuses.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                        {formErrors.payment_status && (
                                            <p className="text-red-500 text-sm mt-1">{getErr(formErrors.payment_status)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select payment method</option>
                                            {paymentMethods.map(method => (
                                                <option key={method.value} value={method.value}>{method.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter additional notes"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setFormData(initialFormData);
                                            setFormErrors({});
                                            setSelectedRecord(null);
                                            setIsEditMode(false);
                                        }}
                                        className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        {isEditMode ? 'Update' : 'Create'} Transaction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}