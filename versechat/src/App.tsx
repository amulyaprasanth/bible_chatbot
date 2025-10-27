import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import { Home } from "./components/Home";
import Login, { type UserDetails } from "./components/Login";
import { ProtectedRoutes } from "./components/PrivateRoutes";
import api from "./api/axios";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);

  // 🔹 Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/check", { withCredentials: true });
        if (res.data.authenticated) {
          setIsAuthenticated(true);
          const userRes = await api.get("/auth/user", {
            withCredentials: true,
          });
          setUser(userRes.data);
        }
      } catch (err) {
        console.log("User not authenticated:", err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // 🔹 Show loading state until auth check finishes
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
        Checking authentication...
      </div>
    );
  }

  return (
    <Router>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Routes>
          {/* ✅ Public routes */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUser={setUser}
              />
            }
          />

          {/* ✅ Protected routes */}
          <Route
            element={<ProtectedRoutes isAuthenticated={isAuthenticated} />}
          >
            <Route path="/dashboard" element={<Dashboard user={user} />} />
          </Route>

          {/* ✅ Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;
