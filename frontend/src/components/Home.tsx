import { motion } from "framer-motion";
import bgHomeLandscape from "../assets/bg_home_landscape.jpg";
import bgHomePortrait from "../assets/bg_home_portrait.jpg";

export const Home = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-center px-6">
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
          className="text-lg md:text-2xl max-w-2xl leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide roboto-normal"
        >
          Your <span className="text-blue-300 font-semibold">intelligent companion</span> for exploring the Bible.
        </motion.p>
      </div>
    </div>
  );
};
