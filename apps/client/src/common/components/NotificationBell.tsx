import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { createLogger } from '../../lib/logger';
import toast from 'react-hot-toast';

const logger = createLogger('NotificationBell');

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const typeConfig = {
  info: { icon: Info, className: 'text-blue-500 bg-blue-500/10' },
  success: { icon: CheckCircle, className: 'text-emerald-500 bg-emerald-500/10' },
  warning: { icon: AlertTriangle, className: 'text-amber-500 bg-amber-500/10' },
  error: { icon: XCircle, className: 'text-red-500 bg-red-500/10' },
};

interface NotificationBellProps {
  transparent?: boolean;
}

export default function NotificationBell({ transparent = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      logger.warn('Failed to fetch unread count');
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: NotificationItem) => !n.isRead).length);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const token = localStorage.getItem('token');
    if (!token) return;
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:2500'}/dashboard/events?token=${token}`,
    );
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          fetchUnreadCount();
          if (open) fetchNotifications();
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => eventSource.close();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  const getNotificationPath = (notif: NotificationItem): string => {
    const title = notif.title.toLowerCase();
    const message = notif.message.toLowerCase();

    if (title.includes('pipeline') || message.includes('pipeline')) {
      return '/dashboard/data/pipeline';
    }
    if (title.includes('pdf') || message.includes('pdf')) {
      return '/dashboard/pdf/merge';
    }
    if (title.includes('new user') || message.includes('user')) {
      return '/dashboard/users';
    }
    return '/dashboard';
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        toast.error('Failed to mark as read');
      }
    }
    setOpen(false);
    navigate(getNotificationPath(notif));
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={`btn btn-ghost btn-circle relative ${
          transparent ? 'text-white hover:text-[#D4AF37]' : 'text-base-content'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute top-0.5 right-0.5 bg-error text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-0.5 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 border border-base-300/60 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-200">
              <h3 className="font-bold flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="badge badge-error badge-sm">{unreadCount} new</span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="btn btn-ghost btn-xs gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-base-content/40 py-10">
                  <Bell className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-4 border-b border-base-100 hover:bg-base-200/50 transition-colors cursor-pointer ${
                        !notif.isRead
                          ? 'bg-base-200/30 border-l-2 border-l-primary'
                          : 'border-l-2 border-l-transparent'
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${config.className}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${notif.isRead ? 'text-base-content/70' : 'font-semibold'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-base-content/40 shrink-0">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead ? (
                        <button
                          onClick={(e) => handleMarkRead(e, notif.id)}
                          className="btn btn-ghost btn-xs btn-circle shrink-0"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="w-6 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}