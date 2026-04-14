import { useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ChatInput } from "@/components/messaging/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface PatientChatThreadProps {
  patientId: string;
}

export default function PatientChatThread({ patientId }: PatientChatThreadProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages({
    patientId,
    conversationType: "admin_patient",
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
      conversation_type: "admin_patient",
      patient_id: patientId,
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
