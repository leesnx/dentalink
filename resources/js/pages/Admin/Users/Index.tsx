import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiAdmin from '@/services/ApiAdmin';
import { 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    Eye, 
    UserCheck,
    UserX,
    Key,
    MoreHorizontal,
    Download,
    RefreshCw,
    Users,
    Shield,
    User,
    Mail,
    Phone,
    Calendar,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';


// TypeScript interfaces
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
    status: string;
    employee_id?: string;
    position?: string;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
    email_verified_at?: string;
}

interface UserFilters {
    search: string;
    role: string;
    status: string;
}

interface UserFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    status: string;
    password?: string;
    password_confirmation?: string;
    employee_id?: string;
    position?: string;
}

const initialFormData: UserFormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'patient',
    status: 'active',
    password: '',
    password_confirmation: '',
    employee_id: '',
    position: ''
};

const userRoles = [
    { value: 'admin', label: 'Administrator', icon: Shield },
    { value: 'staff', label: 'Staff Member', icon: UserCheck },
    { value: 'patient', label: 'Patient', icon: User }
];

const staffPositions = [
    { value: 'dentist', label: 'Dentist' },
    { value: 'hygienist', label: 'Dental Hygienist' },
    { value: 'assistant', label: 'Dental Assistant' },
    { value: 'receptionist', label: 'Receptionist' }
];

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Users', href: '/admin/users' }
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [formData, setFormData] = useState<UserFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        role: '',
        status: ''
    });
    const [stats, setStats] = useState({
        total_users: 0,
        total_patients: 0,
        total_staff: 0,
        total_admins: 0,
        active_users: 0,
        inactive_users: 0
    });
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Fetch users from API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiAdmin.getUsers(filters);
            setUsers(response.data || response.users || []);
            setStats(response.stats || stats);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        try {
            const userData = { ...formData };
            
            // Remove password fields if empty during edit
            if (isEditMode && !userData.password) {
                delete userData.password;
                delete userData.password_confirmation;
            }

            if (isEditMode && selectedUser) {
                await apiAdmin.updateUser(selectedUser.id, userData);
            } else {
                await apiAdmin.createUser(userData);
            }

            setIsModalOpen(false);
            setFormData(initialFormData);
            setSelectedUser(null);
            setIsEditMode(false);
            fetchUsers();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
        }
    };

    // Handle user deletion
    const handleDelete = async (user: User) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
            return;
        }

        try {
            await apiAdmin.deleteUser(user.id);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    // Handle edit
    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            role: user.role,
            status: user.status,
            employee_id: user.employee_id || '',
            position: user.position || '',
            password: '',
            password_confirmation: ''
        });
        setIsEditMode(true);
        setIsModalOpen(true);
        setFormErrors({});
    };

    // Handle create new
    const handleCreateNew = () => {
        setSelectedUser(null);
        setFormData(initialFormData);
        setIsEditMode(false);
        setIsModalOpen(true);
        setFormErrors({});
    };

    // Handle user status toggle - Fixed to use updateUser
    const handleStatusToggle = async (user: User) => {
        try {
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            await apiAdmin.updateUser(user.id, { status: newStatus });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    // Handle password reset - Fixed to use updateUser
    const handlePasswordReset = async (user: User) => {
        if (!window.confirm(`Reset password for ${user.name}? A new temporary password will be generated.`)) {
            return;
        }

        try {
            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            
            await apiAdmin.updateUser(user.id, { 
                password: tempPassword,
                password_confirmation: tempPassword
            });
            
            alert(`Password reset successfully. New temporary password: ${tempPassword}\nPlease share this securely with the user.`);
            fetchUsers();
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Error resetting password. Please try again.');
        }
    };

    // Handle filter change
    const handleFilterChange = (key: keyof UserFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({ search: '', role: '', status: '' });
    };

    // Handle bulk selection
    const handleSelectUser = (userId: number) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    // Handle bulk actions - Fixed to use individual updateUser calls
    const handleBulkActivate = async () => {
        if (!window.confirm(`Activate ${selectedUsers.length} selected users?`)) {
            return;
        }

        try {
            // Update each user individually
            const promises = selectedUsers.map(userId => 
                apiAdmin.updateUser(userId, { status: 'active' })
            );
            
            await Promise.all(promises);
            setSelectedUsers([]);
            fetchUsers();
        } catch (error) {
            console.error('Error bulk activating users:', error);
        }
    };

    const handleBulkDeactivate = async () => {
        if (!window.confirm(`Deactivate ${selectedUsers.length} selected users?`)) {
            return;
        }

        try {
            // Update each user individually
            const promises = selectedUsers.map(userId => 
                apiAdmin.updateUser(userId, { status: 'inactive' })
            );
            
            await Promise.all(promises);
            setSelectedUsers([]);
            fetchUsers();
        } catch (error) {
            console.error('Error bulk deactivating users:', error);
        }
    };

    // Export users - Simplified implementation
    const handleExport = async () => {
        try {
            // Create CSV content
            const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Employee ID', 'Position', 'Created At'];
            const csvContent = [
                headers.join(','),
                ...users.map(user => [
                    user.id,
                    `"${user.name}"`,
                    user.email,
                    user.role,
                    user.status,
                    user.phone || '',
                    user.employee_id || '',
                    user.position || '',
                    user.created_at
                ].join(','))
            ].join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting users:', error);
        }
    };

    const getRoleColor = (role: string) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            staff: 'bg-blue-100 text-blue-800',
            patient: 'bg-green-100 text-green-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getRoleIcon = (role: string) => {
        const roleConfig = userRoles.find(r => r.value === role);
        const IconComponent = roleConfig?.icon || User;
        return <IconComponent className="w-4 h-4" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Management" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                        <p className="text-gray-600">Manage system users, roles, and permissions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedUsers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {selectedUsers.length} selected
                                </span>
                                <button
                                    onClick={handleBulkActivate}
                                    className="flex items-center gap-2 px-3 py-2 text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Activate
                                </button>
                                <button
                                    onClick={handleBulkDeactivate}
                                    className="flex items-center gap-2 px-3 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                                >
                                    <UserX className="w-4 h-4" />
                                    Deactivate
                                </button>
                            </div>
                        )}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={fetchUsers}
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
                            Add User
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Total Users</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total_users}</p>
                            </div>
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Patients</p>
                                <p className="text-xl font-bold text-green-900">{stats.total_patients}</p>
                            </div>
                            <User className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Staff</p>
                                <p className="text-xl font-bold text-blue-900">{stats.total_staff}</p>
                            </div>
                            <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Admins</p>
                                <p className="text-xl font-bold text-red-900">{stats.total_admins}</p>
                            </div>
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Active</p>
                                <p className="text-xl font-bold text-green-900">{stats.active_users}</p>
                            </div>
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Inactive</p>
                                <p className="text-xl font-bold text-red-900">{stats.inactive_users}</p>
                            </div>
                            <XCircle className="w-6 h-6 text-red-600" />
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
                                    placeholder="Search users by name, email, or employee ID..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={filters.role}
                                onChange={(e) => handleFilterChange('role', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Roles</option>
                                {userRoles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
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

                {/* Users Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                        {user.employee_id && (
                                                            <div className="text-xs text-gray-400">
                                                                ID: {user.employee_id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                                        {getRoleIcon(user.role)}
                                                        {userRoles.find(r => r.value === user.role)?.label || user.role}
                                                    </span>
                                                </div>
                                                {user.position && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {staffPositions.find(p => p.value === user.position)?.label || user.position}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{user.email}</span>
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{user.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                        user.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                {user.email_verified_at ? (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                        <span className="text-xs text-gray-500">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-xs text-gray-500">Unverified</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {formatDate(user.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusToggle(user)}
                                                        className={`p-1 rounded ${
                                                            user.status === 'active'
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePasswordReset(user)}
                                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete User"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {isEditMode ? 'Edit User' : 'Add New User'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* General Error Message */}
                                {formErrors.general && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex">
                                            <AlertCircle className="w-4 h-4 text-red-400 mr-2 mt-0.5" />
                                            <p className="text-sm text-red-800">{formErrors.general[0]}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
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

                                    {/* Email */}
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

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter phone number"
                                        />
                                        {formErrors.phone && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.phone[0]}</p>
                                        )}
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.role ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            {userRoles.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                        {formErrors.role && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.role[0]}</p>
                                        )}
                                    </div>

                                    {/* Staff specific fields */}
                                    {formData.role === 'staff' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Employee ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.employee_id || ''}
                                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                        formErrors.employee_id ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter employee ID"
                                                />
                                                {formErrors.employee_id && (
                                                    <p className="text-red-500 text-sm mt-1">{formErrors.employee_id[0]}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Position
                                                </label>
                                                <select
                                                    value={formData.position || ''}
                                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                        formErrors.position ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">Select Position</option>
                                                    {staffPositions.map(position => (
                                                        <option key={position.value} value={position.value}>{position.label}</option>
                                                    ))}
                                                </select>
                                                {formErrors.position && (
                                                    <p className="text-red-500 text-sm mt-1">{formErrors.position[0]}</p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status *
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.status ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {formErrors.status && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.status[0]}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter address"
                                    />
                                    {formErrors.address && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.address[0]}</p>
                                    )}
                                </div>

                                {/* Password fields */}
                                {(!isEditMode || (isEditMode && formData.password)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password {!isEditMode && '*'}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password || ''}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                                            />
                                            {formErrors.password && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.password[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm Password {!isEditMode && '*'}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password_confirmation || ''}
                                                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    formErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder={isEditMode ? "Leave blank to keep current password" : "Confirm password"}
                                            />
                                            {formErrors.password_confirmation && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.password_confirmation[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isEditMode && !formData.password && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            Leave password fields empty to keep the current password unchanged.
                                        </p>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setFormData(initialFormData);
                                            setFormErrors({});
                                            setSelectedUser(null);
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
                                        {isEditMode ? 'Update' : 'Create'} User
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