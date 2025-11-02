import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import bgSigninLandscape from "../assets/bg_signin_landscape.jpg";
import bgSigninPortrait from "../assets/bg_signin_portrait.jpg";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setLoading(true);
      void (async () => {
        try {
          const res = await api.post("/auth/google", codeResponse, {
            withCredentials: true,
          });

          if (res.status === 200) {
            // ✅ Update AuthContext directly
            setUser(res.data.user);
            setIsAuthenticated(true);

            // Navigate after context update
            navigate("/dashboard", { replace: true });
          }
        } catch (err) {
          console.error("Login error:", err);
        } finally {
          setLoading(false);
        }
      })();
    },
    flow: "auth-code",
    onError: (error) => console.log("Login Failed:", error),
  });

  return (
    <div className="w-screen min-h-screen overflow-auto relative">
      {/* Background Images */}
      <img
        src={bgSigninLandscape}
        alt="AI and Bible"
        className="hidden md:block fixed inset-0 w-full h-full object-cover"
      />
      <img
        src={bgSigninPortrait}
        alt="AI and Bible"
        className="block md:hidden fixed inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      )}

      <div className="relative flex items-center justify-center h-screen p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-md backdrop-blur-lg transition-all duration-700 ease-in-out transform hover:scale-[1.02]"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 text-center tracking-wide">
            Welcome
          </h2>

          {/* AI Disclaimer */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200 text-center">
              ⚠️ <strong>Disclaimer:</strong> AI-generated responses may be
              incorrect. Please verify information independently.
            </p>
          </div>

          <button
            onClick={() => login()}
            disabled={loading}
            className="mt-3 flex items-center justify-center w-full gap-2 md:gap-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 md:py-3 font-medium text-sm md:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <FcGoogle className="text-lg md:text-xl" />
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
