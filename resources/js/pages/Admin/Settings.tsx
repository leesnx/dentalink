import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Settings, Save, RefreshCw, Globe, Bell, Shield,
    Database, Clock, MapPin, Car, Users, Mail,
    Smartphone, AlertTriangle, CheckCircle, Eye,
    EyeOff, Upload, Download, Trash2, Plus,
    Server, Wifi, Lock, Key, Monitor, Loader2
} from 'lucide-react';
import { adminApi, handleApiError, showToast } from '@/utils/api';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'JTIMIS', href: '/' },
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Settings', href: '/admin/settings' }
];

interface SystemSettings {
    general: {
        system_name: string;
        company_name: string;
        timezone: string;
        default_language: string;
        date_format: string;
        currency: string;
        session_timeout: number;
    };
    notifications: {
        email_enabled: boolean;
        sms_enabled: boolean;
        push_enabled: boolean;
        emergency_alerts: boolean;
        maintenance_reminders: boolean;
        driver_notifications: boolean;
        email_smtp_host: string;
        email_smtp_port: number;
        sms_provider: string;
        sms_api_key: string;
    };
    fleet: {
        max_vehicles: number;
        max_drivers: number;
        gps_update_interval: number;
        emergency_response_time: number;
        maintenance_reminder_days: number;
        license_expiry_warning_days: number;
        insurance_expiry_warning_days: number;
        fuel_efficiency_threshold: number;
    };
    security: {
        password_min_length: number;
        password_require_uppercase: boolean;
        password_require_lowercase: boolean;
        password_require_numbers: boolean;
        password_require_special: boolean;
        max_login_attempts: number;
        lockout_duration: number;
        two_factor_enabled: boolean;
        session_encryption: boolean;
    };
    backup: {
        auto_backup_enabled: boolean;
        backup_frequency: string;
        backup_retention_days: number;
        backup_location: string;
        last_backup: string;
        backup_size: string;
    };
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showPasswords, setShowPasswords] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // This would fetch actual system settings
            // For now, using mock data
            const mockSettings: SystemSettings = {
                general: {
                    system_name: 'JTIMIS',
                    company_name: 'JTI Taxi Services',
                    timezone: 'Asia/Manila',
                    default_language: 'en',
                    date_format: 'MM/DD/YYYY',
                    currency: 'PHP',
                    session_timeout: 30
                },
                notifications: {
                    email_enabled: true,
                    sms_enabled: true,
                    push_enabled: true,
                    emergency_alerts: true,
                    maintenance_reminders: true,
                    driver_notifications: true,
                    email_smtp_host: 'smtp.gmail.com',
                    email_smtp_port: 587,
                    sms_provider: 'Twilio',
                    sms_api_key: '****-****-****'
                },
                fleet: {
                    max_vehicles: 100,
                    max_drivers: 150,
                    gps_update_interval: 30,
                    emergency_response_time: 5,
                    maintenance_reminder_days: 7,
                    license_expiry_warning_days: 30,
                    insurance_expiry_warning_days: 30,
                    fuel_efficiency_threshold: 10
                },
                security: {
                    password_min_length: 8,
                    password_require_uppercase: true,
                    password_require_lowercase: true,
                    password_require_numbers: true,
                    password_require_special: false,
                    max_login_attempts: 3,
                    lockout_duration: 15,
                    two_factor_enabled: false,
                    session_encryption: true
                },
                backup: {
                    auto_backup_enabled: true,
                    backup_frequency: 'daily',
                    backup_retention_days: 30,
                    backup_location: 'Local Server',
                    last_backup: '2024-01-15 02:00:00',
                    backup_size: '2.3 GB'
                }
            };
            setSettings(mockSettings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast('Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            // Implementation would save settings via API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
            showToast('Settings saved successfully', 'success');
            setUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (section: string, field: string, value: any) => {
        if (!settings) return;
        
        setSettings({
            ...settings,
            [section]: {
                ...settings[section as keyof SystemSettings],
                [field]: value
            }
        });
        setUnsavedChanges(true);
    };

    const handleBackupNow = async () => {
        try {
            showToast('Starting backup...', 'info');
            // Implementation would trigger backup
            await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
            showToast('Backup completed successfully', 'success');
            fetchSettings(); // Refresh to get updated backup info
        } catch (error) {
            showToast('Backup failed', 'error');
        }
    };

    const handleTestConnection = async (type: string) => {
        try {
            showToast(`Testing ${type} connection...`, 'info');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
            showToast(`${type} connection successful`, 'success');
        } catch (error) {
            showToast(`${type} connection failed`, 'error');
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Settings - JTIMIS" />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <div>Loading settings...</div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings - JTIMIS" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">System Settings</h1>
                        <p className="text-muted-foreground">Configure JTIMIS system preferences</p>
                    </div>
                    <div className="flex gap-2">
                        {unsavedChanges && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-700">Unsaved changes</span>
                            </div>
                        )}
                        <button
                            onClick={fetchSettings}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving || !unsavedChanges}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Settings Navigation */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border p-4">
                            <nav className="space-y-2">
                                {[
                                    { id: 'general', label: 'General', icon: Settings },
                                    { id: 'notifications', label: 'Notifications', icon: Bell },
                                    { id: 'fleet', label: 'Fleet Settings', icon: Car },
                                    { id: 'security', label: 'Security', icon: Shield },
                                    { id: 'backup', label: 'Backup', icon: Database }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg border p-6">
                            {/* General Settings */}
                            {activeTab === 'general' && settings && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">General Configuration</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    System Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.general.system_name}
                                                    onChange={(e) => handleInputChange('general', 'system_name', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Company Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.general.company_name}
                                                    onChange={(e) => handleInputChange('general', 'company_name', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Timezone
                                                </label>
                                                <select
                                                    value={settings.general.timezone}
                                                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Asia/Manila">Asia/Manila</option>
                                                    <option value="UTC">UTC</option>
                                                    <option value="Asia/Singapore">Asia/Singapore</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Currency
                                                </label>
                                                <select
                                                    value={settings.general.currency}
                                                    onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="PHP">PHP - Philippine Peso</option>
                                                    <option value="USD">USD - US Dollar</option>
                                                    <option value="SGD">SGD - Singapore Dollar</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Session Timeout (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.general.session_timeout}
                                                    onChange={(e) => handleInputChange('general', 'session_timeout', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Date Format
                                                </label>
                                                <select
                                                    value={settings.general.date_format}
                                                    onChange={(e) => handleInputChange('general', 'date_format', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Settings */}
                            {activeTab === 'notifications' && settings && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.email_enabled}
                                                        onChange={(e) => handleInputChange('notifications', 'email_enabled', e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <Mail className="h-5 w-5 text-blue-600" />
                                                    <span>Email Notifications</span>
                                                </label>

                                                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.sms_enabled}
                                                        onChange={(e) => handleInputChange('notifications', 'sms_enabled', e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <Smartphone className="h-5 w-5 text-green-600" />
                                                    <span>SMS Notifications</span>
                                                </label>

                                                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.push_enabled}
                                                        onChange={(e) => handleInputChange('notifications', 'push_enabled', e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <Bell className="h-5 w-5 text-purple-600" />
                                                    <span>Push Notifications</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3">Notification Types</h4>
                                        <div className="space-y-3">
                                            {[
                                                { key: 'emergency_alerts', label: 'Emergency Alerts', icon: AlertTriangle },
                                                { key: 'maintenance_reminders', label: 'Maintenance Reminders', icon: Car },
                                                { key: 'driver_notifications', label: 'Driver Notifications', icon: Users }
                                            ].map((item) => (
                                                <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                                                        onChange={(e) => handleInputChange('notifications', item.key, e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <item.icon className="h-4 w-4 text-gray-600" />
                                                    <span>{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-3">Email Configuration</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    SMTP Host
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={settings.notifications.email_smtp_host}
                                                        onChange={(e) => handleInputChange('notifications', 'email_smtp_host', e.target.value)}
                                                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <button
                                                        onClick={() => handleTestConnection('Email')}
                                                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    >
                                                        Test
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    SMTP Port
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.notifications.email_smtp_port}
                                                    onChange={(e) => handleInputChange('notifications', 'email_smtp_port', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fleet Settings */}
                            {activeTab === 'fleet' && settings && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Fleet Configuration</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Maximum Vehicles
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.max_vehicles}
                                                    onChange={(e) => handleInputChange('fleet', 'max_vehicles', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Maximum Drivers
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.max_drivers}
                                                    onChange={(e) => handleInputChange('fleet', 'max_drivers', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    GPS Update Interval (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.gps_update_interval}
                                                    onChange={(e) => handleInputChange('fleet', 'gps_update_interval', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Emergency Response Time (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.emergency_response_time}
                                                    onChange={(e) => handleInputChange('fleet', 'emergency_response_time', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Maintenance Reminder (days before)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.maintenance_reminder_days}
                                                    onChange={(e) => handleInputChange('fleet', 'maintenance_reminder_days', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fuel Efficiency Threshold (km/l)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={settings.fleet.fuel_efficiency_threshold}
                                                    onChange={(e) => handleInputChange('fleet', 'fuel_efficiency_threshold', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && settings && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Security Configuration</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-medium mb-3">Password Requirements</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Minimum Length
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={settings.security.password_min_length}
                                                            onChange={(e) => handleInputChange('security', 'password_min_length', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Max Login Attempts
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={settings.security.max_login_attempts}
                                                            onChange={(e) => handleInputChange('security', 'max_login_attempts', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                    {[
                                                        { key: 'password_require_uppercase', label: 'Uppercase' },
                                                        { key: 'password_require_lowercase', label: 'Lowercase' },
                                                        { key: 'password_require_numbers', label: 'Numbers' },
                                                        { key: 'password_require_special', label: 'Special Chars' }
                                                    ].map((item) => (
                                                        <label key={item.key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                                                                onChange={(e) => handleInputChange('security', item.key, e.target.checked)}
                                                                className="rounded"
                                                            />
                                                            <span className="text-sm">{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-3">Additional Security</h4>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.security.two_factor_enabled}
                                                            onChange={(e) => handleInputChange('security', 'two_factor_enabled', e.target.checked)}
                                                            className="rounded"
                                                        />
                                                        <Key className="h-4 w-4 text-blue-600" />
                                                        <span>Two-Factor Authentication</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.security.session_encryption}
                                                            onChange={(e) => handleInputChange('security', 'session_encryption', e.target.checked)}
                                                            className="rounded"
                                                        />
                                                        <Lock className="h-4 w-4 text-green-600" />
                                                        <span>Session Encryption</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Backup Settings */}
                            {activeTab === 'backup' && settings && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Backup Configuration</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Database className="h-5 w-5 text-blue-600" />
                                                    <div>
                                                        <div className="font-medium">Last Backup</div>
                                                        <div className="text-sm text-gray-600">
                                                            {settings.backup.last_backup} ({settings.backup.backup_size})
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleBackupNow}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Backup Now
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="flex items-center gap-3 mb-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.backup.auto_backup_enabled}
                                                            onChange={(e) => handleInputChange('backup', 'auto_backup_enabled', e.target.checked)}
                                                            className="rounded"
                                                        />
                                                        <span className="font-medium">Enable Auto Backup</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Backup Frequency
                                                    </label>
                                                    <select
                                                        value={settings.backup.backup_frequency}
                                                        onChange={(e) => handleInputChange('backup', 'backup_frequency', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Retention Period (days)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={settings.backup.backup_retention_days}
                                                        onChange={(e) => handleInputChange('backup', 'backup_retention_days', parseInt(e.target.value))}
                                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Backup Location
                                                    </label>
                                                    <select
                                                        value={settings.backup.backup_location}
                                                        onChange={(e) => handleInputChange('backup', 'backup_location', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="Local Server">Local Server</option>
                                                        <option value="Cloud Storage">Cloud Storage</option>
                                                        <option value="External Drive">External Drive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}