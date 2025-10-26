import { GoogleOAuthProvider } from "@react-oauth/google";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import { Home } from "./components/Home";
import Login from "./components/Login";
import { ProtectedRoutes } from "./components/PrivateRoutes";

function App() {
  const isAuthenticated = Boolean(localStorage.getItem("token")); //return true if token found
  return (
    <Router>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={<ProtectedRoutes isAuthenticated={isAuthenticated} />}
          >
            <Route path="/dashboard" element={<Dashboard />} />"
          </Route>
        </Routes>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;
