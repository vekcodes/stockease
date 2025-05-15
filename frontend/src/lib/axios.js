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
export default API;