<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FinancialRecord;
use App\Models\User;
use App\Models\Appointment;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FinancialRecordController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('payment_status');
        $method = $request->input('payment_method');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $records = FinancialRecord::with(['patient', 'appointment'])
            ->when($search, function ($query, $search) {
                return $query->whereHas('patient', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                return $query->where('payment_status', $status);
            })
            ->when($method, function ($query, $method) {
                return $query->where('payment_method', $method);
            })
            ->when($dateFrom, function ($query, $dateFrom) {
                return $query->whereDate('transaction_date', '>=', $dateFrom);
            })
            ->when($dateTo, function ($query, $dateTo) {
                return $query->whereDate('transaction_date', '<=', $dateTo);
            })
            ->orderBy('transaction_date', 'desc')
            ->paginate(15);

        $summary = [
            'total_revenue' => FinancialRecord::paid()->sum('amount'),
            'outstanding_balance' => FinancialRecord::getOutstandingBalance(),
            'monthly_revenue' => FinancialRecord::getMonthlyRevenue(),
        ];

        return Inertia::render('FinancialRecords/Index', [
            'records' => $records,
            'summary' => $summary,
            'filters' => $request->only(['search', 'payment_status', 'payment_method', 'date_from', 'date_to']),
        ]);
    }

    public function create()
    {
        $patients = User::patients()->active()->orderBy('name')->get();
        $appointments = Appointment::with(['patient', 'service'])
            ->where('status', 'completed')
            ->orderBy('appointment_date', 'desc')
            ->get();

        return Inertia::render('FinancialRecords/Create', [
            'patients' => $patients,
            'appointments' => $appointments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,paid,partial,overdue',
            'payment_method' => 'nullable|in:cash,credit_card,debit_card,bank_transfer,insurance',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $record = FinancialRecord::create($validated);

        AuditLog::logCreate(Auth::id(), Auth::user()->role, 'financial_records', $record->id, [
            'patient_name' => $record->patient->name,
            'amount' => $record->amount,
            'payment_status' => $record->payment_status,
        ]);

        return redirect()->route('financial-records.show', $record)
            ->with('success', 'Financial record created successfully.');
    }

    public function show(FinancialRecord $financialRecord)
    {
        $financialRecord->load(['patient', 'appointment.service']);

        return Inertia::render('FinancialRecords/Show', [
            'record' => $financialRecord,
        ]);
    }

    public function edit(FinancialRecord $financialRecord)
    {
        if (!$financialRecord->canBeModified()) {
            return back()->with('error', 'This financial record cannot be modified.');
        }

        $financialRecord->load(['patient', 'appointment']);
        $patients = User::patients()->active()->orderBy('name')->get();

        return Inertia::render('FinancialRecords/Edit', [
            'record' => $financialRecord,
            'patients' => $patients,
        ]);
    }

    public function update(Request $request, FinancialRecord $financialRecord)
    {
        if (!$financialRecord->canBeModified()) {
            return back()->with('error', 'This financial record cannot be modified.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,paid,partial,overdue',
            'payment_method' => 'nullable|in:cash,credit_card,debit_card,bank_transfer,insurance',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $financialRecord->update($validated);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'financial_records', $financialRecord->id, [
            'updated_fields' => array_keys($validated),
        ]);

        return redirect()->route('financial-records.show', $financialRecord)
            ->with('success', 'Financial record updated successfully.');
    }

    public function markAsPaid(Request $request, FinancialRecord $financialRecord)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:cash,credit_card,debit_card,bank_transfer,insurance',
            'notes' => 'nullable|string',
        ]);

        $financialRecord->markAsPaid($validated['payment_method'], $validated['notes']);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'financial_records', $financialRecord->id, [
            'action' => 'marked_as_paid',
            'payment_method' => $validated['payment_method'],
        ]);

        return back()->with('success', 'Payment recorded successfully.');
    }

    public function reports(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $reports = [
            'total_revenue' => FinancialRecord::getTotalRevenue($startDate, $endDate),
            'outstanding_balance' => FinancialRecord::getOutstandingBalance(),
            'payment_method_breakdown' => FinancialRecord::getPaymentMethodBreakdown($startDate, $endDate),
            'overdue_records' => FinancialRecord::getOverdueRecords(),
            'monthly_trends' => FinancialRecord::selectRaw('MONTH(transaction_date) as month, SUM(amount) as total')
                ->paid()
                ->whereYear('transaction_date', now()->year)
                ->groupBy('month')
                ->get(),
        ];

        return Inertia::render('FinancialRecords/Reports', [
            'reports' => $reports,
            'dateRange' => ['start' => $startDate, 'end' => $endDate],
        ]);
    }
}