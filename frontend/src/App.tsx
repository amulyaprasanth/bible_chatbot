import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./components/Dashboard.tsx";
import { Home } from "./components/Home.tsx";
import AuthForm from "./components/Login.tsx";
import { Navbar } from "./components/Navbar.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // initialize from localStorage and check for token
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route
          path="/"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Home />
            )
          }
        />
        <Route
          path="/signin"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthForm setUser={setUser} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
