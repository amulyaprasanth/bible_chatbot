import React, { useContext, useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import { MessageContext } from "../context/MessageContext";

interface ChatContainerProps {
    user: { name: string; profile_picture: string };
}

const ChatContainer = ({ user }: ChatContainerProps) => {
    const { currentConvId, messages, setMessages } = useContext(MessageContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [thinking, setThinking] = useState<boolean>(false);
    const [userMessage, setUserMessage] = useState<string>("");

    // Auto-scroll when messages update or assistant is thinking
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserMessage(e.target.value);
    };

    const handleSend = async () => {
        if (!userMessage.trim() || !currentConvId) return;

        try {
            // Add user message instantly
            setMessages((prev) => [
                ...prev,
                { conv_id: currentConvId, sender_type: "user", content: userMessage },
            ]);

            setUserMessage("");
            setThinking(true);

            const res = await api.post("/query", {
                conv_id: currentConvId,
                query: userMessage,
            });

            if (res.data) {
                setMessages((prev) => [...prev, res.data]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setThinking(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    // 🟣 If no conversation is selected, show placeholder message
    if (!currentConvId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400">
                <FaRobot className="text-5xl text-indigo-500 mb-4" />
                <p className="text-lg font-medium text-center">
                    🗨️ Select a conversation or start a new chat to begin.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-gray-900 text-white h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-end gap-3 ${
                            msg.sender_type === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        {/* Assistant Avatar */}
                        {msg.sender_type === "assistant" && (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <FaRobot className="text-xl text-indigo-400" />
                            </div>
                        )}

                        {/* Chat Bubble */}
                        <div
                            className={`max-w-xs md:max-w-md p-3 rounded-2xl text-sm break-words ${
                                msg.sender_type === "user"
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-gray-800 text-gray-200 rounded-bl-none"
                            }`}
                        >
                            {msg.content}
                        </div>

                        {/* User Avatar */}
                        {msg.sender_type === "user" && (
                            <img
                                src={user.profile_picture}
                                alt="User avatar"
                                className="w-10 h-10 rounded-full object-cover border border-gray-600"
                            />
                        )}
                    </div>
                ))}

                {/* Thinking Indicator */}
                {thinking && (
                    <div className="flex items-center gap-2 text-gray-400 mt-2">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm italic">Assistant is thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            {currentConvId && (
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={userMessage}
                            onChange={handleChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                        <button
                            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full transition"
                            aria-label="Send message"
                            onClick={handleSend}
                            disabled={thinking}
                        >
                            <FaPaperPlane
                                className={`text-white text-lg ${
                                    thinking ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatContainer;
