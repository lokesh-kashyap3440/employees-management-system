export interface Notification {
    id: string;
    type: string;
    message: string;
    data: any;
    timestamp: string;
    isRead: boolean;
}
export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
}
export declare const fetchNotifications: import("@reduxjs/toolkit").AsyncThunk<any[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearPersistentNotifications: import("@reduxjs/toolkit").AsyncThunk<void, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<Notification, "id" | "isRead">, "notification/addNotification">, markAllAsRead: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/markAllAsRead">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/clearNotifications">;
declare const _default: import("redux").Reducer<NotificationState>;
export default _default;
