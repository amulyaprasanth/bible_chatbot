import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRoutesProps {
  isAuthenticated: boolean;
}

export const ProtectedRoutes = ({ isAuthenticated }: ProtectedRoutesProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
