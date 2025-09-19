<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $staff = $request->input('staff');
        $week = $request->input('week', now()->format('Y-m-d'));
        
        $startOfWeek = Carbon::parse($week)->startOfWeek();
        $endOfWeek = Carbon::parse($week)->endOfWeek();

        $schedules = Schedule::with(['staff', 'appointments'])
            ->when($staff, function ($query, $staff) {
                return $query->where('staff_id', $staff);
            })
            ->byDateRange($startOfWeek, $endOfWeek)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $staffMembers = User::staff()->active()->get();

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'staffMembers' => $staffMembers,
            'currentWeek' => $startOfWeek->format('Y-m-d'),
            'filters' => $request->only(['staff', 'week']),
        ]);
    }

    public function create()
    {
        $staffMembers = User::staff()->active()->get();
        
        return Inertia::render('Schedules/Create', [
            'staffMembers' => $staffMembers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // Check for existing schedule on the same date
        $existingSchedule = Schedule::where('staff_id', $validated['staff_id'])
            ->where('date', $validated['date'])
            ->first();

        if ($existingSchedule) {
            return back()->withErrors(['date' => 'Schedule already exists for this staff member on this date.']);
        }

        $startDateTime = Carbon::parse($validated['date'] . ' ' . $validated['start_time']);
        $endDateTime = Carbon::parse($validated['date'] . ' ' . $validated['end_time']);

        $schedule = Schedule::create([
            'staff_id' => $validated['staff_id'],
            'date' => $validated['date'],
            'start_time' => $startDateTime,
            'end_time' => $endDateTime,
            'is_available' => $validated['is_available'] ?? true,
            'notes' => $validated['notes'],
        ]);

        AuditLog::logCreate(Auth::id(), Auth::user()->role, 'schedules', $schedule->id, [
            'staff_name' => $schedule->staff->name,
            'date' => $schedule->formatted_date,
            'time_range' => $schedule->time_range,
        ]);

        return redirect()->route('schedules.index')->with('success', 'Schedule created successfully.');
    }

    public function edit(Schedule $schedule)
    {
        if (!$schedule->canBeModified()) {
            return back()->with('error', 'This schedule cannot be modified.');
        }

        $schedule->load('staff');
        $staffMembers = User::staff()->active()->get();

        return Inertia::render('Schedules/Edit', [
            'schedule' => $schedule,
            'staffMembers' => $staffMembers,
        ]);
    }

    public function update(Request $request, Schedule $schedule)
    {
        if (!$schedule->canBeModified()) {
            return back()->with('error', 'This schedule cannot be modified.');
        }

        $validated = $request->validate([
            'staff_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $startDateTime = Carbon::parse($validated['date'] . ' ' . $validated['start_time']);
        $endDateTime = Carbon::parse($validated['date'] . ' ' . $validated['end_time']);

        $schedule->update([
            'staff_id' => $validated['staff_id'],
            'date' => $validated['date'],
            'start_time' => $startDateTime,
            'end_time' => $endDateTime,
            'is_available' => $validated['is_available'] ?? true,
            'notes' => $validated['notes'],
        ]);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'schedules', $schedule->id, [
            'updated_fields' => array_keys($validated),
        ]);

        return redirect()->route('schedules.index')->with('success', 'Schedule updated successfully.');
    }

    public function destroy(Schedule $schedule)
    {
        if (!$schedule->canBeModified()) {
            return back()->with('error', 'This schedule cannot be deleted.');
        }

        // Check if there are appointments on this schedule
        if ($schedule->getBookedAppointmentsCount() > 0) {
            return back()->with('error', 'Cannot delete schedule with existing appointments.');
        }

        AuditLog::logDelete(Auth::id(), Auth::user()->role, 'schedules', $schedule->id, [
            'staff_name' => $schedule->staff->name,
            'date' => $schedule->formatted_date,
        ]);

        $schedule->delete();

        return redirect()->route('schedules.index')->with('success', 'Schedule deleted successfully.');
    }

    public function makeUnavailable(Request $request, Schedule $schedule)
    {
        $reason = $request->input('reason');
        $schedule->makeUnavailable($reason);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'schedules', $schedule->id, [
            'action' => 'made_unavailable',
            'reason' => $reason,
        ]);

        return back()->with('success', 'Schedule marked as unavailable.');
    }

    public function makeAvailable(Schedule $schedule)
    {
        $schedule->makeAvailable();

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'schedules', $schedule->id, [
            'action' => 'made_available',
        ]);

        return back()->with('success', 'Schedule marked as available.');
    }
}