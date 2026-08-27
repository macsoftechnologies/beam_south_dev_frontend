import axios from "axios";
import { sendUserLog } from "./userLogService";
import { navigateTo, isOnPath } from "../config/basePath";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
export const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── REQUEST INTERCEPTOR — attach auth token & normalize subpaths ───────────
api.interceptors.request.use(
    (config) => {
        // Strip leading slash from relative URLs so Axios preserves baseURL subpath (/development/m3south)
        if (config.url && config.url.startsWith("/") && !config.url.startsWith("//")) {
            config.url = config.url.slice(1);
        }
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR — auto-log mutating API calls ─────────────────────
// Logs every POST / PUT / PATCH / DELETE call to POST /employee/log.
// GET requests and the log endpoint itself are excluded to avoid noise and
// infinite loops. Logging is fire-and-forget and never blocks the response.
api.interceptors.response.use(
    (response) => {
        const method = (response.config.method || "").toUpperCase();
        const url = response.config.url || "";

        // Only log mutating methods, skip the logging endpoint itself
        const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
        const isLogEndpoint = /\/employee\/log$/i.test(url);

        if (isMutating && !isLogEndpoint) {
            sendUserLog(response.config, response);
        }

        return response;
    },
    (error) => {
        const url = error?.config?.url || "";
        const isAuthEndpoint = /\/auth\/(verify-otp|login|forgot-password|reset-password|change-password)/i.test(url);
        const isAuthPage = isOnPath("/login") || isOnPath("/otp") || isOnPath("/forgot-password");

        // Handle 401 Unauthorized globally by logging out and redirecting (except for auth/OTP operations)
        if (error?.response?.status === 401 && !isAuthEndpoint && !isAuthPage) {
            localStorage.removeItem("user");
            localStorage.removeItem("UserType");
            localStorage.removeItem("token");
            localStorage.removeItem("tempUser");
            localStorage.removeItem("secretkey");
            navigateTo("/login", true);
        }

        // Also log failed mutating calls so failures are auditable
        try {
            const config = error?.config || {};
            const method = (config.method || "").toUpperCase();
            const url = config.url || "";
            const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
            const isLogEndpoint = /\/employee\/log$/i.test(url);

            if (isMutating && !isLogEndpoint) {
                sendUserLog(config, error?.response);
            }
        } catch {
            // Never let this secondary logging break the error path
        }

        return Promise.reject(error);
    }
);

export default api;
