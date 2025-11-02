import { motion } from "framer-motion";
import { MdDeleteForever } from "react-icons/md";
import { useTypingAnimation } from "../hooks/useTypingAnimation";
import type { Conversation } from "./Dashboard";

interface ConversationItemProps {
  conv: Conversation;
  isStreaming: boolean;
  onDelete: (convId: number) => void;
  onSelect: (convId: number) => void;
}

const ConversationItem = ({
  conv,
  isStreaming,
  onDelete,
  onSelect,
}: ConversationItemProps) => {
  const { displayedText, isTyping } = useTypingAnimation(
    isStreaming && conv.title ? conv.title : "",
    { speed: 30 }
  );

  const displayTitle = isStreaming && displayedText && isTyping
    ? displayedText
    : conv.title || `Conversation ${conv.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="hover:cursor-pointer flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-[#E2E8F0] dark:hover:bg-[#334155] active:bg-[#CBD5E1] dark:active:bg-[#475569] transition"
      onClick={() => onSelect(conv.id)}
    >
      <motion.p
        className="text-[#1E293B] dark:text-[#E2E8F0] font-medium truncate text-sm md:text-base"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {displayTitle}
        {isStreaming && isTyping && (
          <span className="inline-block w-1 h-4 bg-indigo-500 ml-1 animate-pulse">|</span>
        )}
      </motion.p>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conv.id);
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="text-red-500 hover:text-red-600 transition shrink-0"
        aria-label={`Delete conversation ${conv.id}`}
      >
        <MdDeleteForever size={20} className="md:size-[22px]" />
      </motion.button>
    </motion.div>
  );
};

export default ConversationItem;

