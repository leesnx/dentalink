import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import apiAdmin from '@/services/ApiAdmin';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  Phone,
  RefreshCw,
  Activity,
  User
} from 'lucide-react';

// ---------- Types ----------
interface Appointment {
  id: number;
  patient: { id: number; name: string; phone: string };
  doctor: { id: number; name: string };
  service: { id: number; name: string; duration_minutes: number; price: number };
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason_for_visit: string;
  notes: string;
  created_at: string;
}

interface AppointmentFilters {
  date: string;
  status: string;
  doctor: string;
  patient: string;
}

interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  reason_for_visit: string;
  notes: string;
  status?: string;
}

interface Doctor { 
  id: number; 
  name: string; 
  position: string;
}

interface Patient { 
  id: number; 
  name: string; 
  email: string; 
  phone: string;
}

interface Service { 
  id: number; 
  name: string; 
  duration_minutes: number; 
  price: number;
}

// ---------- Constants ----------
const initialFormData: AppointmentFormData = {
  patient_id: '',
  doctor_id: '',
  service_id: '',
  appointment_date: '',
  appointment_time: '',
  reason_for_visit: '',
  notes: '',
  status: 'scheduled'
};

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
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'Appointments', href: '/admin/appointments' }
];

// ---------- Helper Functions ----------
const unwrapList = <T,>(res: any, keys: string[] = ['appointments', 'users', 'services']): T[] => {
  if (!res) return [];
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  for (const k of keys) {
    if (Array.isArray(res?.[k])) return res[k];
    if (Array.isArray(res?.data?.[k])) return res.data[k];
  }
  return [];
};

const getErr = (val?: any) => (Array.isArray(val) ? val[0] : val) as string | undefined;

