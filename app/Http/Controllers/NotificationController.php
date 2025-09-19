<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->input('type');
        $status = $request->input('status');

        $notifications = Notification::where('user_id', Auth::id())
            ->when($type, function ($query, $type) {
                return $query->where('type', $type);
            })
            ->when($status === 'read', function ($query) {
                return $query->read();
            })
            ->when($status === 'unread', function ($query) {
                return $query->unread();
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = Notification::getUnreadCountForUser(Auth::id());

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'filters' => $request->only(['type', 'status']),
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized access to notification.');
        }

        $notification->markAsRead();

        return back()->with('success', 'Notification marked as read.');
    }

    public function markAsUnread(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized access to notification.');
        }

        $notification->markAsUnread();

        return back()->with('success', 'Notification marked as unread.');
    }

    public function markAllAsRead()
    {
        Notification::markAllAsReadForUser(Auth::id());

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized access to notification.');
        }

        $notification->delete();

        return back()->with('success', 'Notification deleted.');
    }

    public function getUnreadCount()
    {
        $count = Notification::getUnreadCountForUser(Auth::id());
        
        return response()->json(['count' => $count]);
    }

    public function getRecent()
    {
        $notifications = Notification::getRecentNotificationsForUser(Auth::id(), 5);
        
        return response()->json(['notifications' => $notifications]);
    }
}