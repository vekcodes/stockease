// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        console.log('Logged out');
        navigate('/');
    };
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Welcome to Dashboard</h1>
            <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
                Logout
            </button>
        </div>
    );
}

export default Dashboard;
