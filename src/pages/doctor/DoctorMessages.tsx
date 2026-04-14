import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useSendMessage, useMarkMessagesRead, useConversations } from "@/hooks/useMessages";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ChatInput } from "@/components/messaging/ChatInput";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function DoctorMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string>();
  const [selectedPatientId, setSelectedPatientId] = useState<string>();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  // Resolve doctor record
  useEffect(() => {
    if (!user) return;
    supabase
      .from("doctors")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setDoctorId(data.id);
      });
  }, [user]);

  const { data: messages = [], isLoading } = useMessages({
    doctorId,
    conversationType: "admin_doctor",
  });

  // Mark as read
  useEffect(() => {
    if (!messages.length || !user) return;
    const unread = messages.filter((m) => !m.is_read && m.sender_id !== user.id);
    if (unread.length > 0) {
      markRead.mutate({ messageIds: unread.map((m) => m.id) });
    }
  }, [messages, user]);

  const handleSend = (content: string) => {
    if (!user || !doctorId) return;
    sendMessage.mutate(
      {
        conversation_type: "admin_doctor",
        doctor_id: doctorId,
        sender_id: user.id,
        sender_role: "doctor",
        content,
      },
      {
        onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
      }
    );
  };

  if (!doctorId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p>No doctor record found for your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Chat with the Infusion Centre team</p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-260px)]">
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Infusion Centre
          </CardTitle>
        </CardHeader>
        <ChatThread messages={messages} currentUserId={user?.id || ""} isLoading={isLoading} />
        <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
      </Card>
    </div>
  );
}
