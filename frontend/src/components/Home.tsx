import { motion } from "framer-motion";
import bgHomeLandscape from "../assets/bg_home_landscape.jpg";
import bgHomePortrait from "../assets/bg_home_portrait.jpg";

export const Home = () => {
  return (
    <div className="relative w-full min-h-screen overflow-auto">
      {/* Desktop / large screens */}
      <img
        src={bgHomeLandscape}
        alt="AI and Bible"
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
      />

      {/* Mobile / small screens */}
      <img
        src={bgHomePortrait}
        alt="AI and Bible"
        className="block md:hidden absolute inset-0 w-full h-full object-cover"
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-center px-6 py-12">
        {/* Title with block effect + animation */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-[0.2em] mb-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] montserrat-large uppercase"
        >
          VERSE<span className="text-blue-400">CHAT</span>
        </motion.h1>

        {/* Tagline with fade-in delay */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          className="text-lg md:text-2xl max-w-2xl leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide roboto-normal mb-12"
        >
          Your{" "}
          <span className="text-blue-300 font-semibold">
            intelligent companion
          </span>{" "}
          for exploring the Bible.
        </motion.p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full mt-8">
          {/* Card 1 - AI-Powered Insights */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl hover:bg-white/20 hover:scale-105 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">
              AI-Powered Insights
            </h3>
            <p className="text-gray-200 leading-relaxed">
              Get intelligent answers to your biblical questions using advanced
              AI technology. Explore scriptures with deep understanding and
              contextual wisdom.
            </p>
          </motion.div>

          {/* Card 2 - Multilingual Support */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl hover:bg-white/20 hover:scale-105 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">
              Multilingual Support
            </h3>
            <p className="text-gray-200 leading-relaxed">
              Access the Bible in English and Telugu. Break language barriers
              and connect with scripture in your preferred language with
              seamless translations.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
