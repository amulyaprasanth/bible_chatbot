import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import { MessageContext, type Message } from "../context/MessageContext";
import type { Conversation } from "./Dashboard";
import MessageBubble from "./MessageBubble";

interface ChatContainerProps {
  user: { name: string; profile_picture: string };
}

const ChatContainer = ({
  user,
  setConvList,
}: ChatContainerProps & {
  setConvList: React.Dispatch<React.SetStateAction<Conversation[]>>;
}) => {
  const { currentConvId, messages, setMessages } = useContext(MessageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thinking, setThinking] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>("");
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(
    null
  );

  // Auto-scroll when messages update or assistant is thinking
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserMessage(e.target.value);
  };

  const updateConversationTitle = (convId: number, newTitle: string) => {
    setConvList((prev) =>
      prev.map((conv) =>
        conv.id === convId ? { ...conv, title: newTitle } : conv
      )
    );
  };

  const handleSend = async () => {
    if (!userMessage.trim() || !currentConvId) return;

    try {
      // Add user message instantly
      setMessages((prev) => [
        ...prev,
        { conv_id: currentConvId, sender_type: "user", content: userMessage },
      ]);

      const userMsg = userMessage;
      setUserMessage("");
      setThinking(true);

      const res = await api.post("/query", {
        conv_id: currentConvId,
        query: userMsg,
      });

      if (res.data.title && res.data.title !== "New Conversation") {
        updateConversationTitle(currentConvId, res.data.title);
      }

      if (res.data) {
        // Add assistant message with a temporary ID for streaming
        const tempId = Date.now();
        setMessages((prev) => [...prev, { ...res.data, tempId }]);
        setStreamingMessageId(tempId);
        setThinking(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  // 🟣 If no conversation is selected, show placeholder message
  if (!currentConvId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400 px-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <FaRobot className="text-4xl md:text-5xl text-indigo-500 mb-4" />
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-lg font-medium text-center"
        >
          🗨️ Select a conversation or start a new chat to begin.
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-900 text-white h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const msgWithTempId = msg as Message & { tempId?: number };
            const isStreaming =
              msgWithTempId.tempId === streamingMessageId &&
              msg.sender_type === "assistant";

            const handleStreamingComplete = () => {
              // Remove tempId when streaming completes
              setMessages((prev) =>
                prev.map((m, i) => {
                  const mWithTempId = m as Message & { tempId?: number };
                  return i === index && mWithTempId.tempId
                    ? { ...m, tempId: undefined }
                    : m;
                })
              );
              setStreamingMessageId(null);
            };

            return (
              <MessageBubble
                key={`${msg.conv_id}-${index}-${msgWithTempId.tempId || ""}`}
                msg={msgWithTempId}
                user={user}
                isStreaming={isStreaming}
                streamingMessageId={streamingMessageId}
                onStreamingComplete={handleStreamingComplete}
                index={index}
              />
            );
          })}
        </AnimatePresence>

        {/* Thinking Indicator */}
        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-gray-400 mt-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"
              ></motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm italic"
              >
                Assistant is thinking...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      {!!currentConvId && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-3 md:px-4 py-3"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={userMessage}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-3 md:px-4 py-2 md:py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm md:text-base"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 md:p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shrink-0"
              aria-label="Send message"
              onClick={handleSend}
              disabled={thinking}
            >
              <FaPaperPlane
                className={`text-white text-base md:text-lg transition-opacity ${
                  thinking ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatContainer;
