import { type JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    // If no token, redirect to signin
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
