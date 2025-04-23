import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [form, setForm] = useState({
        first_name: "", last_name: "", username: "", email: "", password: "", confirm_password: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm_password) {
            return setError("Passwords do not match.");
        }
        try {
            await axios.post("http://localhost:8000/api/register/", form);
            
            navigate("/");
        } catch (err) {
            console.log(err.response.data);
            setError(err.response?.data?.username || "Registration failed.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form className="bg-white p-8 rounded-lg shadow-lg w-96 space-y-4" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold">Register</h2>
                {["first_name", "last_name", "username", "email", "password", "confirm_password"].map((field) => (
                    <input
                        key={field}
                        name={field}
                        type={field.includes("password") ? "password" : "text"}
                        placeholder={field.replace("_", " ")}
                        value={form[field]}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                ))}
                {error && <p className="text-red-500">{error}</p>}
                <button className="w-full bg-blue-500 text-white py-2 rounded">Register</button>
            </form>
        </div>
    );
};

export default Register;
