<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $category = $request->input('category');
        $status = $request->input('is_active');

        $services = Service::when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                           ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($category, function ($query, $category) {
                return $query->where('category', $category);
            })
            ->when($status !== null, function ($query) use ($status) {
                return $query->where('is_active', $status == '1');
            })
            ->orderBy('name')
            ->get();

        // Add formatted data for frontend
        $services = $services->map(function ($service) {
            $service->formatted_price =  number_format($service->price, 2);
            $service->category_display = ucfirst(str_replace('_', ' ', $service->category));
            return $service;
        });

        $summary = [
            'total' => Service::count(),
            'active' => Service::where('is_active', true)->count(),
            'inactive' => Service::where('is_active', false)->count(),
        ];

        $categories = Service::distinct()->pluck('category');

        $data = [
            'services' => $services,
            'summary' => $summary,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'is_active']),
        ];

        // Check if it's an AJAX/API request
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json($data);
        }

        // For Inertia pages
        return Inertia::render('Services/Index', $data);
    }

    public function create()
    {
        return Inertia::render('Services/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:15',
            'category' => 'required|in:preventive,restorative,cosmetic,surgical,emergency',
            'is_active' => 'boolean',
        ]);

        // Set default value for is_active if not provided
        $validated['is_active'] = $validated['is_active'] ?? true;

        $service = Service::create($validated);

        AuditLog::logCreate(Auth::id(), Auth::user()->role, 'services', $service->id, [
            'name' => $service->name,
            'category' => $service->category,
            'price' => $service->price,
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Service created successfully.',
                'service' => $service
            ], 201);
        }

        return redirect()->route('services.index')->with('success', 'Service created successfully.');
    }

    public function show(Service $service)
    {
        $service->loadCount('appointments');
        
        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json(['service' => $service]);
        }
        
        return Inertia::render('Services/Show', [
            'service' => $service,
        ]);
    }

    public function edit(Service $service)
    {
        return Inertia::render('Services/Edit', [
            'service' => $service,
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:15',
            'category' => 'required|in:preventive,restorative,cosmetic,surgical,emergency',
            'is_active' => 'boolean',
        ]);

        $service->update($validated);

        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'services', $service->id, [
            'updated_fields' => array_keys($validated),
        ]);

        // Handle both API and web requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => 'Service updated successfully.',
                'service' => $service->fresh()
            ]);
        }

        return redirect()->route('services.show', $service)->with('success', 'Service updated successfully.');
    }

    public function destroy(Service $service)
    {
        if ($service->appointments()->exists()) {
            $errorMessage = 'Cannot delete service that has appointments.';
            
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json(['message' => $errorMessage], 422);
            }
            
            return back()->with('error', $errorMessage);
        }

        AuditLog::logDelete(Auth::id(), Auth::user()->role, 'services', $service->id, [
            'name' => $service->name,
        ]);

        $service->delete();

        // Handle both API and web requests
        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json(['message' => 'Service deleted successfully.']);
        }

        return redirect()->route('services.index')->with('success', 'Service deleted successfully.');
    }

    /**
     * Toggle service status (activate/deactivate)
     */
    public function toggleStatus(Service $service)
    {
        $service->update(['is_active' => !$service->is_active]);
        
        $status = $service->is_active ? 'activated' : 'deactivated';
        
        AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'services', $service->id, [
            'status_changed' => $status,
        ]);

        if (request()->expectsJson() || request()->wantsJson()) {
            return response()->json([
                'message' => "Service {$status} successfully.",
                'service' => $service->fresh()
            ]);
        }

        return back()->with('success', "Service {$status} successfully.");
    }

    /**
     * Bulk update service status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'service_ids' => 'required|array',
            'service_ids.*' => 'exists:services,id',
            'status' => 'required|in:active,inactive',
        ]);

        $isActive = $validated['status'] === 'active';
        
        $updatedCount = Service::whereIn('id', $validated['service_ids'])
            ->update(['is_active' => $isActive]);

        $status = $isActive ? 'activated' : 'deactivated';

        // Log bulk update
        foreach ($validated['service_ids'] as $serviceId) {
            AuditLog::logUpdate(Auth::id(), Auth::user()->role, 'services', $serviceId, [
                'bulk_status_changed' => $status,
            ]);
        }

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'message' => "{$updatedCount} services {$status} successfully.",
                'count' => $updatedCount
            ]);
        }

        return back()->with('success', "{$updatedCount} services {$status} successfully.");
    }
}