import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import { Home } from "./components/Home";
import Login from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { PublicRoute } from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthProvider";
import { MessageProvider } from "./context/MessageProvider";

function App() {
  return (
    <Router>
      <AuthProvider>
        <MessageProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <Routes>
            {/* ✅ Public routes */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* ✅ Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* ✅ Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GoogleOAuthProvider>
        </MessageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
