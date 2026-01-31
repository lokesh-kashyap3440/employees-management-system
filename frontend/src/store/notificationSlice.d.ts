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
}
export declare const addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<Notification, "id" | "isRead">, "notification/addNotification">, markAllAsRead: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/markAllAsRead">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/clearNotifications">;
declare const _default: import("redux").Reducer<NotificationState>;
export default _default;
