// components/ScheduleModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, Save, AlertTriangle } from 'lucide-react';
import { driversApi, vehiclesApi } from '@/utils/api';

interface Driver {
    id: number;
    name: string;
    phone: string;
    license_number: string;
    performance_rating: number;
}

interface Vehicle {
    id: number;
    plate_number: string;
    make: string;
    model: string;
    status: string;
}

interface ScheduleFormData {
    driver_id: string;
    vehicle_id: string;
    schedule_date: string;
    shift_start: string;
    shift_end: string;
    break_start: string;
    break_end: string;
    shift_type: 'morning' | 'afternoon' | 'night' | 'full_day';
    notes: string;
}

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    schedule?: any; // Existing schedule for editing
    loading?: boolean;
}

export default function ScheduleModal({ isOpen, onClose, onSubmit, schedule, loading = false }: ScheduleModalProps) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [formData, setFormData] = useState<ScheduleFormData>({
        driver_id: '',
        vehicle_id: '',
        schedule_date: new Date().toISOString().split('T')[0],
        shift_start: '08:00',
        shift_end: '16:00',
        break_start: '12:00',
        break_end: '13:00',
        shift_type: 'morning',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (schedule) {
                setFormData({
                    driver_id: schedule.driver_id.toString(),
                    vehicle_id: schedule.vehicle_id.toString(),
                    schedule_date: schedule.schedule_date,
                    shift_start: new Date(schedule.shift_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    shift_end: new Date(schedule.shift_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    break_start: schedule.break_start ? new Date(schedule.break_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '12:00',
                    break_end: schedule.break_end ? new Date(schedule.break_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '13:00',
                    shift_type: schedule.shift_type,
                    notes: schedule.notes || ''
                });
            }
        }
    }, [isOpen, schedule]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [driversResponse, vehiclesResponse] = await Promise.all([
                driversApi.getAll({ status: 'active' }),
                vehiclesApi.getAvailable()
            ]);

            if (driversResponse.success && driversResponse.data) {
                setDrivers(driversResponse.data);
            }
            if (vehiclesResponse.success && vehiclesResponse.data) {
                setVehicles(vehiclesResponse.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.driver_id) newErrors.driver_id = 'Driver is required';
        if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required';
        if (!formData.schedule_date) newErrors.schedule_date = 'Date is required';
        if (!formData.shift_start) newErrors.shift_start = 'Start time is required';
        if (!formData.shift_end) newErrors.shift_end = 'End time is required';

        // Validate time logic
        if (formData.shift_start && formData.shift_end) {
            const startTime = new Date(`2000-01-01T${formData.shift_start}`);
            const endTime = new Date(`2000-01-01T${formData.shift_end}`);
            
            if (startTime >= endTime) {
                newErrors.shift_end = 'End time must be after start time';
            }
        }

        // Validate break times
        if (formData.break_start && formData.break_end) {
            const breakStart = new Date(`2000-01-01T${formData.break_start}`);
            const breakEnd = new Date(`2000-01-01T${formData.break_end}`);
            const shiftStart = new Date(`2000-01-01T${formData.shift_start}`);
            const shiftEnd = new Date(`2000-01-01T${formData.shift_end}`);

            if (breakStart >= breakEnd) {
                newErrors.break_end = 'Break end must be after break start';
            }
            if (breakStart < shiftStart || breakEnd > shiftEnd) {
                newErrors.break_start = 'Break times must be within shift hours';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        const submitData = {
            ...formData,
            driver_id: parseInt(formData.driver_id),
            vehicle_id: parseInt(formData.vehicle_id),
            shift_start: `${formData.schedule_date}T${formData.shift_start}:00`,
            shift_end: `${formData.schedule_date}T${formData.shift_end}:00`,
            break_start: formData.break_start ? `${formData.schedule_date}T${formData.break_start}:00` : null,
            break_end: formData.break_end ? `${formData.schedule_date}T${formData.break_end}:00` : null,
        };

        onSubmit(submitData);
    };

    const updateFormData = (field: keyof ScheduleFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {schedule ? 'Edit Schedule' : 'Create New Schedule'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Driver and Vehicle Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                Driver *
                            </label>
                            <select
                                value={formData.driver_id}
                                onChange={(e) => updateFormData('driver_id', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.driver_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loadingData}
                            >
                                <option value="">Select a driver</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name} - {driver.license_number} (★{driver.performance_rating.toFixed(1)})
                                    </option>
                                ))}
                            </select>
                            {errors.driver_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.driver_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Car className="h-4 w-4 inline mr-1" />
                                Vehicle *
                            </label>
                            <select
                                value={formData.vehicle_id}
                                onChange={(e) => updateFormData('vehicle_id', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.vehicle_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loadingData}
                            >
                                <option value="">Select a vehicle</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                    </option>
                                ))}
                            </select>
                            {errors.vehicle_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.vehicle_id}</p>
                            )}
                        </div>
                    </div>

                    {/* Date and Shift Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Schedule Date *
                            </label>
                            <input
                                type="date"
                                value={formData.schedule_date}
                                onChange={(e) => updateFormData('schedule_date', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.schedule_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.schedule_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.schedule_date}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shift Type *
                            </label>
                            <select
                                value={formData.shift_type}
                                onChange={(e) => updateFormData('shift_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="morning">Morning Shift</option>
                                <option value="afternoon">Afternoon Shift</option>
                                <option value="night">Night Shift</option>
                                <option value="full_day">Full Day</option>
                            </select>
                        </div>
                    </div>

                    {/* Shift Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Shift Start *
                            </label>
                            <input
                                type="time"
                                value={formData.shift_start}
                                onChange={(e) => updateFormData('shift_start', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.shift_start ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.shift_start && (
                                <p className="text-red-500 text-xs mt-1">{errors.shift_start}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Shift End *
                            </label>
                            <input
                                type="time"
                                value={formData.shift_end}
                                onChange={(e) => updateFormData('shift_end', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.shift_end ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.shift_end && (
                                <p className="text-red-500 text-xs mt-1">{errors.shift_end}</p>
                            )}
                        </div>
                    </div>

                    {/* Break Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Break Start
                            </label>
                            <input
                                type="time"
                                value={formData.break_start}
                                onChange={(e) => updateFormData('break_start', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.break_start ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.break_start && (
                                <p className="text-red-500 text-xs mt-1">{errors.break_start}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Break End
                            </label>
                            <input
                                type="time"
                                value={formData.break_end}
                                onChange={(e) => updateFormData('break_end', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.break_end ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.break_end && (
                                <p className="text-red-500 text-xs mt-1">{errors.break_end}</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => updateFormData('notes', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Any additional notes or instructions..."
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || loadingData}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}