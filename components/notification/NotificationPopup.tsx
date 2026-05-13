import React from "react";
import api from "@/lib/api";

interface Props {
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationPopup: React.FC<Props> = ({
  notifications,
  setNotifications,
  setUnreadCount,
}) => {
  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return; // Don't mark read again

    try {
      await api.post("/notifications/read", { notificationId: id });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  return (
    <div className="w-full max-h-[400px] overflow-y-auto">
      <div className="w-full border-b flex items-center justify-center py-2">
        <h1 className="text-lg font-medium">Your Notifications</h1>
      </div>

      {notifications.length === 0 && (
        <p className="text-center text-sm py-4 text-gray-500">
          No notifications
        </p>
      )}

      {notifications.map((n) => (
        <div
          key={n._id}
          onClick={() => markAsRead(n._id, n.isRead)}
          className={`flex items-start gap-4 px-5 py-4 cursor-pointer border-b 
            hover:bg-gray-100 transition 
            ${!n.isRead ? "bg-[#e8f7ff]" : "bg-white"}`}
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full" />

          <div className="flex flex-col gap-1 w-full">
            <h1 className="text-sm font-medium">{n.title}</h1>
            <p className="text-xs text-gray-700">{n.description}</p>

            {n.signedImageUrl && (
              <img
                src={n.signedImageUrl}
                className="w-full rounded-md mt-1"
                alt="notification"
              />
            )}

            <p className="text-[10px] text-gray-500">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
