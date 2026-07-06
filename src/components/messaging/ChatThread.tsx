import { useEffect, useRef } from "react";
import { Message } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StickyNote, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ThreadNote {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  notes?: ThreadNote[];
  onMarkUnread?: (messageId: string) => void;
}

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM yyyy");
}

type ThreadItem =
  | { kind: "message"; created_at: string; msg: Message }
  | { kind: "note"; created_at: string; note: ThreadNote };

export function ChatThread({ messages, currentUserId, isLoading, notes = [], onMarkUnread }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const items: ThreadItem[] = [
    ...messages.map<ThreadItem>((m) => ({ kind: "message", created_at: m.created_at, msg: m })),
    ...notes.map<ThreadItem>((n) => ({ kind: "note", created_at: n.created_at, note: n })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading messages...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No messages yet.
      </div>
    );
  }

  // Group messages by date
  let lastDate = "";

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-1">
        {items.map((item) => {
          const msgDate = formatMessageDate(item.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;

          if (item.kind === "note") {
            const note = item.note;
            return (
              <div key={`note-${note.id}`}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                      {msgDate}
                    </span>
                  </div>
                )}
                <div className="flex justify-center mb-2">
                  <div className="max-w-[85%] w-full rounded-lg border border-amber-300/60 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide mb-1 text-amber-700">
                      <StickyNote className="h-3 w-3" /> Patient note
                    </p>
                    <p className="whitespace-pre-wrap break-words">{note.content}</p>
                    <p className="text-[10px] mt-1 text-amber-700 text-right">
                      {format(new Date(note.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          const msg = item.msg;
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
              <div className={`group flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                {!isMine && onMarkUnread && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkUnread(msg.id)}
                    className="order-2 h-7 px-2 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title={msg.is_read ? "Create action item" : "Already an action item"}
                    disabled={!msg.is_read}
                  >
                    <MailOpen className="h-3.5 w-3.5 mr-1" />
                    Create action item
                  </Button>
                )}
                <div
                  className={`order-1 relative ${!isMine && !msg.is_read ? "ring-2 ring-primary/60 rounded-2xl" : ""}`}
                >
                <div
                  className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] min-w-[120px] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
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
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
