import { useState } from "react";
import { FaClock, FaComments, FaGlobe, FaPlus, FaTrash } from "react-icons/fa";
import { apiClient } from "../api/axios";
import { API_ENDPOINTS } from "../api/config";
import type { Conversation, Message } from "./Dashboard";

interface PastConversationsProps {
  convoList: Conversation[];
  setConversations?: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setActiveConversationId?: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedConversation?: React.Dispatch<
    React.SetStateAction<{ id: number; language: "english" | "telugu" } | null>
  >;
  onConversationUpdate?: () => void;
}

export const PastConversations = ({
  convoList,
  setConversations,
  setMessages,
  setActiveConversationId,
  setSelectedConversation,
  onConversationUpdate,
}: PastConversationsProps) => {
  const token = localStorage.getItem("access_token");
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );

  const handleClick = async (convId: number) => {
    try {
      setSelectedConvId(convId);
      const res = await apiClient.get(API_ENDPOINTS.GET_MESSAGES, {
        params: { conv_id: convId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      if (setActiveConversationId) setActiveConversationId(convId);

      // Find the conversation to get its language
      const conv = convoList.find((c) => c.id === convId);
      if (setSelectedConversation && conv) {
        setSelectedConversation({
          id: convId,
          language: (conv.language || "english") as "english" | "telugu",
        });
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const createConversation = async (language: string) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.CONVERSATIONS,
        { language: language.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newConv = res.data;
      setSelectedConvId(newConv.id);
      if (setConversations) setConversations((prev) => [newConv, ...prev]);
      setMessages([]);
      if (setActiveConversationId) setActiveConversationId(newConv.id);
      if (setSelectedConversation) {
        setSelectedConversation({
          id: newConv.id,
          language: language.toLowerCase() as "english" | "telugu",
        });
      }
      setShowLanguageSelect(false);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title && conv.title !== `Conversation #${conv.id}`) {
      return conv.title;
    }
    return `New Chat ${conv.id}`;
  };

  const handleDeleteConversation = async (convId: number) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.CONVERSATIONS}/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear messages if the deleted conversation was selected
      if (selectedConvId === convId) {
        setMessages([]);
        setSelectedConvId(null);
        if (setSelectedConversation) {
          setSelectedConversation(null);
        }
      }

      // Refresh conversation list
      if (onConversationUpdate) {
        onConversationUpdate();
      } else if (setConversations) {
        setConversations((prev) => prev.filter((conv) => conv.id !== convId));
      }

      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, convId: number) => {
    e.stopPropagation(); // Prevent conversation selection
    setShowDeleteConfirm(convId);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
          onClick={() => setShowLanguageSelect(!showLanguageSelect)}
        >
          <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          New Chat
        </button>
      </div>

      {/* Language Selection */}
      {showLanguageSelect && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {["English", "Telugu"].map((lang) => (
              <button
                key={lang}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors font-medium text-gray-700 dark:text-gray-200 text-sm sm:text-base"
                onClick={() => createConversation(lang)}
                type="button"
              >
                <FaGlobe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {convoList.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400">
            <FaComments className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-1.5 sm:p-2">
            {convoList.map((conv) => (
              <div key={conv.id} className="relative group">
                <button
                  className={`w-full flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors text-left mb-1 ${
                    selectedConvId === conv.id
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => handleClick(conv.id)}
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <FaComments className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-xs sm:text-sm truncate pr-6">
                        {getConversationTitle(conv)}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0 hidden sm:flex">
                        <FaClock className="w-3 h-3" />
                        {formatDate(conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 dark:bg-gray-600 rounded-full">
                        {conv.language || "english"}
                      </span>
                      {conv.is_active && (
                        <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  className="absolute right-1 sm:right-2 top-1 sm:top-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all duration-200 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 touch-manipulation sm:touch-auto"
                  onClick={(e) => handleDeleteClick(e, conv.id)}
                  title="Delete conversation"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => handleDeleteConversation(showDeleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
