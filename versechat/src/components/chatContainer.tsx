import { FaRobot } from "react-icons/fa";

interface ChatContainerProps {
  user: {name: string, profile_picture: string};
}

const ChatContainer = ({user}: ChatContainerProps) => {
  const messages = [
    {
      role: "user",
      content: "Hello, how are you?",
    },
    {
      role: "assistant",
      content: "I'm doing well, thanks for asking. How can I help you today?",
    },
    {
      role: "user",
      content: "Can you tell me about focus improvement techniques?",
    },
    {
      role: "assistant",
      content:
        "Sure! Some effective methods include mindfulness meditation, deep work sessions, and reducing digital distractions.",
    },
  ];

  return (
    <div className="flex flex-col bg-gray-900 text-white h-screen p-6 space-y-4 overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex items-end gap-3 ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {/* Assistant Avatar (left) */}
          {msg.role === "assistant" && (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <FaRobot className="text-xl text-indigo-400" />
            </div>
          )}

          {/* Chat Bubble */}
          <div
            className={`max-w-xs p-3 rounded-2xl text-sm ${
              msg.role === "user"
                ? "bg-indigo-600 rounded-br-none"
                : "bg-gray-800 rounded-bl-none"
            }`}
          >
            {msg.content}
          </div>

          {/* User Avatar (right) */}
          {msg.role === "user" && (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <img
                    key={user.profile_picture}
                    src={user.profile_picture}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover"

                  />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatContainer;
