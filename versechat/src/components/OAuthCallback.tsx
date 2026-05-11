import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/**
 * Handles the Google OAuth redirect callback.
 *
 * Google redirects back to /auth/callback?code=...&state=...
 * We extract the code, send it to the backend, set auth state, then
 * navigate to the dashboard.
 *
 * Using redirect mode (ux_mode: "redirect") instead of popup fixes
 * Safari's popup blocker and ITP cookie restrictions.
 */
const OAuthCallback = () => {
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const hasFired = useRef(false);

  useEffect(() => {
    // Prevent double-firing in React StrictMode
    if (hasFired.current) return;
    hasFired.current = true;

    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      console.error("OAuth callback error:", error ?? "no code returned");
      navigate("/login", { replace: true });
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${globalThis.location.origin}/auth/callback`;
        const res = await api.post(
          "/auth/google",
          { code, redirect_uri: redirectUri },
          { withCredentials: true },
        );

        if (res.status === 200) {
          setUser(res.data.user);
          setIsAuthenticated(true);
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("OAuth code exchange failed:", err);
        navigate("/login", { replace: true });
      }
    };

    void exchangeCode();
  }, [navigate, setIsAuthenticated, setUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
};

export default OAuthCallback;
