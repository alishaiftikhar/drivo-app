import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

type QueueItem = {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (error?: any) => void;
};

const baseURL = "http://192.168.100.7:8000/api/";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
const failedQueue: QueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  failedQueue.length = 0;
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ✅ Add Access Token Automatically for Every Request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("access_token");
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle Token Expiration & Auto Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If 401 Unauthorized → Try Refreshing Token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait until refresh is done, then retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as any).Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        if (!refreshToken) throw new Error("No refresh token available");

        // ✅ Use api instance instead of raw axios
        const response = await api.post("token/refresh/", {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;

        // ✅ Save new access token securely
        await SecureStore.setItemAsync("access_token", newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");

        // Optional: Redirect to login screen
        console.log("Session expired, please log in again.");

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;