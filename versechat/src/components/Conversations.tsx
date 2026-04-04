import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { MessageContext } from "../context/MessageContext";
import ConversationItem from "./ConversationItem";
import type { Conversation } from "./Dashboard";

interface ConversationProps {
  convList: Conversation[];
  setConvList: React.Dispatch<React.SetStateAction<Conversation[]>>;
  onConversationSelect?: () => void;
}

const Conversations = ({
  convList,
  setConvList,
  onConversationSelect,
}: ConversationProps) => {
  const [loading, setLoading] = useState(false);
  const { setCurrentConvId, setMessages } = useContext(MessageContext);
  const [streamingTitleIds, setStreamingTitleIds] = useState<Set<number>>(
    new Set()
  );
  const prevTitlesRef = useRef<Map<number, string>>(new Map());

  // Helper function to remove streaming ID after animation
  const removeStreamingId = useCallback((convId: number) => {
    setStreamingTitleIds((current) => {
      const updated = new Set(current);
      updated.delete(convId);
      return updated;
    });
  }, []);

  // Helper function to start streaming animation for a conversation
  const startStreamingAnimation = useCallback(
    (convId: number, title: string) => {
      setStreamingTitleIds((prev) => {
        if (prev.has(convId)) {
          return prev;
        }
        return new Set([...prev, convId]);
      });

      // Schedule removal after animation duration
      const duration = title ? title.length * 30 : 1000;
      setTimeout(() => removeStreamingId(convId), duration);
    },
    [removeStreamingId]
  );

  // Helper function to check if title should trigger animation
  const shouldAnimateTitle = useCallback(
    (
      conv: Conversation,
      prevTitle: string | null,
      currentTitle: string
    ): boolean => {
      return !!(
        conv.title &&
        conv.title !== `Conversation ${conv.id}` &&
        (!prevTitle ||
          prevTitle === `Conversation ${conv.id}` ||
          prevTitle !== currentTitle)
      );
    },
    []
  );

  // Watch for title updates and trigger streaming animation
  useEffect(() => {
    convList.forEach((conv) => {
      const prevTitle = prevTitlesRef.current.get(conv.id);
      const currentTitle = conv.title || `Conversation ${conv.id}`;

      if (shouldAnimateTitle(conv, prevTitle || null, currentTitle)) {
        startStreamingAnimation(conv.id, conv.title || "");
      }

      // Update prev titles
      prevTitlesRef.current.set(conv.id, currentTitle);
    });
  }, [convList, startStreamingAnimation, shouldAnimateTitle]);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get("/conversations");
        setConvList(res.data.conversations);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create a new chat
  const handleNewChat = async () => {
    try {
      const res = await api.post("/conversations");
      setConvList((prev) => [...prev, res.data]);
      setCurrentConvId(res.data.id);
      setMessages([]);
    } catch (err) {
      console.error("Error creating new conversation:", err);
    }
  };

  // Delete a conversation
  const handleDelete = async (convId: number) => {
    try {
      await api.delete(`/conversations/${convId}`);
      setConvList((prev) => prev.filter((c) => c.id !== convId));
      if (currentConvId === convId) {
        setCurrentConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  //Get Messages from a conversation
  const handleConversation = async (convId: number) => {
    setCurrentConvId(convId);
    try {
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Error selecting conversation:", err);
    }
    onConversationSelect?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-[#F8FAFC] dark:bg-[#111827] flex flex-col rounded-xl shadow-md overflow-hidden"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1E293B] py-2 md:py-3 text-center flex justify-between items-center px-3 md:px-4 shadow"
      >
        <h2 className="text-white font-semibold text-base md:text-lg">
          Conversations
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewChat}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-3 md:px-4 py-1 rounded-md text-xs md:text-sm font-medium transition"
        >
          + New Chat
        </motion.button>
      </motion.div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-12 text-gray-500 dark:text-gray-400">
            Loading conversations...
          </div>
        )}

        {!loading && convList.length > 0 && (
          <AnimatePresence mode="popLayout">
            {convList.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isStreaming={streamingTitleIds.has(conv.id)}
                onDelete={handleDelete}
                onSelect={handleConversation}
              />
            ))}
          </AnimatePresence>
        )}

        {!loading && convList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400 mb-4"
            >
              No previous conversations found.
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-6 py-2 rounded-full shadow transition"
            >
              Start New Chat
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Conversations;
