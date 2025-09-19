<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Service;
use App\Models\Schedule;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Don't set default date - only filter if explicitly provided
            $date = $request->input('date');
            $status = $request->input('status');
            $doctor = $request->input('doctor');
            $patient = $request->input('patient');

            // Debug log - fix the logging syntax
            Log::info('Appointment filters received', [
                'date' => $date,
                'status' => $status,
                'doctor' => $doctor,
                'patient' => $patient
            ]);

            $appointments = Appointment::with(['patient', 'doctor', 'service'])
                ->when($date, function ($query, $date) {
                    Log::info('Applying date filter: ' . $date);
                    return $query->whereDate('appointment_date', $date);
                })
                ->when($status, function ($query, $status) {
                    return $query->where('status', $status);
                })
                ->when($doctor, function ($query, $doctor) {
                    return $query->where('doctor_id', $doctor);
                })
                ->when($patient, function ($query, $patient) {
                    return $query->whereHas('patient', function($q) use ($patient) {
                        $q->where('name', 'like', '%' . $patient . '%')
                          ->orWhere('id', $patient);
                    });
                })
                ->orderBy('appointment_date')
                ->orderBy('appointment_time')
                ->get();

            // Debug log
            Log::info('Query result: ' . $appointments->count() . ' appointments found');

            // Calculate stats
            $stats = [
                'today' => Appointment::whereDate('appointment_date', today())->count(),
                'thisWeek' => Appointment::whereBetween('appointment_date', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ])->count(),
                'completed' => Appointment::where('status', 'completed')->count(),
                'cancelled' => Appointment::where('status', 'cancelled')->count(),
            ];

            // For API requests, return JSON
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'appointments' => $appointments,
                    'stats' => $stats,
                    'filters' => $request->only(['date', 'status', 'doctor', 'patient']),
                    'debug_info' => [
                        'total_appointments_in_db' => Appointment::count(),
                        'filtered_count' => $appointments->count(),
                        'applied_date_filter' => $date,
                        'sample_appointment_dates' => Appointment::pluck('appointment_date')->take(5)
                    ]
                ]);
            }

            // For web requests, return Inertia view
            $doctors = User::staff()->where('position', 'dentist')->get();
            
            return Inertia::render('Appointments/Index', [
                'appointments' => $appointments,
                'doctors' => $doctors,
                'stats' => $stats,
                'filters' => $request->only(['date', 'status', 'doctor', 'patient']),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in AppointmentController@index: ' . $e->getMessage());
            
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch appointments',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to load appointments');
        }
    }

    public function create()
    {
        $patients = User::patients()->active()->orderBy('name')->get();
        $doctors = User::staff()->where('position', 'dentist')->active()->get();
        $services = Service::active()->orderBy('name')->get();

        return Inertia::render('Appointments/Create', [
            'patients' => $patients,
            'doctors' => $doctors,
            'services' => $services,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:users,id',
                'doctor_id' => 'required|exists:users,id',
                'service_id' => 'required|exists:services,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required|date_format:H:i',
                'reason_for_visit' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $service = Service::find($validated['service_id']);
            $appointmentDateTime = Carbon::parse($validated['appointment_date'] . ' ' . $validated['appointment_time']);

            $appointment = Appointment::create([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'],
                'service_id' => $validated['service_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $appointmentDateTime,
                'duration_minutes' => $service->duration_minutes,
                'status' => 'scheduled',
                'reason_for_visit' => $validated['reason_for_visit'],
                'notes' => $validated['notes'],
            ]);

            // Load relationships for response
            $appointment->load(['patient', 'doctor', 'service']);

            // Create notifications
            try {
                Notification::createAppointmentNotification(
                    $validated['patient_id'],
                    'Appointment Scheduled',
                    "Your appointment has been scheduled for {$appointment->formatted_date_time}"
                );

                Notification::createAppointmentNotification(
                    $validated['doctor_id'],
                    'New Appointment',
                    "New appointment scheduled with {$appointment->patient->name}"
                );
            } catch (\Exception $e) {
                Log::warning('Failed to create notifications: ' . $e->getMessage());
            }

            // Log the action
            try {
                AuditLog::logCreate(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, [
                    'patient_name' => $appointment->patient->name,
                    'doctor_name' => $appointment->doctor->name,
                    'service_name' => $service->name,
                    'appointment_time' => $appointment->formatted_date_time,
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment created successfully.',
                    'appointment' => $appointment
                ], 201);
            }

            // For web requests, redirect
            return redirect()->route('appointments.show', $appointment)->with('success', 'Appointment created successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error creating appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create appointment.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create appointment: ' . $e->getMessage());
        }
    }

    public function show(Appointment $appointment)
    {
        $appointment->load(['patient.patient', 'doctor', 'service', 'patientRecords']);

        return Inertia::render('Appointments/Show', [
            'appointment' => $appointment,
        ]);
    }

    public function edit(Appointment $appointment)
    {
        $appointment->load(['patient', 'doctor', 'service']);
        $patients = User::patients()->active()->orderBy('name')->get();
        $doctors = User::staff()->where('position', 'dentist')->active()->get();
        $services = Service::active()->orderBy('name')->get();

        return Inertia::render('Appointments/Edit', [
            'appointment' => $appointment,
            'patients' => $patients,
            'doctors' => $doctors,
            'services' => $services,
        ]);
    }

    public function update(Request $request, Appointment $appointment)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:users,id',
                'doctor_id' => 'required|exists:users,id',
                'service_id' => 'required|exists:services,id',
                'appointment_date' => 'required|date',
                'appointment_time' => 'required|date_format:H:i',
                'status' => 'required|in:scheduled,confirmed,checked_in,in_progress,completed,cancelled,no_show',
                'reason_for_visit' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $service = Service::find($validated['service_id']);
            $appointmentDateTime = Carbon::parse($validated['appointment_date'] . ' ' . $validated['appointment_time']);

            $appointment->update([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'],
                'service_id' => $validated['service_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $appointmentDateTime,
                'duration_minutes' => $service->duration_minutes,
                'status' => $validated['status'],
                'reason_for_visit' => $validated['reason_for_visit'],
                'notes' => $validated['notes'],
            ]);

            // Reload relationships
            $appointment->load(['patient', 'doctor', 'service']);

            // Log the action
            try {
                AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, [
                    'updated_fields' => array_keys($validated),
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment updated successfully.',
                    'appointment' => $appointment
                ], 200);
            }

            // For web requests, redirect
            return redirect()->route('appointments.show', $appointment)->with('success', 'Appointment updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error updating appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update appointment.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update appointment: ' . $e->getMessage());
        }
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        try {
            $appointmentData = [
                'patient_name' => $appointment->patient->name,
                'doctor_name' => $appointment->doctor->name,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time,
            ];

            $appointment->delete();

            // Log the action
            try {
                AuditLog::logDelete(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, $appointmentData);
            } catch (\Exception $e) {
                Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment deleted successfully.'
                ], 200);
            }

            // For web requests, redirect
            return redirect()->route('appointments.index')->with('success', 'Appointment deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Error deleting appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete appointment.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete appointment: ' . $e->getMessage());
        }
    }

    public function checkIn(Request $request, Appointment $appointment)
    {
        try {
            if ($appointment->checkIn()) {
                // Log the action
                try {
                    AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, [
                        'action' => 'checked_in',
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to create audit log: ' . $e->getMessage());
                }

                // Reload relationships
                $appointment->load(['patient', 'doctor', 'service']);

                // For API requests, return JSON
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Patient checked in successfully.',
                        'appointment' => $appointment
                    ], 200);
                }

                return back()->with('success', 'Patient checked in successfully.');
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to check in patient.'
                ], 400);
            }

            return back()->with('error', 'Unable to check in patient.');

        } catch (\Exception $e) {
            Log::error('Error checking in appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to check in patient.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to check in patient.');
        }
    }

    public function complete(Request $request, Appointment $appointment)
    {
        try {
            $appointment->complete($request->input('completion_notes'));

            // Log the action
            try {
                AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, [
                    'action' => 'completed',
                    'completion_notes' => $request->input('completion_notes'),
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

            // Reload relationships
            $appointment->load(['patient', 'doctor', 'service']);

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment completed successfully.',
                    'appointment' => $appointment
                ], 200);
            }

            return back()->with('success', 'Appointment completed successfully.');

        } catch (\Exception $e) {
            Log::error('Error completing appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to complete appointment.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to complete appointment.');
        }
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        try {
            $reason = $request->input('cancellation_reason');
            
            if ($appointment->cancel($reason)) {
                // Log the action
                try {
                    AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'appointments', $appointment->id, [
                        'action' => 'cancelled',
                        'reason' => $reason,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to create audit log: ' . $e->getMessage());
                }

                // Reload relationships
                $appointment->load(['patient', 'doctor', 'service']);

                // For API requests, return JSON
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Appointment cancelled successfully.',
                        'appointment' => $appointment
                    ], 200);
                }

                return back()->with('success', 'Appointment cancelled successfully.');
            }

            // For API requests, return JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to cancel appointment.'
                ], 400);
            }

            return back()->with('error', 'Unable to cancel appointment.');

        } catch (\Exception $e) {
            Log::error('Error cancelling appointment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to cancel appointment.',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to cancel appointment.');
        }
    }

    public function getAvailableSlots(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'duration' => 'required|integer|min:15',
        ]);

        $schedule = Schedule::where('staff_id', $validated['doctor_id'])
            ->where('date', $validated['date'])
            ->where('is_available', true)
            ->first();

        if (!$schedule) {
            return response()->json(['slots' => []]);
        }

        $slots = $schedule->getAvailableTimeSlots($validated['duration']);

        return response()->json(['slots' => $slots]);
    }
}