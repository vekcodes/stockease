import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    
    // User management state
    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirm_password: ""
    });
    
    // Stock seeder state
    const [stockTitle, setStockTitle] = useState("");
    const [csvFile, setCsvFile] = useState(null);
    const [seedingStatus, setSeedingStatus] = useState("");

    useEffect(() => {
        // Check if user is admin
        const isAdmin = localStorage.getItem("is_admin");
        if (!isAdmin || isAdmin === "false") {
            navigate("/");
            return;
        }
        
        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const response = await API.get("/api/admin/users/");
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users:", error);
            if (error.response?.status === 401) {
                navigate("/");
            }
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (newUser.password !== newUser.confirm_password) {
            alert("Passwords do not match");
            return;
        }

        try {
            const response = await API.post("/api/admin/users/create/", newUser);
            setUsers([...users, response.data]);
            setNewUser({
                username: "",
                email: "",
                first_name: "",
                last_name: "",
                password: "",
                confirm_password: ""
            });
            alert("User created successfully");
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Error creating user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        try {
            await API.delete(`/api/admin/users/${userId}/`);
            setUsers(users.filter(user => user.id !== userId));
            alert("User deleted successfully");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user");
        }
    };

    const handleSeedStocks = async (e) => {
        e.preventDefault();
        if (!stockTitle || !csvFile) {
            alert("Please provide both stock title and CSV file");
            return;
        }

        const formData = new FormData();
        formData.append("stock_title", stockTitle);
        formData.append("csv_file", csvFile);

        setSeedingStatus("Seeding stocks...");
        try {
            const response = await API.post("/api/admin/seed-stocks/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setSeedingStatus(`Success: ${response.data.message}`);
            setStockTitle("");
            setCsvFile(null);
        } catch (error) {
            console.error("Error seeding stocks:", error);
            setSeedingStatus(`Error: ${error.response?.data?.error || "Unknown error"}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("is_admin");
        navigate("/");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <Button onClick={handleLogout} variant="outline">
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex space-x-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "dashboard"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "users"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab("stocks")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "stocks"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Stock Seeder
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {activeTab === "dashboard" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-600">
                                    {users.filter(user => user.is_active).length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>System Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-600">Online</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New User</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                value={newUser.username}
                                                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                                id="first_name"
                                                value={newUser.first_name}
                                                onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                value={newUser.last_name}
                                                onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="confirm_password">Confirm Password</Label>
                                            <Input
                                                id="confirm_password"
                                                type="password"
                                                value={newUser.confirm_password}
                                                onChange={(e) => setNewUser({...newUser, confirm_password: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit">Create User</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>User List</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.username}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(user.date_joined).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            user.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {user.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            variant="destructive"
                                                            size="sm"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "stocks" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Seeder</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSeedStocks} className="space-y-4">
                                <div>
                                    <Label htmlFor="stock_title">Stock Title</Label>
                                    <Input
                                        id="stock_title"
                                        value={stockTitle}
                                        onChange={(e) => setStockTitle(e.target.value)}
                                        placeholder="Enter stock symbol (e.g., NABIL, NTC)"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="csv_file">CSV File</Label>
                                    <Input
                                        id="csv_file"
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setCsvFile(e.target.files[0])}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Upload a CSV file with columns: Date, Open, High, Low, Close, Volume
                                    </p>
                                </div>
                                <Button type="submit">Seed Stocks</Button>
                                {seedingStatus && (
                                    <div className={`p-3 rounded ${
                                        seedingStatus.startsWith("Success") 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-red-100 text-red-700"
                                    }`}>
                                        {seedingStatus}
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard; 