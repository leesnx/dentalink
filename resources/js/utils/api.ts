// utils/api.ts - JTIMIS API helper utilities

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: any;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

class ApiClient {
    private baseURL: string;
    private csrfToken: string | null = null;

    constructor() {
        this.baseURL = '';
        this.initCSRF();
    }

    private initCSRF() {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            this.csrfToken = token;
        }
    }

    private getHeaders(isFormData = false): HeadersInit {
        const headers: HeadersInit = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        if (this.csrfToken) {
            headers['X-CSRF-TOKEN'] = this.csrfToken;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response, got ${contentType}`);
            }

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    return {
                        success: false,
                        message: data.message || 'Validation failed',
                        errors: data.errors
                    };
                }
                
                return {
                    success: false,
                    message: data.message || `HTTP Error: ${response.status}`,
                    errors: data.errors
                };
            }

            return data;
        } catch (error) {
            console.error('API Response Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            let url = `${this.baseURL}${endpoint}`;
            if (params) {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        searchParams.append(key, String(value));
                    }
                });
                const queryString = searchParams.toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'same-origin'
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            console.error('GET Request Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    async post<T>(endpoint: string, data: any, isFormData = false): Promise<ApiResponse<T>> {
        try {
            const body = isFormData ? data : JSON.stringify(data);
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(isFormData),
                credentials: 'same-origin',
                body
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            console.error('POST Request Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            console.error('PUT Request Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                credentials: 'same-origin'
            });

            return this.handleResponse<T>(response);
        } catch (error) {
            console.error('DELETE Request Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Network error'
            };
        }
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// ================================
// JTIMIS SPECIFIC API ENDPOINTS
// ================================

// Dashboard APIs
export const dashboardApi = {
    getStats: () => apiClient.get('/api/dashboard/'),
    getAdminStats: () => apiClient.get('/api/admin/system-health'),
    getDispatcherStats: () => apiClient.get('/api/dispatcher/dashboard-stats'),
    getDriverStats: () => apiClient.get('/api/driver/dashboard-stats'),
    getRecentActivity: () => apiClient.get('/api/dashboard/recent-activity'),
    getAlerts: () => apiClient.get('/api/dashboard/alerts'),
    getSystemStatus: () => apiClient.get('/api/system/status')
};

// User Management APIs
export const usersApi = {
    getAll: (params?: any) => apiClient.get('/api/users', params),
    getStats: () => apiClient.get('/api/users/stats'),
    getProfile: () => apiClient.get('/api/users/profile'),
    getById: (id: number) => apiClient.get(`/api/users/${id}`),
    getByRole: (role: string) => apiClient.get(`/api/users/role/${role}`),
    getActivitySummary: (id: number) => apiClient.get(`/api/users/${id}/activity`),
    searchUsers: (params: any) => apiClient.get('/api/users/search', params),
    create: (data: any) => apiClient.post('/api/users', data),
    update: (id: number, data: any) => apiClient.put(`/api/users/${id}`, data),
    updateProfile: (data: any) => apiClient.put('/api/users/profile', data),
    changePassword: (data: any) => apiClient.post('/api/users/change-password', data),
    toggleStatus: (id: number) => apiClient.post(`/api/users/${id}/toggle-status`, {}),
    delete: (id: number) => apiClient.delete(`/api/users/${id}`)
};

// Driver Management APIs
export const driversApi = {
    getAll: (params?: any) => apiClient.get('/api/drivers', params),
    getStats: () => apiClient.get('/api/drivers/stats'),
    getActiveDrivers: () => apiClient.get('/api/dispatcher/active-drivers'),
    getById: (id: number) => apiClient.get(`/api/drivers/${id}`),
    getPerformance: (id: number) => apiClient.get(`/api/drivers/${id}/performance`),
    create: (data: any) => apiClient.post('/api/drivers', data),
    update: (id: number, data: any) => apiClient.put(`/api/drivers/${id}`, data),
    updateRating: (id: number, data: any) => apiClient.post(`/api/drivers/${id}/update-rating`, data),
    assignVehicle: (id: number, data: any) => apiClient.post(`/api/drivers/${id}/assign-vehicle`, data),
    suspend: (id: number) => apiClient.post(`/api/drivers/${id}/suspend`, {}),
    activate: (id: number) => apiClient.post(`/api/drivers/${id}/activate`, {})
};

// Vehicle Management APIs
export const vehiclesApi = {
    getAll: (params?: any) => apiClient.get('/api/vehicles', params),
    getStats: () => apiClient.get('/api/vehicles/stats'),
    getAvailable: () => apiClient.get('/api/vehicles/available'),
    getFleetStatus: () => apiClient.get('/api/dispatcher/fleet-status'),
    getById: (id: number) => apiClient.get(`/api/vehicles/${id}`),
    getMaintenanceHistory: (id: number) => apiClient.get(`/api/vehicles/${id}/maintenance-history`),
    getAssignedVehicle: () => apiClient.get('/api/driver/vehicle/assigned'),
    create: (data: any) => apiClient.post('/api/vehicles', data),
    update: (id: number, data: any) => apiClient.put(`/api/vehicles/${id}`, data),
    updateStatus: (data: any) => apiClient.post('/api/driver/vehicle/update-status', data),
    reportIssue: (data: any) => apiClient.post('/api/driver/vehicle/report-issue', data)
};

// Emergency & Incident APIs
export const emergencyApi = {
    getAll: (params?: any) => apiClient.get('/api/emergency/incidents', params),
    getActiveIncidents: () => apiClient.get('/api/emergency/active-incidents'),
    getMyIncidents: () => apiClient.get('/api/emergency/my-incidents'),
    getById: (id: number) => apiClient.get(`/api/emergency/${id}`),
    create: (data: any) => apiClient.post('/api/emergency', data),
    assignResponder: (id: number, data: any) => apiClient.put(`/api/emergency/${id}/assign-responder`, data),
    updateStatus: (id: number, data: any) => apiClient.put(`/api/emergency/${id}/update-status`, data),
    addResponseNote: (id: number, data: any) => apiClient.post(`/api/emergency/${id}/add-response-note`, data)
};

// Maintenance Management APIs
export const maintenanceApi = {
    getAll: (params?: any) => apiClient.get('/api/maintenance', params),
    getStats: () => apiClient.get('/api/maintenance/stats'),
    getUpcoming: () => apiClient.get('/api/maintenance/upcoming'),
    getOverdue: () => apiClient.get('/api/maintenance/overdue'),
    getById: (id: number) => apiClient.get(`/api/maintenance/${id}`),
    create: (data: any) => apiClient.post('/api/maintenance', data),
    update: (id: number, data: any) => apiClient.put(`/api/maintenance/${id}`, data),
    markCompleted: (id: number) => apiClient.post(`/api/maintenance/${id}/complete`, {})
};

// Schedule Management APIs
export const schedulesApi = {
    getAll: (params?: any) => apiClient.get('/api/schedules', params),
    getStats: () => apiClient.get('/api/schedules/stats'), // Add this endpoint to backend
    getMySchedule: () => apiClient.get('/api/driver/schedule/my-schedule'),
    getTodaySchedule: () => apiClient.get('/api/driver/schedule/today'),
    getWeekSchedule: () => apiClient.get('/api/driver/schedule/week'),
    getDriverSchedule: (driverId: number) => apiClient.get(`/api/schedules/driver/${driverId}/schedule`),
    checkConflicts: () => apiClient.get('/api/schedules/conflicts'),
    create: (data: any) => apiClient.post('/api/schedules', data),
    update: (id: number, data: any) => apiClient.put(`/api/schedules/${id}`, data),
    bulkAssign: (data: any) => apiClient.post('/api/schedules/bulk-assign', data),
    delete: (id: number) => apiClient.delete(`/api/schedules/${id}`)
};
// Working Hours APIs
export const workingHoursApi = {
    clockIn: () => apiClient.post('/api/driver/hours/clock-in', {}),
    clockOut: () => apiClient.post('/api/driver/hours/clock-out', {}),
    startBreak: () => apiClient.post('/api/driver/hours/start-break', {}),
    endBreak: () => apiClient.post('/api/driver/hours/end-break', {}),
    getCurrentSession: () => apiClient.get('/api/driver/hours/current-session'),
    getMyHours: () => apiClient.get('/api/driver/hours/my-hours'),
    getWeeklySummary: () => apiClient.get('/api/driver/hours/weekly-summary'),
    getOvertimeAlerts: () => apiClient.get('/api/working-hours/overtime-alerts'),
    getComplianceReport: () => apiClient.get('/api/working-hours/compliance-report'),
    getDriverHours: (driverId: number) => apiClient.get(`/api/working-hours/driver/${driverId}/hours`)
};

// Lost & Found APIs
export const lostFoundApi = {
    getAll: (params?: any) => apiClient.get('/api/lost-found', params),
    getStats: () => apiClient.get('/api/lost-found/stats'),
    getUnclaimed: () => apiClient.get('/api/lost-found/unclaimed'),
    getMyReports: () => apiClient.get('/api/driver/lost-found/my-reports'),
    getById: (id: number) => apiClient.get(`/api/lost-found/${id}`),
    create: (data: any) => apiClient.post('/api/driver/lost-found', data),
    update: (id: number, data: any) => apiClient.put(`/api/driver/lost-found/${id}`, data),
    markClaimed: (id: number, data: any) => apiClient.put(`/api/lost-found/${id}/mark-claimed`, data)
};

// GPS Tracking APIs
export const trackingApi = {
    getLiveLocations: () => apiClient.get('/api/tracking/live-locations'),
    getCurrentLocations: () => apiClient.get('/api/locations/current'),
    getVehicleLocation: (vehicleId: number) => apiClient.get(`/api/locations/vehicle/${vehicleId}`),
    getLocationHistory: (vehicleId: number) => apiClient.get(`/api/tracking/vehicle/${vehicleId}/history`),
    getDriverCurrentLocation: (driverId: number) => apiClient.get(`/api/tracking/driver/${driverId}/current-location`),
    getMyRouteHistory: () => apiClient.get('/api/driver/location/my-route-history'),
    updateLocation: (data: any) => apiClient.post('/api/driver/location/update', data),
    setGeofenceAlerts: (data: any) => apiClient.post('/api/tracking/geofence-alerts', data)
};

// Performance Analytics APIs
export const performanceApi = {
    getFleetAnalytics: () => apiClient.get('/api/performance/fleet-analytics'),
    getDriverRankings: () => apiClient.get('/api/performance/driver-rankings'),
    getEfficiencyReports: () => apiClient.get('/api/performance/efficiency-reports'),
    getSafetyMetrics: () => apiClient.get('/api/performance/safety-metrics'),
    getMyPerformance: () => apiClient.get('/api/driver/performance/my-performance'),
    getMyRatings: () => apiClient.get('/api/driver/performance/ratings'),
    getAchievements: () => apiClient.get('/api/driver/performance/achievements')
};

// Notifications APIs
export const notificationsApi = {
    getAll: (params?: any) => apiClient.get('/api/notifications', params),
    getDriverNotifications: () => apiClient.get('/api/driver/notifications'),
    getUnreadCount: () => apiClient.get('/api/notifications/unread-count'),
    markAsRead: (id: number) => apiClient.post(`/api/notifications/${id}/mark-read`, {}),
    markAllAsRead: () => apiClient.post('/api/notifications/mark-all-read', {}),
    delete: (id: number) => apiClient.delete(`/api/notifications/${id}`)
};  

// System Administration APIs (Admin only)
export const adminApi = {
    getSystemHealth: () => apiClient.get('/api/admin/system-health'),
    getSystemAnalytics: () => apiClient.get('/api/admin/analytics'),
    getUserActivity: () => apiClient.get('/api/admin/user-activity'),
    getFinancialSummary: () => apiClient.get('/api/admin/financial-summary'),
    backupSystem: () => apiClient.post('/api/admin/backup-system', {})
};

// Toast notification helper
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // You can integrate with your toast library here
    if (type === 'error') {
        console.error(`Error: ${message}`);
    } else if (type === 'success') {
        console.log(`Success: ${message}`);
    } else {
        console.info(message);
    }
};

// Error handler helper
export const handleApiError = (error: ApiResponse) => {
    if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join(', ');
        showToast(errorMessages, 'error');
    } else {
        showToast(error.message || 'An unexpected error occurred', 'error');
    }
};