<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'service_id',
        'appointment_date',
        'appointment_time',
        'duration_minutes',
        'status',
        'checked_in_at',
        'reason_for_visit',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'appointment_time' => 'datetime',
        'checked_in_at' => 'datetime',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function patientRecords()
    {
        return $this->hasMany(PatientRecord::class);
    }

    public function financialRecords()
    {
        return $this->hasMany(FinancialRecord::class);
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now())
                    ->where('status', '!=', 'cancelled');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('appointment_date', today());
    }

    public function scopeTomorrow($query)
    {
        return $query->whereDate('appointment_date', now()->tomorrow());
    }
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('appointment_date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeByPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeByDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    // Accessors
    public function getFormattedDateTimeAttribute()
    {
        return $this->appointment_date->format('M d, Y') . ' at ' . $this->appointment_time->format('g:i A');
    }

    public function getFormattedDateAttribute()
    {
        return $this->appointment_date->format('M d, Y');
    }

    public function getFormattedTimeAttribute()
    {
        return $this->appointment_time->format('g:i A');
    }

    public function getEstimatedEndTimeAttribute()
    {
        return $this->appointment_time->addMinutes($this->duration_minutes);
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'scheduled' => 'blue',
            'confirmed' => 'green',
            'checked_in' => 'purple',
            'in_progress' => 'yellow',
            'completed' => 'green',
            'cancelled' => 'red',
            'no_show' => 'gray',
            default => 'gray'
        };
    }

    // Helper methods
    public function isToday()
    {
        return $this->appointment_date->isToday();
    }

    public function isTomorrow()
    {
        return $this->appointment_date->isTomorrow();
    }

    public function isPast()
    {
        return $this->appointment_date->isPast();
    }

    public function isUpcoming()
    {
        return $this->appointment_date->isFuture() && $this->status !== 'cancelled';
    }

    public function canCheckIn()
    {
        return $this->isToday() && 
               in_array($this->status, ['scheduled', 'confirmed']) &&
               now()->greaterThanOrEqualTo($this->appointment_time->subMinutes(15));
    }

    public function canCancel()
    {
        return in_array($this->status, ['scheduled', 'confirmed']) && 
               $this->appointment_date->isFuture();
    }

    public function checkIn()
    {
        if ($this->canCheckIn()) {
            $this->update([
                'status' => 'checked_in',
                'checked_in_at' => now()
            ]);
            return true;
        }
        return false;
    }

    public function cancel($reason = null)
    {
        if ($this->canCancel()) {
            $this->update([
                'status' => 'cancelled',
                'notes' => $this->notes . "\nCancelled: " . ($reason ?? 'No reason provided')
            ]);
            return true;
        }
        return false;
    }

    public function complete($notes = null)
    {
        $this->update([
            'status' => 'completed',
            'notes' => $this->notes . ($notes ? "\nCompleted: " . $notes : '')
        ]);
    }

    public function getPatientAge()
    {
        return $this->patient->patient->age ?? null;
    }
}