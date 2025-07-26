import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import API from "@/lib/axios";

const Login = () => {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isAdmin ? "/api/admin/login/" : "/api/login/";
            const res = await API.post(endpoint, credentials);
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("is_admin", res.data.is_admin || false);
            
            if (isAdmin) {
                navigate("/admin-dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError("Invalid credentials.");
        }
    };

    // Generate candlestick data for the background SVG
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
            {/* Background SVG with Gradient, Stars and Candlestick Chart */}
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
                    {/* Background */}
                    <rect width={svgWidth} height={svgHeight} fill="url(#bgGrad)" />

                    {/* Stars */}
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

                    {/* Candlestick Chart */}
                    {candlesticks.map(({ x, open, close, high, low }, i) => {
                        // Determine the color: green if upward, red if downward.
                        const isUp = close >= open;
                        const bodyColor = isUp ? "#00ff99" : "#ff4d4f";
                        // Calculate top and height for rectangle.
                        const rectY = isUp ? open : close;
                        const rectHeight = Math.abs(close - open);
                        return (
                            <g key={i} filter="url(#glow)">
                                {/* Vertical wick */}
                                <line
                                    x1={x}
                                    y1={low}
                                    x2={x}
                                    y2={high}
                                    stroke={bodyColor}
                                    strokeWidth="2"
                                />
                                {/* Body */}
                                <rect
                                    x={x - candleWidth / 2}
                                    y={rectY}
                                    width={candleWidth}
                                    height={rectHeight || 2} // Ensure visible even if flat
                                    fill={bodyColor}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Login Form Card */}
            <Card className="w-[90%] max-w-sm bg-white/90 backdrop-blur-md shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{isAdmin ? "Admin Login" : "Login"}</span>
                        <button
                            onClick={() => setIsAdmin(!isAdmin)}
                            className="text-sm text-blue-500 hover:text-blue-700"
                        >
                            {isAdmin ? "User Login" : "Admin Login"}
                        </button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Enter your username"
                                value={credentials.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={handleChange}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full" type="submit">
                            {isAdmin ? "Admin Login" : "Login"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center justify-center text-sm">
                    {!isAdmin && (
                        <>
                            Don't Have an account?&nbsp;
                            <Link to={"/register"} className="text-blue-500">
                                Register
                            </Link>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
