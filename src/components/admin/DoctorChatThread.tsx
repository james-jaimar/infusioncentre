import { useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ChatInput } from "@/components/messaging/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface DoctorChatThreadProps {
  doctorId: string;
}

export default function DoctorChatThread({ doctorId }: DoctorChatThreadProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages({
    doctorId,
    conversationType: "admin_doctor",
  });
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  useEffect(() => {
    if (!messages.length || !user) return;
    const unread = messages.filter((m) => !m.is_read && m.sender_id !== user.id);
    if (unread.length > 0) {
      markRead.mutate({ messageIds: unread.map((m) => m.id) });
    }
  }, [messages, user]);

  const handleSend = (content: string) => {
    if (!user) return;
    sendMessage.mutate({
      conversation_type: "admin_doctor",
      doctor_id: doctorId,
      sender_id: user.id,
      sender_role: "admin",
      content,
    });
  };

  return (
    <>
      <ChatThread messages={messages} currentUserId={user?.id || ""} isLoading={isLoading} />
      <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
    </>
  );
}
