import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import { Home } from "./components/Home";
import Login from "./components/Login";
import OAuthCallback from "./components/OAuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { PublicRoute } from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthProvider";
import { MessageProvider } from "./context/MessageProvider";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <MessageProvider>
              <Routes>
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
                {/* Google OAuth redirect callback */}
                <Route path="/auth/callback" element={<OAuthCallback />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MessageProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
