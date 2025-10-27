import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import api from "../api/axios";
import ChatContainer from "./chatContainer";
import Conversations from "./Conversations";

interface DashboardProps {
  user: { name: string; profile_picture: string } | null;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profile_picture]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      // clear all cookies
      for (const c of document.cookie.split(";")) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      }
      globalThis.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Show loading state if user data is not available yet
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F1F5F9] dark:bg-[#0F172A]">
        <div className="text-gray-600 dark:text-gray-400">
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F1F5F9] dark:bg-[#0F172A] text-gray-900 dark:text-gray-100">
      {/* ===== Top Banner ===== */}
      <div className="w-full flex justify-between items-center px-6 py-4 bg-[#1E293B] text-white shadow-md">
        {/* Title */}
        <h1 className="text-3xl font-bold font-poppins tracking-wide">
          Verse<span className="text-blue-400">Chat</span>
        </h1>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-3 focus:outline-none"
          >
            {user?.profile_picture && !imageError ? (
              <img
                key={user.profile_picture}
                src={user.profile_picture}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            ) : (
              <FaUserCircle size={36} className="text-white" />
            )}
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1E293B] rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
              {/* Profile Info */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                {user?.profile_picture && !imageError ? (
                  <img
                    key={user.profile_picture}
                    src={user.profile_picture}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <FaUserCircle className="text-3xl text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Signed in
                  </p>
                </div>
              </div>

              {/* Sign out Button */}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex flex-1 flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/5 bg-[#F8FAFC] dark:bg-[#111827] border-r border-gray-200 dark:border-gray-700">
          <Conversations />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0F172A]">
          <ChatContainer />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
