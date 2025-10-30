import { useContext, useEffect, useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import api from "../api/axios";
import { MessageContext } from "../context/MessageContext";

interface Conversation {
  id: number;
  title?: string;
  user_id: string;
}

const Conversations = () => {
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { setCurrentConvId, setMessages } = useContext(MessageContext);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get("/conversations");
        setConvList(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
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
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  //Get Messages from a conversation
    const handleConversation = async (convId: number) => {
        setCurrentConvId(convId);
        try {
            const res = await api.get(`/messages/${convId}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Error selecting conversation:", err);
        }
    }
  return (
    <div className="h-full bg-[#F8FAFC] dark:bg-[#111827] flex flex-col rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#1E293B] py-3 text-center flex justify-between items-center px-4 shadow">
        <h2 className="text-white font-semibold text-lg">Conversations</h2>
        <button
          onClick={handleNewChat}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-1 rounded-md text-sm font-medium transition"
        >
          + New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center py-12 text-gray-500 dark:text-gray-400">
            Loading conversations...
          </div>
        )}

        {!loading && convList.length > 0 && (
          <>
            {convList.map((conv) => (
              <div
                key={conv.id}
                className=" hover:cursor-pointer flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-[#E2E8F0] dark:hover:bg-[#334155] transition"
                onClick={() => handleConversation(conv.id)}
              >
                <p className="text-[#1E293B] dark:text-[#E2E8F0] font-medium truncate">
                  {conv.title || `Conversation ${conv.id}`}
                </p>
                <button
                  onClick={() => handleDelete(conv.id)}
                  className="text-red-500 hover:text-red-600 transition"
                  aria-label={`Delete conversation ${conv.id}`}
                >
                  <MdDeleteForever size={22} />
                </button>
              </div>
            ))}
          </>
        )}

        {!loading && convList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No previous conversations found.
            </p>
            <button
              onClick={handleNewChat}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-6 py-2 rounded-full shadow transition"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
