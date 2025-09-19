<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'action',
        'performed_by',
        'user_role',
        'target_collection',
        'target_id',
        'details',
        'timestamp',
    ];

    protected $casts = [
        'details' => 'array',
        'timestamp' => 'datetime',
    ];

    // Relationships
    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // Scopes
    public function scopeByUser($query, $userId)
    {
        return $query->where('performed_by', $userId);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('user_role', $role);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByCollection($query, $collection)
    {
        return $query->where('target_collection', $collection);
    }

    public function scopeByTarget($query, $collection, $targetId)
    {
        return $query->where('target_collection', $collection)
                    ->where('target_id', $targetId);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('timestamp', '>=', now()->subDays($days));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('timestamp', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('timestamp', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('timestamp', now()->month)
                    ->whereYear('timestamp', now()->year);
    }

    public function scopeCreate($query)
    {
        return $query->where('action', 'create');
    }

    public function scopeUpdate($query)
    {
        return $query->where('action', 'update');
    }

    public function scopeDelete($query)
    {
        return $query->where('action', 'delete');
    }

    public function scopeView($query)
    {
        return $query->where('action', 'view');
    }

    // Accessors
    public function getFormattedTimestampAttribute()
    {
        return $this->timestamp->format('M d, Y g:i A');
    }

    public function getTimeAgoAttribute()
    {
        return $this->timestamp->diffForHumans();
    }

    public function getUserNameAttribute()
    {
        return $this->performedBy->name ?? 'System';
    }

    public function getActionColorAttribute()
    {
        return match($this->action) {
            'create' => 'green',
            'update' => 'blue',
            'delete' => 'red',
            'view' => 'gray',
            'login' => 'purple',
            'logout' => 'orange',
            default => 'gray'
        };
    }

    public function getActionIconAttribute()
    {
        return match($this->action) {
            'create' => 'plus',
            'update' => 'edit',
            'delete' => 'trash',
            'view' => 'eye',
            'login' => 'login',
            'logout' => 'logout',
            default => 'activity'
        };
    }

    public function getTargetDisplayAttribute()
    {
        return ucfirst($this->target_collection) . ' #' . $this->target_id;
    }

    public function getRoleColorAttribute()
    {
        return match($this->user_role) {
            'admin' => 'red',
            'staff' => 'blue',
            'patient' => 'green',
            default => 'gray'
        };
    }

    // Helper methods
    public function isCreate()
    {
        return $this->action === 'create';
    }

    public function isUpdate()
    {
        return $this->action === 'update';
    }

    public function isDelete()
    {
        return $this->action === 'delete';
    }

    public function isView()
    {
        return $this->action === 'view';
    }

    public function isLogin()
    {
        return $this->action === 'login';
    }

    public function isLogout()
    {
        return $this->action === 'logout';
    }

    public function isRecent($hours = 24)
    {
        return $this->timestamp->greaterThan(now()->subHours($hours));
    }

    public function hasDetails()
    {
        return !empty($this->details) && is_array($this->details);
    }

    public function getDetail($key, $default = null)
    {
        return $this->details[$key] ?? $default;
    }

    // Static methods for creating audit logs
    public static function logCreate($userId, $userRole, $targetCollection, $targetId, $details = [])
    {
        return self::create([
            'action' => 'create',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => $targetCollection,
            'target_id' => $targetId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    public static function logUpdate($userId, $userRole, $targetCollection, $targetId, $details = [])
    {
        return self::create([
            'action' => 'update',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => $targetCollection,
            'target_id' => $targetId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    public static function logDelete($userId, $userRole, $targetCollection, $targetId, $details = [])
    {
        return self::create([
            'action' => 'delete',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => $targetCollection,
            'target_id' => $targetId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    public static function logView($userId, $userRole, $targetCollection, $targetId, $details = [])
    {
        return self::create([
            'action' => 'view',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => $targetCollection,
            'target_id' => $targetId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    public static function logLogin($userId, $userRole, $details = [])
    {
        return self::create([
            'action' => 'login',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => 'users',
            'target_id' => $userId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    public static function logLogout($userId, $userRole, $details = [])
    {
        return self::create([
            'action' => 'logout',
            'performed_by' => $userId,
            'user_role' => $userRole,
            'target_collection' => 'users',
            'target_id' => $userId,
            'details' => $details,
            'timestamp' => now(),
        ]);
    }

    // Reporting methods
    public static function getActivitySummary($startDate = null, $endDate = null)
    {
        $query = self::query();
        
        if ($startDate && $endDate) {
            $query = $query->whereBetween('timestamp', [$startDate, $endDate]);
        }
        
        return $query->selectRaw('action, COUNT(*) as count')
                     ->groupBy('action')
                     ->orderBy('count', 'desc')
                     ->get();
    }

    public static function getUserActivity($userId, $days = 30)
    {
        return self::byUser($userId)
                   ->where('timestamp', '>=', now()->subDays($days))
                   ->orderBy('timestamp', 'desc')
                   ->get();
    }

    public static function getSystemActivity($limit = 100)
    {
        return self::with('performedBy')
                   ->orderBy('timestamp', 'desc')
                   ->limit($limit)
                   ->get();
    }

    public static function cleanOldLogs($days = 90)
    {
        return self::where('timestamp', '<', now()->subDays($days))->delete();
    }

    // Audit summary
    public function getAuditSummary()
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'action_color' => $this->action_color,
            'action_icon' => $this->action_icon,
            'user_name' => $this->user_name,
            'user_role' => $this->user_role,
            'role_color' => $this->role_color,
            'target' => $this->target_display,
            'timestamp' => $this->formatted_timestamp,
            'time_ago' => $this->time_ago,
            'has_details' => $this->hasDetails(),
            'details' => $this->details,
        ];
    }
}