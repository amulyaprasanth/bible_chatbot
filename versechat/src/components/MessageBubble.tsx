import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa";
import { useTypingAnimation } from "../hooks/useTypingAnimation";
import type { Message } from "../context/MessageContext";

interface MessageBubbleProps {
  msg: Message & { tempId?: number };
  user: { profile_picture: string };
  isStreaming: boolean;
  streamingMessageId: number | null;
  onStreamingComplete: () => void;
  index: number;
}

const MessageBubble = ({
  msg,
  user,
  isStreaming,
  streamingMessageId,
  onStreamingComplete,
}: MessageBubbleProps) => {
  const typingAnimation = useTypingAnimation(
    isStreaming ? msg.content : "",
    { 
      speed: 15,
      onComplete: isStreaming ? onStreamingComplete : undefined,
    }
  );

  const displayContent = isStreaming
    ? typingAnimation.displayedText
    : msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-3 ${
        msg.sender_type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {/* Assistant Avatar */}
      {msg.sender_type === "assistant" && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0"
        >
          <FaRobot className="text-lg md:text-xl text-indigo-400" />
        </motion.div>
      )}

      {/* Chat Bubble */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`max-w-[85%] sm:max-w-xs md:max-w-md p-3 rounded-2xl text-sm break-words ${
          msg.sender_type === "user"
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-gray-800 text-gray-200 rounded-bl-none"
        }`}
      >
        {displayContent}
        {isStreaming && typingAnimation.isTyping && (
          <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse">|</span>
        )}
      </motion.div>

      {/* User Avatar */}
      {msg.sender_type === "user" && (
        <motion.img
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          src={user.profile_picture}
          alt="User avatar"
          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-600 shrink-0"
        />
      )}
    </motion.div>
  );
};

export default MessageBubble;

