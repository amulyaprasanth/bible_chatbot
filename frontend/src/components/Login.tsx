import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/axios";
import { API_ENDPOINTS } from "../api/config";
import bgSigninLandscape from "../assets/bg_signin_landscape.jpg";
import bgSigninPortrait from "../assets/bg_signin_portrait.jpg";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthFormProps {
  setUser: React.Dispatch<
    React.SetStateAction<{ id: number; name: string } | null>
  >;
}

const AuthForm = ({ setUser }: AuthFormProps) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Helper: store token & user
  const storeUserToken = (
    user: { id: number; name: string; email: string },
    token: string
  ) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser({ id: user.id, name: user.name });
  };

  // --- Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Form URL-encoded for OAuth2
      const data = new URLSearchParams();
      data.append("username", formData.email);
      data.append("password", formData.password);

      // 1️⃣ Get JWT token
      const tokenRes = await apiClient.post(API_ENDPOINTS.TOKEN, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = tokenRes.data.access_token;
      if (!token) {
        setError("Login failed. No token received.");
        return;
      }

      // 2️⃣ Fetch current user
      const userRes = await apiClient.get(API_ENDPOINTS.USERS_ME, {
        headers: { Authorization: `Bearer ${token}` },
      });

      storeUserToken(userRes.data, token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  // --- Signup ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Create user
      const signupRes = await apiClient.post(API_ENDPOINTS.SIGNUP, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (!signupRes.data.success) {
        setError(signupRes.data.message || "Signup failed");
        return;
      }

      // 2️⃣ Login immediately to get token
      const data = new URLSearchParams();
      data.append("username", formData.email);
      data.append("password", formData.password);

      const tokenRes = await apiClient.post(API_ENDPOINTS.TOKEN, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = tokenRes.data.access_token;
      if (!token) {
        setError("Signup successful, but failed to generate token.");
        return;
      }

      // 3️⃣ Fetch user info
      const userRes = await apiClient.get(API_ENDPOINTS.USERS_ME, {
        headers: { Authorization: `Bearer ${token}` },
      });

      storeUserToken(userRes.data, token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img
        src={bgSigninLandscape}
        alt="Signin background landscape"
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
      />
      <img
        src={bgSigninPortrait}
        alt="Signin background portrait"
        className="block md:hidden absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 flex items-center justify-center h-full p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-10 w-full max-w-md backdrop-blur-lg transition-all duration-700 ease-in-out transform hover:scale-[1.02]"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center tracking-wide">
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-center">
              {error}
            </div>
          )}

          <form
            onSubmit={isSignUp ? handleSignup : handleLogin}
            className="flex flex-col gap-4"
          >
            {isSignUp && (
              <div className="flex flex-col">
                <label
                  htmlFor="name"
                  className="text-gray-700 dark:text-gray-200 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                />
              </div>
            )}

            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="text-gray-700 dark:text-gray-200 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-200 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              />
            </div>

            {isSignUp && (
              <div className="flex flex-col">
                <label
                  htmlFor="confirmPassword"
                  className="text-gray-700 dark:text-gray-200 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="mt-4 bg-indigo-600 text-white font-semibold p-3 rounded-lg hover:bg-indigo-700 transition-all"
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleForm}
              className="text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold hover:underline bg-transparent border-none p-0"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthForm;
