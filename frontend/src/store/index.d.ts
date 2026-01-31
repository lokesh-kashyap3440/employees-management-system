export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    employee: import("./employeeSlice").EmployeeState;
    auth: import("./authSlice").AuthState;
    notification: import("./notificationSlice").NotificationState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        employee: import("./employeeSlice").EmployeeState;
        auth: import("./authSlice").AuthState;
        notification: import("./notificationSlice").NotificationState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
