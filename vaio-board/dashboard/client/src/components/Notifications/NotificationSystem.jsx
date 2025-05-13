import { createContext, useContext, useState, useEffect } from 'react';

// Create context for confirmation dialogs and notifications
export const NotificationContext = createContext({
  confirm: () => Promise.resolve(false),
  notify: () => {},
  notifications: []
});

// Hook to use notifications and confirmation dialogs
export const useNotifications = () => useContext(NotificationContext);

// Provider component for confirmation dialogs
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Show confirmation dialog
  const confirm = (message, type = 'warning') => {
    return new Promise((resolve) => {
      const id = Date.now();
      const handleConfirm = () => {
        hide(id);
        resolve(true);
      };
      const handleCancel = () => {
        hide(id);
        resolve(false);
      };

      const confirmMessage = {
        id,
        message,
        type,
        createdAt: new Date(),
        isConfirm: true,
        onConfirm: handleConfirm,
        onCancel: handleCancel
      };

      setNotifications(prev => [confirmMessage, ...prev]);
    });
  };

  // Hide notification
  const hide = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Simple notification function
  const notify = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      createdAt: new Date(),
      isConfirm: false
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        hide(id);
      }, duration);
    }
    
    return id;
  };

  // Register globally for use in non-React code
  useEffect(() => {
    window.__VAIO_NOTIFICATION_SYSTEM__ = { confirm, notify };
    return () => {
      delete window.__VAIO_NOTIFICATION_SYSTEM__;
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ confirm, notify, notifications }}>
      {children}
      {notifications.length > 0 && (
        notifications[0].isConfirm ? (
          <ConfirmDialog 
            notification={notifications[0]} 
            onClose={() => setNotifications([])}
          />
        ) : (
          <NotificationToast 
            notification={notifications[0]}
            onClose={() => hide(notifications[0].id)}
          />
        )
      )}
    </NotificationContext.Provider>
  );
};

// Display component for confirmation dialog
function ConfirmDialog({ notification, onClose }) {

  return (
    <>
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      
      {/* Confirmation dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="mx-4">
          <div className="glass-notification backdrop-blur-sm p-4 rounded-lg border border-green-500/20">
            <div className="text-white mb-4">{notification.message}</div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  notification.onCancel?.();
                  onClose();
                }}
                className="px-4 py-2 rounded backdrop-blur-sm bg-black/20 hover:bg-black/40 text-red-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notification.onConfirm?.();
                  onClose();
                }}
                className="px-4 py-2 rounded backdrop-blur-sm bg-green-900/30 hover:bg-green-900/50 text-green-300 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Display component for regular notifications
function NotificationToast({ notification, onClose }) {
  // Different styling based on notification type
  const getTypeStyles = () => {
    switch(notification.type) {
      case 'success':
        return 'border-green-500/30 bg-green-900/20 text-green-300';
      case 'error':
        return 'border-red-500/30 bg-red-900/20 text-red-300';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-900/20 text-yellow-300';
      default: // info and others
        return 'border-blue-500/30 bg-blue-900/20 text-blue-300';
    }
  };

  return (
    <>
      {/* Notification toast */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
        <div className="mx-4 animate-fade-in">
          <div className={`glass-notification backdrop-blur-sm p-3 rounded-lg border ${getTypeStyles()}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">{notification.message}</div>
              <button
                onClick={onClose}
                className="text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationProvider;
