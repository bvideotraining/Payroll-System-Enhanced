'use client';

import { useState } from 'react';
import { useNotifications } from '@/src/frontend/hooks/use-notifications';
import { Bell, Check, Trash2, ExternalLink, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function NotificationDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp: number) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2.5 w-80 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-gray-900/5 focus:outline-none overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <p className="text-[10px] text-slate-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-500 font-medium">No notifications yet</p>
                  <p className="text-[10px] text-slate-400">We&apos;ll notify you when something happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 transition-colors hover:bg-slate-50 relative group ${!notification.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-amber-500' :
                          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[11px] font-semibold truncate ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[9px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="mt-2 flex items-center gap-3">
                            {!notification.read && (
                              <button 
                                onClick={() => markAsRead(notification.id)}
                                className="text-[9px] text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.link && (
                              <Link 
                                href={notification.link}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-[9px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                              >
                                View details
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            )}
                            <button 
                              onClick={() => deleteNotification(notification.id)}
                              className="text-[9px] text-red-600 hover:text-red-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center">
                <button 
                  className="text-[10px] text-slate-500 hover:text-slate-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
