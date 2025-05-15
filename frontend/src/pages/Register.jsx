import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import API from "@/lib/axios";

const Register = () => {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        confirm_password: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm_password) {
            return setError("Passwords do not match.");
        }
        try {
            await API.post("/api/register/", form);
            navigate("/");
        } catch (err) {
            console.log(err.response?.data);
            setError(err.response?.data?.username || err.response?.data?.password ||err.response?.data?.email || "Registration failed.");
        }
    };

    // Reuse background setup
    const numCandles = 12;
    const svgWidth = 800;
    const svgHeight = 600;
    const spacing = svgWidth / (numCandles + 1);
    const candleWidth = 20;

    const candlesticks = Array.from({ length: numCandles }, (_, i) => {
        const x = spacing * (i + 1);
        const open = 250 + Math.random() * 100;
        const close = 250 + Math.random() * 100;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        return { x, open, close, high, low };
    });

    return (
        <div className="relative flex justify-center items-center min-h-screen overflow-hidden">
            {/* Background SVG */}
            <div className="absolute inset-0 -z-10">
                <svg
                    className="w-full h-full"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0f2027" />
                            <stop offset="50%" stopColor="#203a43" />
                            <stop offset="100%" stopColor="#2c5364" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <rect width={svgWidth} height={svgHeight} fill="url(#bgGrad)" />
                    {Array.from({ length: 100 }).map((_, i) => (
                        <circle
                            key={i}
                            cx={Math.random() * svgWidth}
                            cy={Math.random() * svgHeight}
                            r={Math.random() * 1.5}
                            fill="white"
                            opacity={Math.random()}
                        />
                    ))}
                    {candlesticks.map(({ x, open, close, high, low }, i) => {
                        const isUp = close >= open;
                        const bodyColor = isUp ? "#00ff99" : "#ff4d4f";
                        const rectY = isUp ? open : close;
                        const rectHeight = Math.abs(close - open);
                        return (
                            <g key={i} filter="url(#glow)">
                                <line x1={x} y1={low} x2={x} y2={high} stroke={bodyColor} strokeWidth="2" />
                                <rect
                                    x={x - candleWidth / 2}
                                    y={rectY}
                                    width={candleWidth}
                                    height={rectHeight || 2}
                                    fill={bodyColor}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Register Form Card */}
            <Card className="w-[90%] max-w-sm bg-white/90 backdrop-blur-md shadow-xl">
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {[
                            { label: "First Name", name: "first_name", type: "text" },
                            { label: "Last Name", name: "last_name", type: "text" },
                            { label: "Username", name: "username", type: "text" },
                            { label: "Email", name: "email", type: "email" },
                            { label: "Password", name: "password", type: "password" },
                            { label: "Confirm Password", name: "confirm_password", type: "password" },
                        ].map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>{field.label}</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.label}
                                    required
                                />
                            </div>
                        ))}
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full" type="submit">
                            Register
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center justify-center text-sm">
                    Already have an account?&nbsp;
                    <Link to="/" className="text-blue-500">
                        Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
