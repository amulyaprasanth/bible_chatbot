import { createContext, type Dispatch, type SetStateAction } from "react";

export interface Message {
  conv_id: number;
  sender_type: string;
  content: string;
}
interface MessageContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  currentConvId: number | null;
  setCurrentConvId: Dispatch<SetStateAction<number | null>>;
}

export const MessageContext = createContext<MessageContextType>({
  messages: [],
  setMessages: () => {},
  currentConvId: null,
  setCurrentConvId: () => {},
});
