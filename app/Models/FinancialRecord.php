<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'appointment_id',
        'amount',
        'payment_status',
        'payment_method',
        'transaction_date',
        'description',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopePartial($query)
    {
        return $query->where('payment_status', 'partial');
    }

    public function scopeOverdue($query)
    {
        return $query->where('payment_status', 'overdue');
    }

    public function scopeByPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeByPaymentMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('transaction_date', now()->year);
    }

    public function scopeLastMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->subMonth()->month)
                    ->whereYear('transaction_date', now()->subMonth()->year);
    }

    public function scopeHighValue($query, $amount = 500)
    {
        return $query->where('amount', '>', $amount);
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return '$' . number_format($this->amount, 2);
    }

    public function getFormattedDateAttribute()
    {
        return $this->transaction_date->format('M d, Y');
    }

    public function getStatusColorAttribute()
    {
        return match($this->payment_status) {
            'pending' => 'yellow',
            'paid' => 'green',
            'partial' => 'blue',
            'overdue' => 'red',
            default => 'gray'
        };
    }

    public function getPatientNameAttribute()
    {
        return $this->patient->name ?? 'Unknown';
    }

    public function getPaymentMethodDisplayAttribute()
    {
        return match($this->payment_method) {
            'credit_card' => 'Credit Card',
            'debit_card' => 'Debit Card',
            'bank_transfer' => 'Bank Transfer',
            default => ucfirst($this->payment_method ?? 'Not specified')
        };
    }

    public function getStatusDisplayAttribute()
    {
        return ucfirst($this->payment_status);
    }

    // Helper methods
    public function isPending()
    {
        return $this->payment_status === 'pending';
    }

    public function isPaid()
    {
        return $this->payment_status === 'paid';
    }

    public function isPartial()
    {
        return $this->payment_status === 'partial';
    }

    public function isOverdue()
    {
        return $this->payment_status === 'overdue';
    }

    public function markAsPaid($paymentMethod = null, $notes = null)
    {
        $updateData = ['payment_status' => 'paid'];
        
        if ($paymentMethod) {
            $updateData['payment_method'] = $paymentMethod;
        }
        
        if ($notes) {
            $updateData['notes'] = $this->notes . "\n" . $notes;
        }
        
        return $this->update($updateData);
    }

    public function markAsPartial($notes = null)
    {
        $updateData = ['payment_status' => 'partial'];
        
        if ($notes) {
            $updateData['notes'] = $this->notes . "\n" . $notes;
        }
        
        return $this->update($updateData);
    }

    public function markAsOverdue($notes = null)
    {
        $updateData = ['payment_status' => 'overdue'];
        
        if ($notes) {
            $updateData['notes'] = $this->notes . "\nMarked overdue: " . $notes;
        }
        
        return $this->update($updateData);
    }

    public function isHighValue($threshold = 1000)
    {
        return $this->amount > $threshold;
    }

    public function isCashPayment()
    {
        return $this->payment_method === 'cash';
    }

    public function isCardPayment()
    {
        return in_array($this->payment_method, ['credit_card', 'debit_card']);
    }

    public function isInsurancePayment()
    {
        return $this->payment_method === 'insurance';
    }

    public function canBeModified()
    {
        return in_array($this->payment_status, ['pending', 'partial']);
    }

    public function getDaysOverdue()
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        
        return now()->diffInDays($this->transaction_date);
    }

    // Static methods for financial reporting
    public static function getTotalRevenue($startDate = null, $endDate = null)
    {
        $query = self::paid();
        
        if ($startDate && $endDate) {
            $query = $query->byDateRange($startDate, $endDate);
        }
        
        return $query->sum('amount');
    }

    public static function getOutstandingBalance()
    {
        return self::whereIn('payment_status', ['pending', 'partial', 'overdue'])->sum('amount');
    }

    public static function getMonthlyRevenue($year = null, $month = null)
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        return self::paid()
                   ->whereYear('transaction_date', $year)
                   ->whereMonth('transaction_date', $month)
                   ->sum('amount');
    }

    public static function getPaymentMethodBreakdown($startDate = null, $endDate = null)
    {
        $query = self::paid();
        
        if ($startDate && $endDate) {
            $query = $query->byDateRange($startDate, $endDate);
        }
        
        return $query->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
                     ->groupBy('payment_method')
                     ->get();
    }

    public static function getOverdueRecords()
    {
        return self::overdue()->with('patient')->orderBy('transaction_date')->get();
    }

    // Financial summary
    public function getFinancialSummary()
    {
        return [
            'id' => $this->id,
            'patient_name' => $this->patient_name,
            'amount' => $this->formatted_amount,
            'status' => $this->status_display,
            'status_color' => $this->status_color,
            'payment_method' => $this->payment_method_display,
            'transaction_date' => $this->formatted_date,
            'description' => $this->description,
            'can_be_modified' => $this->canBeModified(),
        ];
    }
}