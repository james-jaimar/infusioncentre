import { useState } from "react";
import { useConversations, useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ChatInput } from "@/components/messaging/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useEffect } from "react";

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  const [selectedPatientId, setSelectedPatientId] = useState<string>();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>();
  const [selectedConvType, setSelectedConvType] = useState<string>();

  const { data: messages = [], isLoading: msgsLoading } = useMessages({
    patientId: selectedPatientId,
    doctorId: selectedDoctorId,
    conversationType: selectedConvType,
  });

  // Mark messages as read when viewing
  useEffect(() => {
    if (!messages.length || !user) return;
    const unread = messages.filter((m) => !m.is_read && m.sender_id !== user.id);
    if (unread.length > 0) {
      markRead.mutate({ messageIds: unread.map((m) => m.id) });
    }
  }, [messages, user]);

  const handleSend = (content: string) => {
    if (!user) return;
    sendMessage.mutate(
      {
        conversation_type: selectedConvType || "admin_patient",
        patient_id: selectedPatientId || null,
        doctor_id: selectedDoctorId || null,
        sender_id: user.id,
        sender_role: "admin",
        content,
      },
      {
        onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Communicate with patients and doctors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <Card className="overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <p className="text-sm font-medium">Conversations</p>
          </div>
          <ConversationList
            conversations={conversations}
            selectedPatientId={selectedPatientId}
            selectedDoctorId={selectedDoctorId}
            onSelect={(conv) => {
              setSelectedPatientId(conv.patient_id);
              setSelectedDoctorId(conv.doctor_id);
              setSelectedConvType(conv.type);
            }}
            isLoading={convsLoading}
          />
        </Card>

        {/* Chat thread */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {selectedPatientId || selectedDoctorId ? (
            <>
              <div className="p-3 border-b bg-muted/30">
                <p className="text-sm font-medium">
                  {conversations.find(
                    (c) =>
                      c.patient_id === selectedPatientId || c.doctor_id === selectedDoctorId
                  )?.name || "Chat"}
                </p>
              </div>
              <ChatThread
                messages={messages}
                currentUserId={user?.id || ""}
                isLoading={msgsLoading}
              />
              <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
