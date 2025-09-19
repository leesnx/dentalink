<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\Appointment;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PatientRecordController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $doctor = $request->input('doctor');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $records = PatientRecord::with(['patient', 'appointment', 'createdBy'])
            ->when($search, function ($query, $search) {
                return $query->whereHas('patient', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($doctor, function ($query, $doctor) {
                return $query->where('created_by', $doctor);
            })
            ->when($dateFrom, function ($query, $dateFrom) {
                return $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($query, $dateTo) {
                return $query->whereDate('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $doctors = User::staff()->where('position', 'dentist')->get();

        return Inertia::render('PatientRecords/Index', [
            'records' => $records,
            'doctors' => $doctors,
            'filters' => $request->only(['search', 'doctor', 'date_from', 'date_to']),
        ]);
    }

    public function create(Request $request)
    {
        $appointmentId = $request->input('appointment_id');
        $appointment = null;
        
        if ($appointmentId) {
            $appointment = Appointment::with(['patient', 'service'])->find($appointmentId);
        }

        $patients = User::patients()->active()->orderBy('name')->get();

        return Inertia::render('PatientRecords/Create', [
            'appointment' => $appointment,
            'patients' => $patients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'treatment_notes' => 'required|string',
            'diagnosis' => 'required|string',
            'procedures_performed' => 'required|array',
            'procedures_performed.*' => 'string',
            'recommendations' => 'nullable|string',
            'follow_up_instructions' => 'nullable|string',
        ]);

        $record = PatientRecord::create([
            ...$validated,
            'created_by' => Auth::id(),
        ]);

        AuditLog::logCreate(Auth::id(), Auth::user()->role, 'patient_records', $record->id, [
            'patient_name' => $record->patient->name,
            'procedures_count' => count($validated['procedures_performed']),
        ]);

        return redirect()->route('patient-records.show', $record)
            ->with('success', 'Patient record created successfully.');
    }

    public function show(PatientRecord $patientRecord)
    {
        $patientRecord->load(['patient.patient', 'appointment.service', 'createdBy']);

        return Inertia::render('PatientRecords/Show', [
            'record' => $patientRecord,
        ]);
    }

    public function edit(PatientRecord $patientRecord)
    {
        $patientRecord->load(['patient', 'appointment']);
        $patients = User::patients()->active()->orderBy('name')->get();

        return Inertia::render('PatientRecords/Edit', [
            'record' => $patientRecord,
            'patients' => $patients,
        ]);
    }

    public function update(Request $request, PatientRecord $patientRecord)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'treatment_notes' => 'required|string',
            'diagnosis' => 'required|string',
            'procedures_performed' => 'required|array',
            'procedures_performed.*' => 'string',
            'recommendations' => 'nullable|string',
            'follow_up_instructions' => 'nullable|string',
        ]);

        $patientRecord->update($validated);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'patient_records', $patientRecord->id, [
            'updated_fields' => array_keys($validated),
        ]);

        return redirect()->route('patient-records.show', $patientRecord)
            ->with('success', 'Patient record updated successfully.');
    }

    public function destroy(PatientRecord $patientRecord)
    {
        AuditLog::logDelete(Auth::id(), Auth::user()->role, 'patient_records', $patientRecord->id, [
            'patient_name' => $patientRecord->patient->name,
        ]);

        $patientRecord->delete();

        return redirect()->route('patient-records.index')
            ->with('success', 'Patient record deleted successfully.');
    }
}