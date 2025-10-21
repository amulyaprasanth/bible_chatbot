import axios from "axios";
import { useEffect, useState } from "react";
import ChatInterface from "./ChatInterface";
import LanguageSelectionModal from "./LanguageSelectionModal";
import { PastConversations } from "./PastConversations";

export interface Conversation {
  id: number;
  title: string;
  is_active: boolean;
  updated_at: string;
  language: string;
}

export interface Message {
  conv_id: number;
  sender_type: string;
  content: string;
}

const Dashboard = () => {
  const token = localStorage.getItem("access_token");
  const [convoList, setConvoList] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: number;
    language: "english" | "telugu";
  } | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    axios
      .get("https://bible-chatbot-idx7.onrender.com/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConvoList(res.data))
      .catch((err) => console.error("Failed to fetch conversations:", err));
  }, [token]);

  const handleNewChatClick = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (language: "english" | "telugu") => {
    try {
      const res = await axios.post(
        "https://bible-chatbot-idx7.onrender.com/conversations",
        { language },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newConversation = res.data;
      setSelectedConversation({
        id: newConversation.id,
        language: newConversation.language,
      });
      setMessages([]);
      setShowSidebar(false);

      // Refresh conversations list
      const convoRes = await axios.get(
        "https://bible-chatbot-idx7.onrender.com/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConvoList(convoRes.data);
    } catch (err) {
      console.error("Failed to create new conversation:", err);
    }
  };

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleConversationUpdate = () => {
    // Refresh conversations list to get updated titles
    axios
      .get("https://bible-chatbot-idx7.onrender.com/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConvoList(res.data))
      .catch((err) => console.error("Failed to fetch conversations:", err));
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden relative">
      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-30 w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transform transition-transform duration-300 ease-in-out md:transform-none ${
          showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <PastConversations
          convoList={convoList}
          setMessages={setMessages}
          setSelectedConversation={setSelectedConversation}
          onConversationUpdate={handleConversationUpdate}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <button
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden cursor-default"
          onClick={handleToggleSidebar}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleToggleSidebar();
          }}
          aria-label="Close sidebar"
          type="button"
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:w-auto">
        <ChatInterface
          messages={messages}
          selectedConversation={selectedConversation}
          setMessages={setMessages}
          onNewChat={handleNewChatClick}
          onToggleSidebar={handleToggleSidebar}
          onConversationUpdate={handleConversationUpdate}
        />

        {/* Language Selection Modal */}
        <LanguageSelectionModal
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          onLanguageSelect={handleLanguageSelect}
        />
      </div>
    </div>
  );
};

export default Dashboard;