const formatDateTime = (date: string, time: string) => {
  const t = time?.length > 5 ? time.slice(0, 5) : time;
  return new Date(`${date} ${t}`).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const getStatusColor = (status: string) =>
  appointmentStatuses.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';

// ---------- Main Component ----------
export default function AppointmentsPage() {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, any>>({});

  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({
    date: new Date().toISOString().split('T')[0],
    status: '',
    doctor: '',
    patient: ''
  });

  // Stats state
  const [stats, setStats] = useState({ 
    today: 0, 
    thisWeek: 0, 
    completed: 0, 
    cancelled: 0 
  });

  // ---------- API Functions ----------
  
  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointments with filters:', filters);
      
      const response = await apiAdmin.getAppointments(filters);
      console.log('Raw API response:', response);
      
      // Handle different response structures
      let appointmentsList = [];
      let statsData = {};
      
      if (response?.data) {
        appointmentsList = Array.isArray(response.data) ? response.data : (response.data.data || response.data.appointments || []);
        statsData = response.data.stats || response.stats || {};
      } else {
        appointmentsList = response.appointments || response || [];
        statsData = response.stats || {};
      }
      
      console.log('Processed appointments:', appointmentsList);
      console.log('Processed stats:', statsData);
      
      setAppointments(appointmentsList);
      
      if (statsData && Object.keys(statsData).length > 0) {
        setStats({
          today: Number(statsData.today || 0),
          thisWeek: Number(statsData.thisWeek || 0),
          completed: Number(statsData.completed || 0),
          cancelled: Number(statsData.cancelled || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setAppointments([]);
      
      // Show user-friendly error message
      if (error.response?.status === 500) {
        console.error('Server error - check Laravel logs');
      } else if (error.response?.status === 422) {
        console.error('Validation error:', error.response.data);
      } else if (!error.response) {
        console.error('Network error - check connection');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown data for forms
  const fetchDropdownData = async () => {
    try {
      const [doctorsRes, patientsRes, servicesRes] = await Promise.all([
        apiAdmin.getUsers({ role: 'staff' }),
        apiAdmin.getUsers({ role: 'patient' }),
        apiAdmin.getServices({ is_active: 1 })
      ]);

      // Extract doctors from staff users
      const staffUsers = unwrapList<any>(doctorsRes, ['users', 'data']);
      const doctorsOnly = staffUsers.filter(user => user.position === 'dentist' || user.role === 'staff');
      
      setDoctors(doctorsOnly);
      setPatients(unwrapList<Patient>(patientsRes, ['users']));
      setServices(unwrapList<Service>(servicesRes, ['services']));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setDoctors([]);
      setPatients([]);
      setServices([]);
    }
  };

  // Effects
  useEffect(() => { 
    fetchDropdownData(); 
  }, []);
  
  useEffect(() => { 
    fetchAppointments(); 
  }, [filters]);

  // ---------- Form Handlers ----------
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      const submitData = {
        ...formData,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time
      };

      if (isEditMode && selectedAppointment) {
        console.log('Updating appointment:', selectedAppointment.id, submitData);
        await apiAdmin.updateAppointment(selectedAppointment.id, submitData);
      } else {
        console.log('Creating appointment:', submitData);
        await apiAdmin.createAppointment(submitData);
      }
      
      // Close modal and reset form (API already shows success message)
      setIsModalOpen(false);
      setFormData(initialFormData);
      setSelectedAppointment(null);
      setIsEditMode(false);
      
      // Refresh appointments list
      await fetchAppointments();
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Only handle validation errors - API handles other error messages
      if (error?.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  // Handle appointment deletion
  const handleDelete = async (appointment: Appointment) => {
    try {
      // API already handles confirmation dialog
      await apiAdmin.deleteAppointment(appointment.id, `${appointment.patient.name}'s appointment`);
      await fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      // API already shows error message
    }
  };

  // Handle edit appointment
  const handleEdit = async (appointment: Appointment) => {
    console.log('Editing appointment:', appointment);
    
    setSelectedAppointment(appointment);
    
    // Format the time to HH:MM format
    let timeValue = appointment.appointment_time;
    if (timeValue && timeValue.includes(' ')) {
      timeValue = timeValue.split(' ')[1];
    }
    if (timeValue && timeValue.length > 5) {
      timeValue = timeValue.slice(0, 5);
    }
    
    setFormData({
      patient_id: appointment.patient.id.toString(),
      doctor_id: appointment.doctor.id.toString(),
      service_id: appointment.service.id.toString(),
      appointment_date: appointment.appointment_date.split('T')[0],
      appointment_time: timeValue || '',
      reason_for_visit: appointment.reason_for_visit || '',
      notes: appointment.notes || '',
      status: appointment.status
    });
    
    setIsEditMode(true);
    setFormErrors({});
    await fetchDropdownData();
    setIsModalOpen(true);
  };

  // Handle create new appointment
  const handleCreateNew = async () => {
    setSelectedAppointment(null);
    setFormData(initialFormData);
    setIsEditMode(false);
    setFormErrors({});
    await fetchDropdownData();
    setIsModalOpen(true);
  };

  // ---------- Filter Handlers ----------
  
  const handleFilterChange = (key: keyof AppointmentFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({ date: new Date().toISOString().split('T')[0], status: '', doctor: '', patient: '' });

  // ---------- Status Action Handlers ----------
  
  const handleCheckIn = async (appointment: Appointment) => {
    try { 
      await apiAdmin.checkInAppointment(appointment.id);
      await fetchAppointments();
    } catch (error) { 
      console.error('Error checking in appointment:', error);
      // API already shows error message
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    try { 
      await apiAdmin.completeAppointment(appointment.id, 'Appointment completed successfully');
      await fetchAppointments();
    } catch (error) { 
      console.error('Error completing appointment:', error);
      // API already shows error message
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    try {
      await apiAdmin.cancelAppointment(appointment.id, 'Cancelled by admin');
      await fetchAppointments();
    } catch (error) { 
      console.error('Error cancelling appointment:', error);
      // API already shows error message
    }
  };

  // ---------- Render Component ----------
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Appointments Management" />

      <div className="flex flex-col gap-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments Management</h1>
            <p className="text-gray-600">Manage patient appointments and schedules</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAppointments}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={filters.patient}
                  onChange={(e) => handleFilterChange('patient', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              <select
                value={filters.doctor}
                onChange={(e) => handleFilterChange('doctor', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id.toString()}>Dr. {doctor.name}</option>
                ))}
              </select>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
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
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading appointments...
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No appointments found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters or create a new appointment</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                      {/* Patient Info */}
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

                      {/* Doctor & Service Info */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.service.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {appointment.service.duration_minutes} min • {formatCurrency(appointment.service.price)}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
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

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointmentStatuses.find(s => s.value === appointment.status)?.label || appointment.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleCheckIn(appointment)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Check In"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          
                          {appointment.status === 'in_progress' && (
                            <button
                              onClick={() => handleComplete(appointment)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {['scheduled', 'confirmed'].includes(appointment.status) && (
                            <button
                              onClick={() => handleCancel(appointment)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(appointment)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {/* Appointment Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {isEditMode ? 'Edit Appointment' : 'Book New Appointment'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient & Doctor Row */}
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
                      required
                    >
                      <option value="">Select patient</option>
                      {patients.length === 0 ? (
                        <option value="" disabled>(No patients available)</option>
                      ) : (
                        patients.map(patient => (
                          <option key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </option>
                        ))
                      )}
                    </select>
                    {formErrors.patient_id && (
                      <p className="text-red-500 text-sm mt-1">{getErr(formErrors.patient_id)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor *
                    </label>
                    <select
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.doctor_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select doctor</option>
                      {doctors.length === 0 ? (
                        <option value="" disabled>(No doctors available)</option>
                      ) : (
                        doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id.toString()}>
                            Dr. {doctor.name}
                          </option>
                        ))
                      )}
                    </select>
                    {formErrors.doctor_id && (
                      <p className="text-red-500 text-sm mt-1">{getErr(formErrors.doctor_id)}</p>
                    )}
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service *
                  </label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.service_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select service</option>
                    {services.length === 0 ? (
                      <option value="" disabled>(No services available)</option>
                    ) : (
                      services.map(service => (
                        <option key={service.id} value={service.id.toString()}>
                          {service.name} - {service.duration_minutes} min ({formatCurrency(service.price)})
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.service_id && (
                    <p className="text-red-500 text-sm mt-1">{getErr(formErrors.service_id)}</p>
                  )}
                </div>

                {/* Status Field - Only show when editing */}
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status || 'scheduled'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.status ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {appointmentStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.status && (
                      <p className="text-red-500 text-sm mt-1">{getErr(formErrors.status)}</p>
                    )}
                  </div>
                )}

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.appointment_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.appointment_date && (
                      <p className="text-red-500 text-sm mt-1">{getErr(formErrors.appointment_date)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Time *
                    </label>
                    <input
                      type="time"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.appointment_time ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.appointment_time && (
                      <p className="text-red-500 text-sm mt-1">{getErr(formErrors.appointment_time)}</p>
                    )}
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit
                  </label>
                  <input
                    type="text"
                    value={formData.reason_for_visit}
                    onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reason for visit (optional)"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter additional notes (optional)"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData(initialFormData);
                      setFormErrors({});
                      setSelectedAppointment(null);
                      setIsEditMode(false);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isEditMode ? 'Update' : 'Book'} Appointment
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