import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // ✅ correct import

const isTokenValid = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    try {
        const decoded = jwtDecode(token); // ✅ correct usage
        const isExpired = decoded.exp * 1000 < Date.now();
        return !isExpired;
    } catch (err) {
        console.error("Invalid token:", err);
        return false;
    }
};

const ProtectedRoute = ({ children }) => {
    return isTokenValid() ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
