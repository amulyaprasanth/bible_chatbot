import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import bgSigninLandscape from "../assets/bg_signin_landscape.jpg";
import bgSigninPortrait from "../assets/bg_signin_portrait.jpg";

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Login = () => {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsSignup(!isSignup);
  };

  const handleLogin = () => {
    console.log("Signin button clicked");
  };

  const handleSignup = () => {
    console.log("Signup button clicked");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log(codeResponse);
      navigate("/dashboard");
    },

    onError: (error) => console.log("Login Failed:", error),
    flow: "auth-code",
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
      <div className="relative flex items-center justify-center h-screen p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-10 w-full max-w-md backdrop-blur-lg transition-all duration-700 ease-in-out transform hover:scale-[1.02]"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center tracking-wide">
            {isSignup ? "Create Your Account" : "Welcome Back"}
          </h2>
          <form
            onSubmit={isSignup ? handleSignup : handleLogin}
            className="flex flex-col gap-4"
          >
            {isSignup && (
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
                  value={formData.fullName}
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

            {isSignup && (
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
              {isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleForm}
              className="text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold hover:underline bg-transparent border-0 p-0 inline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
            <button
              onClick={() => login()}
              className="mt-3 flex items-center justify-center w-full gap-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <FcGoogle className="text-xl" />
              Continue with Google
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
