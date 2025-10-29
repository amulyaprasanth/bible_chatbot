import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";

interface User {
  name: string;
  profile_picture: string;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const saved = localStorage.getItem("isAuthenticated");
    return saved ? JSON.parse(saved) : null;
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated !== null) {
      localStorage.setItem("isAuthenticated", JSON.stringify(isAuthenticated));
    }
  }, [isAuthenticated]);  

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/check", { withCredentials: true });
        if (res.data.authenticated) {
          const userRes = await api.get("/auth/user", {
            withCredentials: true,
          });
          setUser(userRes.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, user, setIsAuthenticated, setUser }),
    [isAuthenticated, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated === null ? (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
          Checking authentication...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
