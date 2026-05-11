import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import { IoBookOutline } from "react-icons/io5";
import api from "../api/axios";
import { MessageContext, type Message } from "../context/MessageContext";
import type { Conversation } from "./Dashboard";
import MessageBubble from "./MessageBubble";

interface ChatContainerProps {
  user: { name: string; profile_picture: string };
}

const SUGGESTED_PROMPTS = [
  { icon: "📖", text: "What does the Bible say about forgiveness?" },
  { icon: "🙏", text: "Give me a verse about strength and courage" },
  { icon: "❤️", text: "What does the Bible say about love?" },
  { icon: "🌟", text: "Share a verse for when I feel anxious" },
];

const ChatContainer = ({
  user,
  setConvList,
}: ChatContainerProps & {
  setConvList: React.Dispatch<React.SetStateAction<Conversation[]>>;
}) => {
  const { currentConvId, messages, setMessages } = useContext(MessageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [thinking, setThinking] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>("");
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(
    null,
  );
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Auto-scroll when messages update or assistant is thinking
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [userMessage]);

  const updateConversationTitle = (convId: number, newTitle: string) => {
    setConvList((prev) =>
      prev.map((conv) =>
        conv.id === convId ? { ...conv, title: newTitle } : conv,
      ),
    );
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentConvId) return;

    setMessages((prev) => [
      ...prev,
      { conv_id: currentConvId, sender_type: "user", content: text },
    ]);
    setUserMessage("");
    setThinking(true);

    try {
      const res = await api.post("/query", {
        conv_id: currentConvId,
        query: text,
      });

      if (res.data.title && res.data.title !== "New Conversation") {
        updateConversationTitle(currentConvId, res.data.title);
      }

      if (res.data) {
        const tempId = Date.now();
        setMessages((prev) => [...prev, { ...res.data, tempId }]);
        setStreamingMessageId(tempId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (error && typeof error === "object" && "response" in error) {
        const err = error as {
          response?: { status?: number; data?: { detail?: string } };
        };
        if (err.response?.status === 429) {
          setRateLimitError(
            "Too many requests. Please wait before sending another message.",
          );
          setTimeout(() => setRateLimitError(null), 5000);
        }
      }
    } finally {
      setThinking(false);
    }
  };

  const handleSend = () => sendMessage(userMessage);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const makeStreamingCompleteHandler = (index: number) => () => {
    setMessages((prev) =>
      prev.map((m, i) => {
        const mWithTempId = m as Message & { tempId?: number };
        return i === index && mWithTempId.tempId
          ? { ...m, tempId: undefined }
          : m;
      }),
    );
    setStreamingMessageId(null);
  };

  // No conversation selected
  if (!currentConvId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400 px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}>
          <FaRobot className="text-4xl md:text-5xl text-indigo-500 mb-4" />
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-lg font-medium text-center">
          🗨️ Select a conversation or start a new chat to begin.
        </motion.p>
      </motion.div>
    );
  }

  const isEmpty = messages.length === 0 && !thinking;

  return (
    <div className="flex flex-col bg-gray-900 text-white h-full min-h-0">
      {/* Messages area — fills remaining space and scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <AnimatePresence mode="popLayout">
          {/* ===== Welcome card — shown only on empty conversations ===== */}
          {isEmpty && (
            <motion.div
              key="welcome-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 14,
                  delay: 0.1,
                }}
                className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-5">
                <IoBookOutline className="text-3xl text-indigo-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
                What's on your heart?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-sm md:text-base text-center mb-8 max-w-sm">
                Ask anything about the Bible — verses, stories, guidance, or
                reflection.
              </motion.p>

              {/* Suggested prompt chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.07 }}
                    whileHover={{
                      scale: 1.03,
                      backgroundColor: "rgba(99,102,241,0.15)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(prompt.text)}
                    className="flex items-start gap-3 p-3 md:p-4 rounded-xl border border-gray-700 bg-gray-800/60 text-left text-sm text-gray-300 hover:border-indigo-500/60 transition-colors active:bg-gray-700 touch-manipulation">
                    <span className="text-lg leading-none mt-0.5 shrink-0">
                      {prompt.icon}
                    </span>
                    <span className="leading-snug">{prompt.text}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => {
            const msgWithTempId = msg as Message & { tempId?: number };
            const isStreaming =
              msgWithTempId.tempId === streamingMessageId &&
              msg.sender_type === "assistant";

            return (
              <MessageBubble
                key={`${msg.conv_id}-${index}-${msgWithTempId.tempId || ""}`}
                msg={msgWithTempId}
                user={user}
                isStreaming={isStreaming}
                streamingMessageId={streamingMessageId}
                onStreamingComplete={makeStreamingCompleteHandler(index)}
                index={index}
              />
            );
          })}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-gray-400 mt-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm italic">
                Assistant is thinking...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ===== Input area — flex item, always visible at bottom ===== */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="shrink-0 bg-gray-800 border-t border-gray-700 px-3 md:px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {rateLimitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm text-center">
            {rateLimitError}
          </motion.div>
        )}

        <div className="flex items-end gap-2 md:gap-3">
          <textarea
            ref={textareaRef}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none bg-gray-700 text-white placeholder-gray-400 px-3 md:px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm md:text-base leading-snug overflow-hidden"
            style={{ maxHeight: "120px" }}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors shrink-0 mb-0.5 touch-manipulation"
            aria-label="Send message"
            onClick={handleSend}
            disabled={thinking || !userMessage.trim()}>
            <FaPaperPlane className="text-white text-base md:text-lg" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatContainer;
