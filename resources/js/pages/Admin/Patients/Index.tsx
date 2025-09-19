import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiAdmin from '@/services/ApiAdmin';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Heart,
    Shield,
    RefreshCw,
    Download,
    UserCheck,
    UserX,
    MoreHorizontal,
    Activity,
    AlertCircle
} from 'lucide-react';

// TypeScript interfaces
interface Patient {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: 'active' | 'inactive';
    created_at: string;
    patient?: {
        birthday: string;
        gender: 'male' | 'female' | 'other';
        emergency_contact_name: string;
        emergency_contact_phone: string;
        emergency_contact_relationship: string;
        insurance_provider: string;
        insurance_number: string;
        medical_history: string;
        allergies: string;
        current_medications: string;
        blood_type: string;
    };
    appointments_count?: number;
    last_appointment?: string;
}

interface PatientFilters {
    search: string;
    status: string;
    gender: string;
}

interface PatientFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    password_confirmation: string;
    status: string; // Add this field
    birthday: string;
    gender: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    insurance_provider: string;
    insurance_number: string;
    medical_history: string;
    allergies: string;
    current_medications: string;
    blood_type: string;
}
const initialFormData: PatientFormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    password_confirmation: '',
    status: 'active', // Add default status
    birthday: '',
    gender: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    insurance_provider: '',
    insurance_number: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    blood_type: ''
};
const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
];

const bloodTypeOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Patient Records', href: '/admin/patients' }
];

