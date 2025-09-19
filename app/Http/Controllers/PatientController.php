<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\PatientRecord;
use App\Models\TreatmentPlan;
use App\Models\FinancialRecord;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $gender = $request->input('gender');
        
        $patients = User::patients()
            ->with('patient')
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($gender, function ($query, $gender) {
                return $query->whereHas('patient', function($q) use ($gender) {
                    $q->where('gender', $gender);
                });
            })
            ->paginate(15);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'patients' => $patients->items(),
                'pagination' => [
                    'current_page' => $patients->currentPage(),
                    'last_page' => $patients->lastPage(),
                    'total' => $patients->total()
                ]
            ]);
        }

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'status', 'gender']),
        ]);
    }

    public function show(User $patient)
    {
        $patient->load([
            'patient',
            'patientAppointments.service',
            'patientAppointments.doctor',
            'patientRecords.createdBy',
            'patientTreatmentPlans.doctor',
            'financialRecords'
        ]);

        $upcomingAppointments = $patient->patientAppointments()
            ->upcoming()
            ->with(['service', 'doctor'])
            ->get();

        $recentRecords = $patient->patientRecords()
            ->with('createdBy')
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Patients/Show', [
            'patient' => $patient,
            'upcomingAppointments' => $upcomingAppointments,
            'recentRecords' => $recentRecords,
        ]);
    }

    public function create()
    {
        return Inertia::render('Patients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'insurance_provider' => 'nullable|string|max:255',
            'insurance_number' => 'nullable|string|max:100',
            'medical_history' => 'nullable|string',
            'allergies' => 'nullable|string',
            'current_medications' => 'nullable|string',
            'blood_type' => 'nullable|string|max:10',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'password' => Hash::make($validated['password']),
            'role' => 'patient',
            'status' => 'active',
        ]);

        Patient::create([
            'user_id' => $user->id,
            'birthday' => $validated['birthday'],
            'gender' => $validated['gender'],
            'emergency_contact_name' => $validated['emergency_contact_name'],
            'emergency_contact_phone' => $validated['emergency_contact_phone'],
            'emergency_contact_relationship' => $validated['emergency_contact_relationship'],
            'insurance_provider' => $validated['insurance_provider'],
            'insurance_number' => $validated['insurance_number'],
            'medical_history' => $validated['medical_history'],
            'allergies' => $validated['allergies'],
            'current_medications' => $validated['current_medications'],
            'blood_type' => $validated['blood_type'],
        ]);

        AuditLog::logCreate(Auth::id(), Auth::user()->role, 'patients', $user->id, [
            'name' => $user->name,
            'email' => $user->email,
        ]);

        return redirect()->route('patients.show', $user)->with('success', 'Patient created successfully.');
    }

    public function edit(User $patient)
    {
        $patient->load('patient');
        
        return Inertia::render('Patients/Edit', [
            'patient' => $patient,
        ]);
    }

    public function update(Request $request, User $patient)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $patient->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'insurance_provider' => 'nullable|string|max:255',
            'insurance_number' => 'nullable|string|max:100',
            'medical_history' => 'nullable|string',
            'allergies' => 'nullable|string',
            'current_medications' => 'nullable|string',
            'blood_type' => 'nullable|string|max:10',
        ]);

        // Update user data
        $patient->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'status' => $validated['status'] ?? $patient->status,
        ]);

        // Update patient-specific data
        $patient->patient()->updateOrCreate(
            ['user_id' => $patient->id],
            [
                'birthday' => $validated['birthday'],
                'gender' => $validated['gender'],
                'emergency_contact_name' => $validated['emergency_contact_name'],
                'emergency_contact_phone' => $validated['emergency_contact_phone'],
                'emergency_contact_relationship' => $validated['emergency_contact_relationship'],
                'insurance_provider' => $validated['insurance_provider'],
                'insurance_number' => $validated['insurance_number'],
                'medical_history' => $validated['medical_history'],
                'allergies' => $validated['allergies'],
                'current_medications' => $validated['current_medications'],
                'blood_type' => $validated['blood_type'],
            ]
        );

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'patients', $patient->id, [
            'updated_fields' => array_keys($validated),
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Patient updated successfully.',
                'patient' => $patient->fresh()->load('patient')
            ]);
        }

        return redirect()->route('patients.show', $patient)->with('success', 'Patient updated successfully.');
    }

    public function destroy(User $patient)
    {
        AuditLog::logDelete(Auth::id(), Auth::user()->role, 'patients', $patient->id, [
            'name' => $patient->name,
            'email' => $patient->email,
        ]);

        $patient->patient()->delete();
        $patient->delete();

        return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
    }
}