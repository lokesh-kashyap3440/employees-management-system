export interface AuthState {
    user: string | null;
    role: string | null;
    token: string | null;
    isAuthenticated: boolean;
}
export declare const setCredentials: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    user: string;
    token: string;
    role: string;
}, "auth/setCredentials">, logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/logout">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