export default function PatientRecordsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<PatientFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [filters, setFilters] = useState<PatientFilters>({
        search: '',
        status: '',
        gender: ''
    });

    // Fetch patients from API
    const fetchPatients = async () => {
        try {
            setLoading(true);
            // Use the patients endpoint instead of users with role filter
            const response = await apiAdmin.getPatients(filters);
            setPatients(response.patients || response.data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
            // Fallback to users API with patient filter
            try {
                const fallbackResponse = await apiAdmin.getUsers({
                    ...filters,
                    role: 'patient'
                });
                setPatients(fallbackResponse.data || fallbackResponse.users || []);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [filters]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        try {
            if (isEditMode && selectedPatient) {
                // For editing, use the update patient endpoint
                await apiAdmin.updatePatient(selectedPatient.id, formData);
            } else {
                // For creating, use the create patient endpoint or create user with role patient
                try {
                    await apiAdmin.createPatient(formData);
                } catch (error) {
                    // Fallback to user creation with role
                    await apiAdmin.createUser({
                        ...formData,
                        role: 'patient'
                    });
                }
            }

            setIsModalOpen(false);
            setFormData(initialFormData);
            setSelectedPatient(null);
            setIsEditMode(false);
            fetchPatients();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
        }
    };

    // Handle patient deletion
    const handleDelete = async (patient: Patient) => {
        try {
            // Try patient-specific delete first, fallback to user delete
            try {
                await apiAdmin.deletePatient(patient.id, patient.name);
            } catch (error) {
                await apiAdmin.deleteUser(patient.id, patient.name);
            }
            fetchPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    // Handle edit
    const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
        setFormData({
            name: patient.name,
            email: patient.email,
            phone: patient.phone || '',
            address: patient.address || '',
            password: '',
            password_confirmation: '',
            status: patient.status || 'active', // Add status field
            birthday: patient.patient?.birthday || '',
            gender: patient.patient?.gender || '',
            emergency_contact_name: patient.patient?.emergency_contact_name || '',
            emergency_contact_phone: patient.patient?.emergency_contact_phone || '',
            emergency_contact_relationship: patient.patient?.emergency_contact_relationship || '',
            insurance_provider: patient.patient?.insurance_provider || '',
            insurance_number: patient.patient?.insurance_number || '',
            medical_history: patient.patient?.medical_history || '',
            allergies: patient.patient?.allergies || '',
            current_medications: patient.patient?.current_medications || '',
            blood_type: patient.patient?.blood_type || ''
        });
        setIsEditMode(true);
        setIsModalOpen(true);
        setFormErrors({});
    };

    // Handle create new
    const handleCreateNew = () => {
        setSelectedPatient(null);
        setFormData(initialFormData);
        setIsEditMode(false);
        setIsModalOpen(true);
        setFormErrors({});
    };

    // Handle filter change
    const handleFilterChange = (key: keyof PatientFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({ search: '', status: '', gender: '' });
    };

    // Toggle patient status - Fixed to use updateUser/updatePatient
    const handleToggleStatus = async (patient: Patient) => {
        try {
            const newStatus = patient.status === 'active' ? 'inactive' : 'active';
            
            // Try patient-specific update first, fallback to user update
            try {
                await apiAdmin.updatePatient(patient.id, { status: newStatus });
            } catch (error) {
                await apiAdmin.updateUser(patient.id, { status: newStatus });
            }
            
            fetchPatients();
        } catch (error) {
            console.error('Error toggling patient status:', error);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH');
    };

    // Calculate age
    const calculateAge = (birthday: string) => {
        if (!birthday) return null;
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patient Records Management" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
                        <p className="text-gray-600">Manage patient information and medical records</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchPatients}
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
                            Add Patient
                        </button>
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
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select
                                value={filters.gender}
                                onChange={(e) => handleFilterChange('gender', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Genders</option>
                                {genderOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
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

                {/* Patients Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Demographics
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
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No patients found
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Users className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {patient.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {patient.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                        {patient.email}
                                                    </div>
                                                    {patient.phone && (
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                            {patient.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {patient.patient?.gender && (
                                                        <div className="text-sm text-gray-900">
                                                            {patient.patient.gender.charAt(0).toUpperCase() + patient.patient.gender.slice(1)}
                                                        </div>
                                                    )}
                                                    {patient.patient?.birthday && (
                                                        <div className="text-sm text-gray-500">
                                                            Age: {calculateAge(patient.patient.birthday)}
                                                        </div>
                                                    )}
                                                    {patient.patient?.blood_type && (
                                                        <div className="text-sm text-gray-500">
                                                            Blood: {patient.patient.blood_type}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    patient.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                              
                                                    <button
                                                        onClick={() => handleEdit(patient)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(patient)}
                                                        className={`p-1 rounded ${
                                                            patient.status === 'active'
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        title={patient.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {patient.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(patient)}
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
                </div>
            </div>

            {/* Patient Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                {isEditMode ? 'Edit Patient' : 'Add New Patient'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter full name"
                                            />
                                            {formErrors.name && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.name[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter email address"
                                            />
                                            {formErrors.email && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.email[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter phone number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Login Credentials (only for new patients) */}
                                {!isEditMode && (
                                    <div>
                                        <h3 className="text-md font-medium text-gray-900 mb-4">Login Credentials</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                        formErrors.password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter password"
                                                />
                                                {formErrors.password && (
                                                    <p className="text-red-500 text-sm mt-1">{formErrors.password[0]}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Confirm Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={formData.password_confirmation}
                                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Confirm password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Date of Birth
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birthday}
                                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Gender
                                            </label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select gender</option>
                                                {genderOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Blood Type
                                            </label>
                                            <select
                                                value={formData.blood_type}
                                                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select blood type</option>
                                                {bloodTypeOptions.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_name}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter contact name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_contact_phone}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter contact phone"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Relationship
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_relationship}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Spouse, Parent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance Information */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 mb-4">Insurance Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Insurance Provider
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.insurance_provider}
                                                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter insurance provider"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Insurance Number
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.insurance_number}
                                                onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter insurance number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 mb-4">Medical Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Medical History
                                            </label>
                                            <textarea
                                                value={formData.medical_history}
                                                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter medical history"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Allergies
                                            </label>
                                            <textarea
                                                value={formData.allergies}
                                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter known allergies"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Current Medications
                                            </label>
                                            <textarea
                                                value={formData.current_medications}
                                                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter current medications"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setFormData(initialFormData);
                                            setFormErrors({});
                                            setSelectedPatient(null);
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
                                        {isEditMode ? 'Update' : 'Create'} Patient
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