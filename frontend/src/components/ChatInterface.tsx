import { useState } from "react";
import { FaBars, FaPlus, FaRobot, FaUserCircle } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { apiClient } from "../api/axios";
import { API_ENDPOINTS } from "../api/config";
import type { Message } from "./Dashboard";

interface ChatInterfaceProps {
  messages: Message[];
  selectedConversation: { id: number; language: "english" | "telugu" } | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onConversationUpdate?: () => void;
}

const ChatInterface = ({
  messages,
  selectedConversation,
  setMessages,
  onNewChat,
  onToggleSidebar,
  onConversationUpdate,
}: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("access_token");

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    const userMsg = {
      sender_type: "USER",
      content: newMessage.trim(),
      conv_id: selectedConversation.id,
    };

    // Add user's message to UI
    setMessages((prev) => [...prev, userMsg]);
    const currentMessage = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      const res = await apiClient.post(
        API_ENDPOINTS.QUERY,
        {
          question: currentMessage,
          language: selectedConversation.language,
          conv_id: selectedConversation.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const assistantMsg: Message = {
        sender_type: "BOT",
        content: res.data.answer,
        conv_id: selectedConversation.id,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Trigger conversation list refresh to update title if it was generated
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (err) {
      console.error("Failed to query Bible assistant:", err);
      const errorMsg: Message = {
        sender_type: "BOT",
        content: "Failed to fetch answer. Please try again.",
        conv_id: selectedConversation.id,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <FaBars className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            VerseChat
          </h1>
        </div>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm md:text-base"
          >
            <FaPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-center max-w-2xl">
              <FaRobot className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Welcome to Bible Assistant
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Ask me anything about the Bible. I can help you find verses,
                explain passages, and answer questions about biblical teachings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Find Verses
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "What does John 3:16 say?"
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Ask Questions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "What is the meaning of love in the Bible?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 sm:mb-8 ${
                  msg.sender_type === "USER"
                    ? "flex justify-end"
                    : "flex justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-2 sm:gap-3 w-full sm:max-w-3xl ${
                    msg.sender_type === "USER" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      msg.sender_type === "USER"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {msg.sender_type === "USER" ? (
                      <FaUserCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <FaRobot className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {/* Message content */}
                  <div
                    className={`flex-1 min-w-0 ${
                      msg.sender_type === "USER" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-base ${
                        msg.sender_type === "USER"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4 sm:mb-8">
                <div className="flex items-start gap-2 sm:gap-3 w-full sm:max-w-3xl">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <FaRobot className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ChatGPT-style input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="max-w-4xl mx-auto p-2 sm:p-4">
          <div className="relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message VerseChat..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "200px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isLoading}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Send message"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-center hidden sm:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
