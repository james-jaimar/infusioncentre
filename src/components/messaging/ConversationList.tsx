import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/hooks/useMessages";
import { MessageCircle, Stethoscope, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  conversations: Conversation[];
  selectedPatientId?: string;
  selectedDoctorId?: string;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export function ConversationList({ conversations, selectedPatientId, selectedDoctorId, onSelect, isLoading }: Props) {
  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conv) => {
          const isSelected =
            (conv.patient_id && conv.patient_id === selectedPatientId) ||
            (conv.doctor_id && conv.doctor_id === selectedDoctorId);

          return (
            <div
              key={conv.patient_id || conv.doctor_id}
              className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                isSelected ? "bg-muted" : ""
              }`}
              onClick={() => onSelect(conv)}
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                  conv.type === "admin_doctor" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                }`}>
                  {conv.type === "admin_doctor" ? (
                    <Stethoscope className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.name}</p>
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="ml-1 h-5 min-w-[20px] text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  {conv.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{conv.subtitle}</p>
                  )}
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  )}
                  {conv.last_message_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
