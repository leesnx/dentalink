import axios from 'axios';
import Swal from 'sweetalert2';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

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
    // Ensure we're requesting JSON for API calls
    if (!config.headers['Accept']) {
        config.headers['Accept'] = 'application/json';
    }
    return config;
});

// Response interceptor for error handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            // CSRF token mismatch
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
        } else if (error.response?.status === 500) {
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'An unexpected error occurred. Please try again later.',
                confirmButtonColor: '#3B82F6'
            });
        } else if (error.response?.status === 422) {
            // Validation errors are handled by individual methods
            console.warn('Validation error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

class ApiAdmin {
    constructor() {
        this.baseURL = window.location.origin;
    }

    // Helper method to handle API responses
    _handleResponse(response) {
        return response.data;
    }

    // Helper method to handle API errors
    _handleError(error, context = 'operation') {
        const message = error.response?.data?.message || `Failed to complete ${context}.`;
        const errors = error.response?.data?.errors || {};
        
        console.error(`API Error (${context}):`, error);
        
        return {
            success: false,
            message,
            errors,
            status: error.response?.status
        };
    }

    // ================================
    // APPOINTMENT MANAGEMENT
    // ================================
// Add this updated method to your ApiAdmin.js file

async getAppointments(params = {}) {
    try {
        const cleanParams = Object.keys(params).reduce((acc, key) => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                acc[key] = params[key];
            }
            return acc;
        }, {});

        console.log('Sending params:', cleanParams);
        
        // Use the correct web route endpoint instead of API
        const response = await axios.get('/appointments', { 
            params: cleanParams, 
            headers: { 'Accept': 'application/json' },
            timeout: 10000 // 10 second timeout
        });
        
        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);
        console.log('API Response Data:', response.data);
        
        // Check if response is successful
        if (response.status >= 200 && response.status < 300) {
            return this._handleResponse(response);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('Error fetching appointments:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error code:', error.code);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        // Handle specific error types
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout - server took too long to respond');
            throw new Error('Request timeout - please try again');
        } else if (error.code === 'ERR_NETWORK') {
            console.error('Network error - check your connection');
            throw new Error('Network error - check your connection');
        } else if (error.response?.status === 500) {
            console.error('Server error - check Laravel logs');
            throw new Error('Server error - please try again later');
        } else if (error.response?.status === 422) {
            console.error('Validation error');
            throw error; // Let the component handle validation errors
        } else if (error.response?.status === 419) {
            console.error('CSRF token expired');
            throw new Error('Session expired - please refresh the page');
        }
        
        throw this._handleError(error, 'fetch appointments');
    }
}

    async getAppointment(id) {
        try {
            const response = await axios.get(`/appointments/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching appointment:', error);
            throw this._handleError(error, 'fetch appointment');
        }
    }

    async createAppointment(appointmentData) {
        try {
            const response = await axios.post('/appointments', appointmentData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Appointment created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            if (error.response?.status === 422) {
                throw error;
            }
            
            const errorData = this._handleError(error, 'create appointment');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Appointment',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateAppointment(id, appointmentData) {
        try {
            const response = await axios.put(`/appointments/${id}`, appointmentData, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Appointment updated successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            if (error.response?.status === 422) {
                throw error;
            }
            
            const errorData = this._handleError(error, 'update appointment');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Appointment',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deleteAppointment(id, appointmentName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Appointment',
                text: `Are you sure you want to delete ${appointmentName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/appointments/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Appointment has been deleted successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'delete appointment');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Appointment',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // Appointment status methods
    async checkInAppointment(id) {
        try {
            const response = await axios.post(`/appointments/${id}/check-in`, {}, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient checked in successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'check in appointment');
            
            await Swal.fire({
                icon: 'error',
                title: 'Check-in Failed',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async completeAppointment(id, completionNotes = '') {
        try {
            const response = await axios.post(`/appointments/${id}/complete`, {
                completion_notes: completionNotes
            }, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Appointment completed successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'complete appointment');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Completing Appointment',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async cancelAppointment(id, cancellationReason = '') {
        try {
            const response = await axios.post(`/appointments/${id}/cancel`, {
                cancellation_reason: cancellationReason
            }, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            
            await Swal.fire({
                icon: 'success',
                title: 'Cancelled!',
                text: 'Appointment has been cancelled.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'cancel appointment');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Cancelling Appointment',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async getAvailableSlots(doctorId, date, duration) {
        try {
            const response = await axios.get('/appointments/available-slots', {
                params: {
                    doctor_id: doctorId,
                    date: date,
                    duration: duration
                },
                headers: { 'Accept': 'application/json' }
            });
            
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            throw this._handleError(error, 'fetch available slots');
        }
    }

    // ================================
    // PATIENT MANAGEMENT
    // ================================
    async getPatients(params = {}) {
        try {
            const response = await axios.get('/patients', { 
                params,
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw this._handleError(error, 'fetch patients');
        }
    }

    async getPatient(id) {
        try {
            const response = await axios.get(`/patients/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching patient:', error);
            throw this._handleError(error, 'fetch patient');
        }
    }

    async createPatient(patientData) {
        try {
            const response = await axios.post('/patients', patientData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Patient created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error creating patient:', error);
            
            if (error.response?.status === 422) {
                throw error;
            }
            
            const errorData = this._handleError(error, 'create patient');
            
            let errorText = errorData.message;
            
            if (error.response?.status === 409) {
                errorText = 'A patient with this email already exists.';
            } else if (error.response?.status === 403) {
                errorText = 'You do not have permission to create patients.';
            } else if (error.response?.status === 500) {
                errorText = 'Server error occurred. Please try again later.';
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
            console.log('Updating patient with data:', patientData);
            
            const response = await axios.patch(`/patients/${id}`, patientData, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Patient updated successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            console.error('Patient update error:', error);
            
            if (error.response?.status === 405) {
                try {
                    const response = await axios.put(`/patients/${id}`, patientData, {
                        headers: { 'Accept': 'application/json' }
                    });
                    
                    const responseData = this._handleResponse(response);
                    const successMessage = responseData.message || 'Patient updated successfully.';

                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: successMessage,
                        confirmButtonColor: '#10B981',
                        timer: 3000
                    });
                    
                    return responseData;
                } catch (putError) {
                    console.error('PUT method also failed:', putError);
                    throw putError;
                }
            }
            
            if (error.response?.status === 422) {
                console.error('Validation errors:', error.response.data.errors);
                throw error;
            }
            
            const errorData = this._handleError(error, 'update patient');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Patient',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deletePatient(id, patientName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Patient',
                text: `Are you sure you want to delete ${patientName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/patients/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Patient has been deleted successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'delete patient');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Patient',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // SERVICE MANAGEMENT
    // ================================
    async getServices(params = {}) {
        try {
            const response = await axios.get('/services', { 
                params,
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching services:', error);
            throw this._handleError(error, 'fetch services');
        }
    }

    async getService(id) {
        try {
            const response = await axios.get(`/services/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching service:', error);
            throw this._handleError(error, 'fetch service');
        }
    }

    async createService(serviceData) {
        try {
            const formattedData = {
                ...serviceData,
                is_active: serviceData.is_active !== undefined ? Boolean(serviceData.is_active) : true,
                price: parseFloat(serviceData.price),
                duration_minutes: parseInt(serviceData.duration_minutes)
            };

            const response = await axios.post('/services', formattedData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Service created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            const errorData = this._handleError(error, 'create service');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Service',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateService(id, serviceData) {
        try {
            const formattedData = {
                ...serviceData,
                is_active: serviceData.is_active !== undefined ? Boolean(serviceData.is_active) : true,
                price: parseFloat(serviceData.price),
                duration_minutes: parseInt(serviceData.duration_minutes)
            };

            const response = await axios.put(`/services/${id}`, formattedData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Service updated successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            const errorData = this._handleError(error, 'update service');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Service',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deleteService(id, serviceName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Service',
                text: `Are you sure you want to delete ${serviceName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/services/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Service has been deleted successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            const errorData = this._handleError(error, 'delete service');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Service',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    // ================================
    // USER MANAGEMENT
    // ================================
    async getUsers(params = {}) {
        try {
            const response = await axios.get('/users', { 
                params,
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw this._handleError(error, 'fetch users');
        }
    }

    async getUser(id) {
        try {
            const response = await axios.get(`/users/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching user:', error);
            throw this._handleError(error, 'fetch user');
        }
    }

    async createUser(userData) {
        try {
            const response = await axios.post('/users', userData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'User created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            const errorData = this._handleError(error, 'create user');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating User',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await axios.put(`/users/${id}`, userData, {
                headers: { 'Accept': 'application/json' }
            });

            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'User updated successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });

            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'update user');

            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }

            await Swal.fire({
                icon: 'error',
                title: 'Error Updating User',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });

            throw error;
        }
    }

    async deleteUser(id, userName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete User',
                text: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/users/${id}`, {
                headers: { 'Accept': 'application/json' }
            });

            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'User has been deleted successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });

            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'delete user');

            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting User',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });

            throw error;
        }
    }

    // ================================
    // FINANCIAL RECORDS MANAGEMENT
    // ================================
    async getFinancialRecords(params = {}) {
        try {
            const response = await axios.get('/financial-records', { 
                params,
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching financial records:', error);
            throw this._handleError(error, 'fetch financial records');
        }
    }

    async getFinancialRecord(id) {
        try {
            const response = await axios.get(`/financial-records/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching financial record:', error);
            throw this._handleError(error, 'fetch financial record');
        }
    }

    async createFinancialRecord(recordData) {
        try {
            const response = await axios.post('/financial-records', recordData, {
                headers: { 'Accept': 'application/json' }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Financial record created successfully.',
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return this._handleResponse(response);
        } catch (error) {
            if (error.response?.status === 422) {
                throw error;
            }
            
            const errorData = this._handleError(error, 'create financial record');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Creating Financial Record',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async updateFinancialRecord(id, recordData) {
        try {
            const response = await axios.patch(`/api/v1/financial-records/${id}`, recordData, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Financial record updated successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            if (error.response?.status === 422) {
                throw error;
            }
            
            const errorData = this._handleError(error, 'update financial record');
            
            let errorText = errorData.message;
            if (Object.keys(errorData.errors).length > 0) {
                errorText += '\n\nValidation errors:\n';
                Object.keys(errorData.errors).forEach(field => {
                    errorText += `• ${field}: ${errorData.errors[field][0]}\n`;
                });
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Updating Financial Record',
                text: errorText,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async deleteFinancialRecord(id, recordName = '') {
        try {
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Delete Financial Record',
                text: `Are you sure you want to delete ${recordName}? This action cannot be undone.`,
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            });

            if (!result.isConfirmed) {
                return null;
            }

            const response = await axios.delete(`/api/v1/financial-records/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            const successMessage = responseData.message || 'Financial record has been deleted successfully.';

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: successMessage,
                confirmButtonColor: '#10B981',
                timer: 3000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'delete financial record');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Deleting Financial Record',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

    async markFinancialRecordAsPaid(id, data = {}) {
        try {
            const response = await axios.post(`/api/v1/financial-records/${id}/mark-as-paid`, data, {
                headers: { 'Accept': 'application/json' }
            });
            
            const responseData = this._handleResponse(response);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Payment recorded successfully.',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
            
            return responseData;
        } catch (error) {
            const errorData = this._handleError(error, 'mark as paid');
            
            await Swal.fire({
                icon: 'error',
                title: 'Error Recording Payment',
                text: errorData.message,
                confirmButtonColor: '#EF4444'
            });
            
            throw error;
        }
    }

   // ================================
// DASHBOARD & ANALYTICS
// ================================
async getDashboardData() {
    try {
        const response = await axios.get('/api/dashboard/data', {
            headers: { 'Accept': 'application/json' }
        });
        return this._handleResponse(response);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw this._handleError(error, 'fetch dashboard data');
    }
}

async getDashboardStats() {
    try {
        const response = await axios.get('/api/dashboard/stats', {
            headers: { 'Accept': 'application/json' }
        });
        return this._handleResponse(response);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw this._handleError(error, 'fetch dashboard stats');
    }
}

async getRecentActivity() {
    try {
        const response = await axios.get('/api/dashboard/recent-activity', {
            headers: { 'Accept': 'application/json' }
        });
        return this._handleResponse(response);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        throw this._handleError(error, 'fetch recent activity');
    }
}

async getSystemAlerts() {
    try {
        const response = await axios.get('/api/dashboard/alerts', {
            headers: { 'Accept': 'application/json' }
        });
        return this._handleResponse(response);
    } catch (error) {
        console.error('Error fetching system alerts:', error);
        throw this._handleError(error, 'fetch system alerts');
    }
}

    // ================================
    // UTILITY METHODS
    // ================================
    async searchServices(query, category = null) {
        try {
            const params = { search: query };
            if (category) params.category = category;
            
            const response = await axios.get('/api/v1/services', { 
                params,
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error searching services:', error);
            throw this._handleError(error, 'search services');
        }
    }

    async getServiceCategories() {
        try {
            const response = await axios.get('/api/v1/services', {
                params: { categories_only: true },
                headers: { 'Accept': 'application/json' }
            });
            return this._handleResponse(response);
        } catch (error) {
            console.error('Error fetching service categories:', error);
            throw this._handleError(error, 'fetch service categories');
        }
    }

    // ================================
    // ERROR HANDLING UTILITIES
    // ================================
    showErrorToast(message) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    showSuccessToast(message) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    async confirmAction(title, text, confirmText = 'Yes', type = 'warning') {
        const result = await Swal.fire({
            icon: type,
            title: title,
            text: text,
            showCancelButton: true,
            confirmButtonColor: type === 'warning' ? '#EF4444' : '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel'
        });

        return result.isConfirmed;
    }
}

// Create and export a single instance
const apiAdmin = new ApiAdmin();
export default apiAdmin;