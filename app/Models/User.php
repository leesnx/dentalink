<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'status',
        // Staff-specific fields
        'employee_id',
        'position',
        'license_number',
        'license_expiry',
        'hire_date',
        'hourly_rate',
        'specializations',
        'bio',
        'years_experience',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'license_expiry' => 'date',
        'hire_date' => 'date',
        'hourly_rate' => 'decimal:2',
        'specializations' => 'array',
    ];

    // Relationships

    // Patient relationship (if user is a patient)
    public function patient()
    {
        return $this->hasOne(Patient::class)->withDefault([
            'birthday' => null,
            'gender' => null,
            'emergency_contact_name' => 'Not Set',
            'emergency_contact_phone' => 'Not Set',
            'medical_history' => 'No history recorded',
            'allergies' => 'None known',
            'current_medications' => 'None',
        ]);
    }

    // Appointments as patient
    public function patientAppointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    // Appointments as doctor/staff
    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    // Patient records created by this user (if staff)
    public function createdPatientRecords()
    {
        return $this->hasMany(PatientRecord::class, 'created_by');
    }

    // Patient records for this user (if patient)
    public function patientRecords()
    {
        return $this->hasMany(PatientRecord::class, 'patient_id');
    }

    // Treatment plans as patient
    public function patientTreatmentPlans()
    {
        return $this->hasMany(TreatmentPlan::class, 'patient_id');
    }

    // Treatment plans created as doctor
    public function doctorTreatmentPlans()
    {
        return $this->hasMany(TreatmentPlan::class, 'doctor_id');
    }

    // Staff schedules (if staff)
    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'staff_id');
    }

    // Notifications
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Financial records (if patient)
    public function financialRecords()
    {
        return $this->hasMany(FinancialRecord::class, 'patient_id');
    }

    // Audit logs performed by this user
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'performed_by');
    }

    // Scopes
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePatients($query)
    {
        return $query->where('role', 'patient');
    }

    public function scopeStaff($query)
    {
        return $query->where('role', 'staff');
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    // Role checking methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isStaff()
    {
        return $this->role === 'staff';
    }

    public function isPatient()
    {
        return $this->role === 'patient';
    }

    public function isDentist()
    {
        return $this->isStaff() && $this->position === 'dentist';
    }

    public function isHygienist()
    {
        return $this->isStaff() && $this->position === 'hygienist';
    }

    public function isReceptionist()
    {
        return $this->isStaff() && $this->position === 'receptionist';
    }

    // Helper methods
    public function getFullNameAttribute()
    {
        return $this->name;
    }

    public function hasUpcomingAppointments()
    {
        if ($this->isPatient()) {
            return $this->patientAppointments()
                ->where('appointment_date', '>=', now())
                ->where('status', '!=', 'cancelled')
                ->exists();
        }
        
        if ($this->isStaff()) {
            return $this->doctorAppointments()
                ->where('appointment_date', '>=', now())
                ->where('status', '!=', 'cancelled')
                ->exists();
        }

        return false;
    }

    public function ensurePatientRecord()
    {
        if ($this->isPatient() && !$this->patient()->exists()) {
            return Patient::create([
                'user_id' => $this->id,
                'birthday' => null,
                'gender' => null,
                'emergency_contact_name' => 'To be updated',
                'emergency_contact_phone' => 'To be updated',
                'medical_history' => 'No history recorded',
                'allergies' => 'None known',
                'current_medications' => 'None',
            ]);
        }
        return $this->patient;
    }
}