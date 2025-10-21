import axios from "axios";

interface Messages {
  conv_id: number;
  sender_type: string;
  content: string;
}

interface ConvCardProps {
  id: number;
  name: string;
  selected?: boolean;
  onSelect: (messages: Messages[]) => void;
}

const ConvCard = ({ id, name, onSelect, selected = false }: ConvCardProps) => {
  const token = localStorage.getItem("access_token");

  const handleClick = async () => {
    try {
      const res = await axios.get("https://bible-chatbot-idx7.onrender.com/get_messages", {
        params: { conv_id: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      onSelect(res.data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  return (
    <button
      className={`m-1 p-4 rounded-lg shadow-sm cursor-pointer transition flex items-center w-full text-left
        ${
          selected
            ? "bg-indigo-100 dark:bg-indigo-700 font-semibold"
            : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        }
      `}
      onClick={handleClick}
      type="button"
    >
      <p
        className={`${
          selected
            ? "text-indigo-900 dark:text-white"
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {name}
      </p>
    </button>
  );
};

export default ConvCard;
