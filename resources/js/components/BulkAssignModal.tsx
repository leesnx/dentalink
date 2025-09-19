// components/BulkAssignModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Copy, Users, Car, Calendar, Clock, Plus, Minus, Save, AlertTriangle } from 'lucide-react';
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

interface BulkAssignment {
    driver_id: number;
    vehicle_id: number;
    schedule_date: string;
    shift_start: string;
    shift_end: string;
    shift_type: 'morning' | 'afternoon' | 'night' | 'full_day';
    notes?: string;
}

interface BulkAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    loading?: boolean;
}

export default function BulkAssignModal({ isOpen, onClose, onSubmit, loading = false }: BulkAssignModalProps) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [assignments, setAssignments] = useState<BulkAssignment[]>([]);
    const [template, setTemplate] = useState({
        schedule_date: new Date().toISOString().split('T')[0],
        shift_start: '08:00',
        shift_end: '16:00',
        shift_type: 'morning' as const
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchData();
            // Initialize with one empty assignment
            setAssignments([createEmptyAssignment()]);
        }
    }, [isOpen]);

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

    const createEmptyAssignment = (): BulkAssignment => ({
        driver_id: 0,
        vehicle_id: 0,
        schedule_date: template.schedule_date,
        shift_start: template.shift_start,
        shift_end: template.shift_end,
        shift_type: template.shift_type,
        notes: ''
    });

    const addAssignment = () => {
        setAssignments(prev => [...prev, createEmptyAssignment()]);
    };

    const removeAssignment = (index: number) => {
        if (assignments.length > 1) {
            setAssignments(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateAssignment = (index: number, field: keyof BulkAssignment, value: any) => {
        setAssignments(prev => 
            prev.map((assignment, i) => 
                i === index ? { ...assignment, [field]: value } : assignment
            )
        );
        
        // Clear errors for this field
        const errorKey = `${index}.${field}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
    };

    const applyTemplate = () => {
        setAssignments(prev => 
            prev.map(assignment => ({
                ...assignment,
                schedule_date: template.schedule_date,
                shift_start: template.shift_start,
                shift_end: template.shift_end,
                shift_type: template.shift_type
            }))
        );
    };

    const validateAssignments = () => {
        const newErrors: Record<string, string> = {};
        const usedDrivers = new Set<number>();
        const usedVehicles = new Set<number>();

        assignments.forEach((assignment, index) => {
            // Required field validation
            if (!assignment.driver_id) {
                newErrors[`${index}.driver_id`] = 'Driver is required';
            } else if (usedDrivers.has(assignment.driver_id)) {
                newErrors[`${index}.driver_id`] = 'Driver already assigned';
            } else {
                usedDrivers.add(assignment.driver_id);
            }

            if (!assignment.vehicle_id) {
                newErrors[`${index}.vehicle_id`] = 'Vehicle is required';
            } else if (usedVehicles.has(assignment.vehicle_id)) {
                newErrors[`${index}.vehicle_id`] = 'Vehicle already assigned';
            } else {
                usedVehicles.add(assignment.vehicle_id);
            }

            if (!assignment.schedule_date) {
                newErrors[`${index}.schedule_date`] = 'Date is required';
            }

            if (!assignment.shift_start) {
                newErrors[`${index}.shift_start`] = 'Start time is required';
            }

            if (!assignment.shift_end) {
                newErrors[`${index}.shift_end`] = 'End time is required';
            }

            // Time validation
            if (assignment.shift_start && assignment.shift_end) {
                const startTime = new Date(`2000-01-01T${assignment.shift_start}`);
                const endTime = new Date(`2000-01-01T${assignment.shift_end}`);
                
                if (startTime >= endTime) {
                    newErrors[`${index}.shift_end`] = 'End time must be after start time';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateAssignments()) return;

        const submitData = {
            assignments: assignments.map(assignment => ({
                ...assignment,
                shift_start: `${assignment.schedule_date}T${assignment.shift_start}:00`,
                shift_end: `${assignment.schedule_date}T${assignment.shift_end}:00`,
            }))
        };

        onSubmit(submitData);
    };

    const getDriverName = (driverId: number) => {
        const driver = drivers.find(d => d.id === driverId);
        return driver ? `${driver.name} (★${driver.performance_rating.toFixed(1)})` : '';
    };

    const getVehicleName = (vehicleId: number) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? `${vehicle.plate_number} - ${vehicle.make} ${vehicle.model}` : '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold">Bulk Schedule Assignment</h2>
                        <p className="text-sm text-gray-500 mt-1">Assign multiple drivers to vehicles and shifts</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Template Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-800 mb-3">Assignment Template</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={template.schedule_date}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, schedule_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={template.shift_start}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, shift_start: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={template.shift_end}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, shift_end: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Shift Type
                                </label>
                                <select
                                    value={template.shift_type}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, shift_type: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="night">Night</option>
                                    <option value="full_day">Full Day</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={applyTemplate}
                            className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Copy className="h-4 w-4" />
                            Apply to All Assignments
                        </button>
                    </div>

                    {/* Assignments */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Driver-Vehicle Assignments ({assignments.length})</h3>
                            <button
                                type="button"
                                onClick={addAssignment}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Assignment
                            </button>
                        </div>

                        {assignments.map((assignment, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium">Assignment #{index + 1}</h4>
                                    {assignments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAssignment(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                    {/* Driver */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Users className="h-4 w-4 inline mr-1" />
                                            Driver *
                                        </label>
                                        <select
                                            value={assignment.driver_id}
                                            onChange={(e) => updateAssignment(index, 'driver_id', parseInt(e.target.value))}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors[`${index}.driver_id`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={loadingData}
                                        >
                                            <option value={0}>Select driver</option>
                                            {drivers.map((driver) => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.name} - {driver.license_number} (★{driver.performance_rating.toFixed(1)})
                                                </option>
                                            ))}
                                        </select>
                                        {errors[`${index}.driver_id`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`${index}.driver_id`]}</p>
                                        )}
                                    </div>

                                    {/* Vehicle */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Car className="h-4 w-4 inline mr-1" />
                                            Vehicle *
                                        </label>
                                        <select
                                            value={assignment.vehicle_id}
                                            onChange={(e) => updateAssignment(index, 'vehicle_id', parseInt(e.target.value))}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors[`${index}.vehicle_id`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={loadingData}
                                        >
                                            <option value={0}>Select vehicle</option>
                                            {vehicles.map((vehicle) => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                                </option>
                                            ))}
                                        </select>
                                        {errors[`${index}.vehicle_id`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`${index}.vehicle_id`]}</p>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            value={assignment.schedule_date}
                                            onChange={(e) => updateAssignment(index, 'schedule_date', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors[`${index}.schedule_date`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors[`${index}.schedule_date`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`${index}.schedule_date`]}</p>
                                        )}
                                    </div>

                                    {/* Shift Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                        <select
                                            value={assignment.shift_type}
                                            onChange={(e) => updateAssignment(index, 'shift_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="morning">Morning</option>
                                            <option value="afternoon">Afternoon</option>
                                            <option value="night">Night</option>
                                            <option value="full_day">Full Day</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Time Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                        <input
                                            type="time"
                                            value={assignment.shift_start}
                                            onChange={(e) => updateAssignment(index, 'shift_start', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors[`${index}.shift_start`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors[`${index}.shift_start`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`${index}.shift_start`]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                        <input
                                            type="time"
                                            value={assignment.shift_end}
                                            onChange={(e) => updateAssignment(index, 'shift_end', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors[`${index}.shift_end`] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors[`${index}.shift_end`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`${index}.shift_end`]}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        value={assignment.notes || ''}
                                        onChange={(e) => updateAssignment(index, 'notes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Optional notes for this assignment..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                        <h3 className="font-semibold mb-3">Assignment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Total Assignments:</span>
                                <span className="ml-2">{assignments.length}</span>
                            </div>
                            <div>
                                <span className="font-medium">Unique Drivers:</span>
                                <span className="ml-2">{new Set(assignments.map(a => a.driver_id).filter(id => id > 0)).size}</span>
                            </div>
                            <div>
                                <span className="font-medium">Unique Vehicles:</span>
                                <span className="ml-2">{new Set(assignments.map(a => a.vehicle_id).filter(id => id > 0)).size}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
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
                            disabled={loading || loadingData || assignments.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'Creating...' : `Create ${assignments.length} Assignment${assignments.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}