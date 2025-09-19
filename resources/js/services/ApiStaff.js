import axios from 'axios';
import Swal from 'sweetalert2';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// CSRF token setup
const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
           window.Laravel?.csrfToken ||
           document.querySelector('input[name="_token"]')?.value;
};

// Set CSRF token for all requests
axios.defaults.headers.common['X-CSRF-TOKEN'] = getCsrfToken();

// Request interceptor to ensure CSRF token is always included
axios.interceptors.request.use((config) => {
    const token = getCsrfToken();
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

// Response interceptor for error handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            Swal.fire({
                icon: 'error',
                title: 'Session Expired',
                text: 'Please refresh the page and try again.',
                confirmButtonColor: '#3B82F6'
            }).then(() => {
                window.location.reload();
            });
        } else if (error.response?.status === 403) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You do not have permission to perform this action.',
                confirmButtonColor: '#3B82F6'
            });
        }
        return Promise.reject(error);
    }
);

class ApiStaff {
    constructor() {
        // Using web routes directly
    }

    // ================================
    // STAFF DASHBOARD
    // ================================
    async getDashboardStats() {
        try {
            const response = await axios.get('/api/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff dashboard stats:', error);
            throw error;
        }
    }

    async getDashboardData() {
        try {
            const response = await axios.get('/api/dashboard/data');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    async getRecentActivity() {
        try {
            const response = await axios.get('/api/dashboard/recent-activity');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            throw error;
        }
    }

    // ================================
    // PATIENT MANAGEMENT
    // ================================
    async getPatients(params = {}) {
        try {
            const response = await axios.get('/patients', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    }

    async getPatient(id) {
        try {
            const response = await axios.get(`/patients/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient:', error);
            throw error;
        }
    }

    async createPatient(patientData) {
        try {
            const response = await axios.post('/patients', patientData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create patient.';
            const errors = error.response?.data?.errors || {};
            
            let errorText = errorMessage;
            if (Object.keys(errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errors).forEach(field => {
                    errorText += `• ${errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Patient',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updatePatient(id, patientData) {
        try {
            const response = await axios.patch(`/patients/${id}`, patientData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update patient.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Patient',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // APPOINTMENT MANAGEMENT
    // ================================
    async getAppointments(params = {}) {
        try {
            const response = await axios.get('/appointments', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    }

    async getAppointment(id) {
        try {
            const response = await axios.get(`/appointments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching appointment:', error);
            throw error;
        }
    }

    async createAppointment(appointmentData) {
        try {
            const response = await axios.post('/appointments', appointmentData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Appointment created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create appointment.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Appointment',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateAppointment(id, appointmentData) {
        try {
            const response = await axios.patch(`/appointments/${id}`, appointmentData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Appointment updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update appointment.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Appointment',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async checkInAppointment(id) {
        try {
            const response = await axios.post(`/appointments/${id}/check-in`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Checked In!',
                text: 'Patient checked in successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to check in patient.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Check-in Failed',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async completeAppointment(id, completionNotes = '') {
        try {
            const response = await axios.post(`/appointments/${id}/complete`, {
                completion_notes: completionNotes
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Completed!',
                text: 'Appointment completed successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to complete appointment.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Completing Appointment',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async cancelAppointment(id, reason = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Cancel Appointment',
                text: 'Are you sure you want to cancel this appointment?',
                input: 'textarea',
                inputPlaceholder: 'Cancellation reason (optional)',
                inputValue: reason,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, cancel it!',
                cancelButtonText: 'Keep appointment'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.post(`/appointments/${id}/cancel`, {
                cancellation_reason: result.value || 'No reason provided'
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Cancelled!',
                text: 'Appointment has been cancelled.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to cancel appointment.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Cancelling Appointment',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async getAvailableSlots(params) {
        try {
            const response = await axios.get('/appointments/available-slots', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching available slots:', error);
            throw error;
        }
    }

    // ================================
    // PATIENT RECORDS MANAGEMENT
    // ================================
    async getPatientRecords(params = {}) {
        try {
            const response = await axios.get('/patient-records', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching patient records:', error);
            throw error;
        }
    }

    async getPatientRecord(id) {
        try {
            const response = await axios.get(`/patient-records/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient record:', error);
            throw error;
        }
    }

    async createPatientRecord(recordData) {
        try {
            const response = await axios.post('/patient-records', recordData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient record created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create patient record.';
            const errors = error.response?.data?.errors || {};
            
            let errorText = errorMessage;
            if (Object.keys(errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errors).forEach(field => {
                    errorText += `• ${errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Record',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updatePatientRecord(id, recordData) {
        try {
            const response = await axios.patch(`/patient-records/${id}`, recordData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient record updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update patient record.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Record',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deletePatientRecord(id, patientName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Patient Record',
                text: `Are you sure you want to delete this record for ${patientName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/patient-records/${id}`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Patient record has been deleted successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete patient record.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Record',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // TREATMENT PLAN MANAGEMENT
    // ================================
    async getTreatmentPlans(params = {}) {
        try {
            const response = await axios.get('/treatment-plans', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment plans:', error);
            throw error;
        }
    }

    async getTreatmentPlan(id) {
        try {
            const response = await axios.get(`/treatment-plans/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching treatment plan:', error);
            throw error;
        }
    }

    async createTreatmentPlan(planData) {
        try {
            const response = await axios.post('/treatment-plans', planData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Treatment plan created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create treatment plan.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Treatment Plan',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateTreatmentPlan(id, planData) {
        try {
            const response = await axios.patch(`/treatment-plans/${id}`, planData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Treatment plan updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update treatment plan.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Treatment Plan',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async approveTreatmentPlan(id) {
        try {
            const result = await Swal.fire({
                icon: 'question',
                title: 'Approve Treatment Plan',
                text: 'Are you sure you want to approve this treatment plan?',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, approve it',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.post(`/treatment-plans/${id}/approve`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Approved!',
                text: 'Treatment plan has been approved.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to approve treatment plan.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Approving Plan',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async startTreatmentPlan(id) {
        try {
            const result = await Swal.fire({
                icon: 'question',
                title: 'Start Treatment Plan',
                text: 'Are you sure you want to start this treatment plan?',
                showCancelButton: true,
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, start it',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.post(`/treatment-plans/${id}/start`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Started!',
                text: 'Treatment plan has been started.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to start treatment plan.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Starting Plan',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async completeTreatmentPlan(id) {
        try {
            const result = await Swal.fire({
                icon: 'question',
                title: 'Complete Treatment Plan',
                text: 'Are you sure you want to mark this treatment plan as complete?',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, complete it',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.post(`/treatment-plans/${id}/complete`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Completed!',
                text: 'Treatment plan has been marked as complete.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to complete treatment plan.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Completing Plan',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // SERVICES
    // ================================
    async getServices(params = {}) {
        try {
            const response = await axios.get('/services', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }

    async getService(id) {
        try {
            const response = await axios.get(`/services/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching service:', error);
            throw error;
        }
    }

    // ================================
    // FINANCIAL RECORDS
    // ================================
    async getFinancialRecords(params = {}) {
        try {
            const response = await axios.get('/financial-records', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching financial records:', error);
            throw error;
        }
    }

    async getFinancialRecord(id) {
        try {
            const response = await axios.get(`/financial-records/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching financial record:', error);
            throw error;
        }
    }

    async createFinancialRecord(recordData) {
        try {
            const response = await axios.post('/financial-records', recordData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Financial record created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create financial record.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Financial Record',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateFinancialRecord(id, recordData) {
        try {
            const response = await axios.patch(`/financial-records/${id}`, recordData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Financial record updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update financial record.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Financial Record',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async markFinancialRecordAsPaid(id, paymentData) {
        try {
            const response = await axios.post(`/financial-records/${id}/mark-paid`, paymentData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Payment Recorded!',
                text: 'Payment has been recorded successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to record payment.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Recording Payment',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // SCHEDULE MANAGEMENT
    // ================================
    async getSchedules(params = {}) {
        try {
            const response = await axios.get('/schedules', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching schedules:', error);
            throw error;
        }
    }

    async getSchedule(id) {
        try {
            const response = await axios.get(`/schedules/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            throw error;
        }
    }

    async createSchedule(scheduleData) {
        try {
            const response = await axios.post('/schedules', scheduleData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Schedule created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create schedule.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Schedule',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateSchedule(id, scheduleData) {
        try {
            const response = await axios.patch(`/schedules/${id}`, scheduleData);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Schedule updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update schedule.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Schedule',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deleteSchedule(id, scheduleInfo = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Schedule',
                text: `Are you sure you want to delete ${scheduleInfo}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/schedules/${id}`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Schedule has been deleted successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete schedule.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Schedule',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async makeScheduleAvailable(id) {
        try {
            const response = await axios.post(`/schedules/${id}/make-available`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Schedule Available!',
                text: 'Schedule has been marked as available.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to make schedule available.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async makeScheduleUnavailable(id, reason = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Make Schedule Unavailable',
                text: 'Are you sure you want to make this schedule unavailable?',
                input: 'textarea',
                inputPlaceholder: 'Reason (optional)',
                inputValue: reason,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, make unavailable',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.post(`/schedules/${id}/make-unavailable`, {
                reason: result.value || 'No reason provided'
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Schedule Unavailable!',
                text: 'Schedule has been marked as unavailable.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to make schedule unavailable.';
            
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // NOTIFICATIONS
    // ================================
    async getNotifications(params = {}) {
        try {
            const response = await axios.get('/notifications', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    async markNotificationAsRead(id) {
        try {
            const response = await axios.post(`/notifications/${id}/mark-read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markNotificationAsUnread(id) {
        try {
            const response = await axios.post(`/notifications/${id}/mark-unread`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            throw error;
        }
    }

    async deleteNotification(id) {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Notification',
                text: 'Are you sure you want to delete this notification?',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/notifications/${id}`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Notification has been deleted.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    async getUnreadNotificationCount() {
        try {
            const response = await axios.get('/api/notifications/unread-count');
            return response.data;
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
            throw error;
        }
    }

    async getRecentNotifications() {
        try {
            const response = await axios.get('/api/notifications/recent');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent notifications:', error);
            throw error;
        }
    }

    async markAllNotificationsAsRead() {
        try {
            const response = await axios.post('/notifications/mark-all-read');
            
            await Swal.fire({
                icon: 'success',
                title: 'All Notifications Marked as Read',
                text: 'All your notifications have been marked as read.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // ================================
    // REPORTS
    // ================================
    async getReports() {
        try {
            const response = await axios.get('/reports');
            return response.data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    }

    async getFinancialReports() {
        try {
            const response = await axios.get('/reports/financial');
            return response.data;
        } catch (error) {
            console.error('Error fetching financial reports:', error);
            throw error;
        }
    }

    async getAppointmentReports() {
        try {
            const response = await axios.get('/reports/appointments');
            return response.data;
        } catch (error) {
            console.error('Error fetching appointment reports:', error);
            throw error;
        }
    }

    async getPatientReports() {
        try {
            const response = await axios.get('/reports/patients');
            return response.data;
        } catch (error) {
            console.error('Error fetching patient reports:', error);
            throw error;
        }
    }

    // ================================
    // UTILITY METHODS
    // ================================
    async searchPatients(query) {
        try {
            const params = { q: query, role: 'patient' };
            const response = await axios.get('/api/users/search', { params });
            return response.data;
        } catch (error) {
            console.error('Error searching patients:', error);
            throw error;
        }
    }

    async searchStaff(query) {
        try {
            const params = { q: query, role: 'staff' };
            const response = await axios.get('/api/users/search', { params });
            return response.data;
        } catch (error) {
            console.error('Error searching staff:', error);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            const response = await axios.get('/api/system/status');
            return response.data;
        } catch (error) {
            console.error('Error fetching system status:', error);
            throw error;
        }
    }
}

// Create and export a single instance
const apiStaff = new ApiStaff();
export default apiStaff;