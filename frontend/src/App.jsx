import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./routes/Protected";
import Layout from "./components/Layout";
import Test from "./pages/Test";
import Logout from "./pages/Logout";
import TheGoldenCrossMomentum from "./pages/TheGoldenCrossMomentum";
import MACrossover from "./pages/MACrossover";
import StockScreener from "./pages/StockScreener";
import MyStocks from "./pages/MyStocks";
import BuySellNeutral from "./pages/BuySellNeutral";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />

        {/* Admin routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test" element={<Test />} />
          <Route path="/golden-cross-momentum" element={<TheGoldenCrossMomentum />} />
          <Route path="/ma-crossover" element={<MACrossover />} />
          <Route path="/stock-screener" element={<StockScreener />} />
          <Route path="my-stocks" element={<MyStocks />} />
          <Route path="/"></Route>
          <Route path="/alert" element={<BuySellNeutral/>}/>
        </Route>
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;