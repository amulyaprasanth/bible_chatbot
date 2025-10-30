import React, { useMemo } from "react";
import { MessageContext, type Message } from "./MessageContext";

export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [currentConvId, setCurrentConvId] = React.useState<number | null>(null);

  const value = useMemo(
    () => ({ messages, setMessages, currentConvId, setCurrentConvId }),
    [messages, setMessages, currentConvId, setCurrentConvId]
  );

  return (
    <MessageContext.Provider value={value}>
      <div>{children}</div>
    </MessageContext.Provider>
  );
};
