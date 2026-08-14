import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';

const mockNotifications = [
  {
    id: 1,
    title: 'New Complaint Registered',
    message: 'Water pipeline leak reported near Station Road, Ward 1.',
    time: '10 mins ago',
    type: 'warning',
    unread: true
  },
  {
    id: 2,
    title: 'Project Milestone Achieved',
    message: 'Godavari Riverfront embankment piling foundations completed (72%).',
    time: '1 hour ago',
    type: 'success',
    unread: true
  },
  {
    id: 3,
    title: 'GIS Layer Updated',
    message: 'Drone LiDAR survey contours for Ward 3 loaded into GIS layer system.',
    time: '3 hours ago',
    type: 'info',
    unread: false
  }
];

const NotificationDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const markAllRead = () => {
    toast.success('All notifications marked as read');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Smart City Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-lg border transition-colors ${
                n.unread
                  ? 'bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start space-x-3">
                {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                {n.type === 'info' && <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">{n.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={markAllRead}
            className="w-full text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline py-1"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
