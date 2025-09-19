<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'date',
        'start_time',
        'end_time',
        'is_available',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_available' => 'boolean',
    ];

    // Relationships
    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id', 'staff_id')
                    ->whereDate('appointment_date', $this->date);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeUnavailable($query)
    {
        return $query->where('is_available', false);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeTomorrow($query)
    {
        return $query->whereDate('date', now()->addDay());
    }


    public function scopeThisWeek($query)
    {
        return $query->whereBetween('date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', today());
    }

    public function scopeByStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Accessors
    public function getFormattedDateAttribute()
    {
        return $this->date->format('M d, Y');
    }

    public function getFormattedStartTimeAttribute()
    {
        return $this->start_time->format('g:i A');
    }

    public function getFormattedEndTimeAttribute()
    {
        return $this->end_time->format('g:i A');
    }

    public function getTimeRangeAttribute()
    {
        return $this->formatted_start_time . ' - ' . $this->formatted_end_time;
    }

    public function getDurationHoursAttribute()
    {
        return $this->start_time->diffInHours($this->end_time);
    }

    public function getDurationMinutesAttribute()
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    public function getStaffNameAttribute()
    {
        return $this->staff->name ?? 'Unknown';
    }

    public function getStatusColorAttribute()
    {
        if (!$this->is_available) {
            return 'red';
        }
        
        if ($this->date->isToday()) {
            return 'green';
        }
        
        if ($this->date->isFuture()) {
            return 'blue';
        }
        
        return 'gray';
    }

    // Helper methods
    public function isToday()
    {
        return $this->date->isToday();
    }

    public function isTomorrow()
    {
        return $this->date->isTomorrow();
    }

    public function isPast()
    {
        return $this->date->isPast();
    }

    public function isFuture()
    {
        return $this->date->isFuture();
    }

    public function isWeekend()
    {
        return $this->date->isWeekend();
    }

    public function hasConflict($startTime, $endTime)
    {
        $scheduleStart = Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->start_time->format('H:i:s'));
        $scheduleEnd = Carbon::parse($this->date->format('Y-m-d') . ' ' . $this->end_time->format('H:i:s'));
        
        $newStart = Carbon::parse($startTime);
        $newEnd = Carbon::parse($endTime);
        
        return $newStart->between($scheduleStart, $scheduleEnd) || 
               $newEnd->between($scheduleStart, $scheduleEnd) ||
               ($newStart->lessThanOrEqualTo($scheduleStart) && $newEnd->greaterThanOrEqualTo($scheduleEnd));
    }

    public function getAvailableTimeSlots($appointmentDuration = 30)
    {
        if (!$this->is_available) {
            return [];
        }

        $slots = [];
        $current = $this->start_time->copy();
        $appointments = $this->appointments()->orderBy('appointment_time')->get();
        
        while ($current->addMinutes($appointmentDuration)->lessThanOrEqualTo($this->end_time)) {
            $slotStart = $current->copy()->subMinutes($appointmentDuration);
            $slotEnd = $current->copy();
            
            // Check if this slot conflicts with any existing appointment
            $hasConflict = $appointments->contains(function ($appointment) use ($slotStart, $slotEnd) {
                $appointmentStart = $appointment->appointment_time;
                $appointmentEnd = $appointmentStart->copy()->addMinutes($appointment->duration_minutes);
                
                return $slotStart->between($appointmentStart, $appointmentEnd) ||
                       $slotEnd->between($appointmentStart, $appointmentEnd) ||
                       ($slotStart->lessThanOrEqualTo($appointmentStart) && $slotEnd->greaterThanOrEqualTo($appointmentEnd));
            });
            
            if (!$hasConflict) {
                $slots[] = [
                    'start_time' => $slotStart->format('H:i'),
                    'end_time' => $slotEnd->format('H:i'),
                    'formatted_time' => $slotStart->format('g:i A') . ' - ' . $slotEnd->format('g:i A')
                ];
            }
        }
        
        return $slots;
    }

    public function getBookedAppointmentsCount()
    {
        return $this->appointments()
                    ->whereNotIn('status', ['cancelled', 'no_show'])
                    ->count();
    }

    public function getUtilizationPercentage()
    {
        $totalMinutes = $this->duration_minutes;
        $bookedMinutes = $this->appointments()
                             ->whereNotIn('status', ['cancelled', 'no_show'])
                             ->sum('duration_minutes');
        
        return $totalMinutes > 0 ? round(($bookedMinutes / $totalMinutes) * 100, 1) : 0;
    }

    public function canBeModified()
    {
        return $this->date->isFuture() || 
               ($this->date->isToday() && now()->lessThan($this->start_time));
    }

    public function makeUnavailable($reason = null)
    {
        $this->update([
            'is_available' => false,
            'notes' => $this->notes . ($reason ? "\nUnavailable: " . $reason : '')
        ]);
    }

    public function makeAvailable()
    {
        $this->update(['is_available' => true]);
    }
}