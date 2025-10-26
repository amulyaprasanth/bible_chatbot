import { motion } from "framer-motion";
import bgHomeLandscape from "../assets/bg_home_landscape.jpg";
import bgHomePortrait from "../assets/bg_home_portrait.jpg";

export const Home = () => {
  const handleTryItOut = () => {
    // You can navigate to the chat page or open a modal here
    console.log("Try it out clicked!");
    // Example: navigate to chat page
    // window.location.href = "/chat";
  };

  return (
    <div className="w-screen min-h-screen overflow-auto relative">
      {/* Background Images */}
      <img
        src={bgHomeLandscape}
        alt="AI and Bible"
        className="hidden md:block fixed inset-0 w-full h-full object-cover"
      />
      <img
        src={bgHomePortrait}
        alt="AI and Bible"
        className="block md:hidden fixed inset-0 w-full h-full object-cover"
      />

      {/* Overlay & Content */}
      <div className="relative min-h-screen bg-black/50 flex flex-col items-center justify-center text-white text-center px-4 sm:px-6 py-8 sm:py-12 z-10 w-full">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-wide sm:tracking-wider mb-4 sm:mb-6 drop-shadow-lg uppercase mt-8"
        >
          VERSE<span className="text-blue-400">CHAT</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          className="text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed mb-6 sm:mb-8"
        >
          Your{" "}
          <span className="text-blue-300 font-semibold">
            intelligent companion
          </span>{" "}
          for exploring the Bible.
        </motion.p>

        {/* Try It Out Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
          onClick={handleTryItOut}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-full text-lg sm:text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 mb-8 sm:mb-12 border-2 border-white/20"
        >
          Try It Out
        </motion.button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
          {/* Card 1 - AI-Powered Insights */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mb-4 mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              AI-Powered Insights
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Get intelligent answers to your biblical questions using advanced
              AI technology. Explore scriptures with deep understanding and
              contextual wisdom.
            </p>
          </motion.div>

          {/* Card 2 - Bible Search */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4 mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Bible Search</h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Search through the entire Bible semantically or find specific
              verses by reference. Get accurate biblical answers with proper
              context.
            </p>
          </motion.div>

          {/* Card 3 - Factual Context */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 mx-auto">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Factual Context
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Access Wikipedia and web search for additional context and factual
              information that complements biblical teachings.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
