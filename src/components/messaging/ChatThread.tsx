import { useEffect, useRef } from "react";
import { Message } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM yyyy");
}

export function ChatThread({ messages, currentUserId, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading messages...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No messages yet. Start the conversation!
      </div>
    );
  }

  // Group messages by date
  let lastDate = "";

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-1">
        {messages.map((msg) => {
          const msgDate = formatMessageDate(msg.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
          const isMine = msg.sender_id === currentUserId;
          const isPatientUpdate = msg.content.startsWith("[Patient Update");

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                    {msgDate}
                  </span>
                </div>
              )}
              <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isPatientUpdate && !isMine
                      ? "bg-accent text-accent-foreground border border-primary/30 rounded-bl-md"
                      : isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {isPatientUpdate && !isMine && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-primary">
                      Patient update request
                    </p>
                  )}
                  {!isMine && (
                    <p className="text-xs font-medium mb-0.5 opacity-70 capitalize">
                      {msg.sender_role}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
                    {format(new Date(msg.created_at), "HH:mm")}
                    {isMine && msg.is_read && " ✓✓"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
