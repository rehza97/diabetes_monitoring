import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  read?: boolean;
  timestamp?: string;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Charger les notifications persistantes depuis localStorage
const loadPersistentNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem("dashboard_notifications");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return [];
};

// Sauvegarder les notifications persistantes
const savePersistentNotifications = (notifications: Notification[]) => {
  try {
    localStorage.setItem("dashboard_notifications", JSON.stringify(notifications));
  } catch {
    // Ignore errors
  }
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadPersistentNotifications()
  );

  // Sauvegarder les notifications à chaque changement
  useEffect(() => {
    savePersistentNotifications(notifications);
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      read: false,
      timestamp: new Date().toISOString(),
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Pour les notifications toast (avec duration), les supprimer après le délai
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
