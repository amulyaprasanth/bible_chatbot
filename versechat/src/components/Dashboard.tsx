import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ChatContainer from "./chatContainer";
import Conversations from "./Conversations";

export interface Conversation {
  id: number;
  title?: string;
  user_id: string;
}
const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const user = authContext.user;
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Track window size to determine if we're on desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      // Auto-open sidebar on desktop
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      localStorage.removeItem("isAuthenticated");
      globalThis.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Show loading state if user data is not available yet
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen w-full flex items-center justify-center bg-[#F1F5F9] dark:bg-[#0F172A]"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Loading user data...
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full flex flex-col bg-[#F1F5F9] dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 overflow-hidden"
    >
      {/* ===== Top Banner ===== */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-screen flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-[#1E293B] text-white shadow-md z-10"
      >
        {/* Hamburger Menu Button (Mobile only) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden text-white focus:outline-none p-2"
        >
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </motion.button>

        {/* Title */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="text-xl md:text-3xl font-bold font-poppins tracking-wide"
        >
          Verse<span className="text-blue-400">Chat</span>
        </motion.h1>

        {/* Profile Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-3 focus:outline-none"
          >
            {user?.profile_picture && !imageError ? (
              <motion.img
                key={user.profile_picture}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                src={user.profile_picture}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <FaUserCircle size={36} className="text-white" />
              </motion.div>
            )}
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-52 md:w-56 bg-white dark:bg-[#1E293B] rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
              >
                {/* Profile Info */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
                >
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
                </motion.div>

                {/* Sign out Button */}
                <motion.button
                  whileHover={{ backgroundColor: "#F3F4F6" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="block w-full text-left px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] transition"
                >
                  Sign out
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ===== Main Content ===== */}
      <div className="flex flex-1 flex-row overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: isDesktop || sidebarOpen ? 0 : "-100%",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto
            w-64 md:w-1/5 bg-[#F8FAFC] dark:bg-[#111827] 
            border-r border-gray-200 dark:border-gray-700
            md:translate-x-0
          `}
        >
          <Conversations
            convList={convList}
            setConvList={setConvList}
            onConversationSelect={() => setSidebarOpen(false)}
          />
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0F172A] w-full"
        >
          <ChatContainer user={user} setConvList={setConvList} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
