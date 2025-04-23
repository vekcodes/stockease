import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:8000/api/login/", credentials);
            localStorage.setItem("access_token", res.data.access);
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid credentials.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form className="bg-white p-8 rounded-lg shadow-lg w-96 space-y-4" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold">Login</h2>
                <input
                    name="username"
                    type="text"
                    placeholder="Username"
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
                <button className="w-full bg-blue-500 text-white py-2 rounded">Login</button>
            </form>
        </div>
    );
};

export default Login;
