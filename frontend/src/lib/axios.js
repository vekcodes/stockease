import { API_URL, API_TIMEOUT } from "@/lib/config";
import axios from "axios";

const API = axios.create({
    baseURL: API_URL,
    withCredentials: true, // This is crucial for sending/receiving cookies
    timeout: API_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to add the auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default API;