import api from "./api";

/**
 * Get paginated list of notifications for the logged-in user.
 */
export const getNotifications = async (page = 1, limit = 10, module = "") => {
  const modQuery = module && module !== "all" ? `&module=${encodeURIComponent(module)}` : "";
  const res = await api.get(`/notifications?page=${page}&limit=${limit}${modQuery}`);
  return res.data;
};

/**
 * Get the unread notifications count for the logged-in user.
 */
export const getUnreadCount = async (module = "") => {
  const modQuery = module && module !== "all" ? `?module=${encodeURIComponent(module)}` : "";
  const res = await api.get(`/notifications/unread-count${modQuery}`);
  return res.data;
};

/**
 * Mark a specific notification as read.
 */
export const markNotificationRead = async (id) => {
  const res = await api.post(`/notifications/${id}/read`);
  return res.data;
};

/**
 * Mark all notifications as read for the logged-in user.
 */
export const markAllNotificationsRead = async () => {
  const res = await api.post("/notifications/read-all");
  return res.data;
};

/**
 * Get user's notification preferences.
 */
export const getNotificationSettings = async () => {
  const res = await api.get("/notifications/settings");
  return res.data;
};

/**
 * Update user's notification preferences.
 */
export const updateNotificationSettings = async (settings) => {
  const res = await api.post("/notifications/settings", settings);
  return res.data;
};
