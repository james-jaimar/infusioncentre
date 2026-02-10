import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Eye, Archive, CheckCircle, Clock, Inbox, Trash2 } from "lucide-react";

type ContactStatus = "new" | "in_progress" | "resolved" | "archived";

const statusConfig: Record<ContactStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "destructive" },
  in_progress: { label: "In Progress", variant: "default" },
  resolved: { label: "Resolved", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
};

function useContactSubmissions(statusFilter: string) {
  return useQuery({
    queryKey: ["contact-submissions", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

function useUpdateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({ title: "Contact updated" });
    },
  });
}

export default function AdminContacts() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const { data: contacts, isLoading } = useContactSubmissions(statusFilter);
  const updateContact = useUpdateContact();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
      return;
    }
    toast({ title: "Contact deleted" });
    queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    setSelectedContact(null);
  };

  const unreadCount = contacts?.filter((c: any) => !c.is_read).length || 0;

  const openContact = (contact: any) => {
    setSelectedContact(contact);
    setResponseNotes(contact.response_notes || "");
    if (!contact.is_read) {
      updateContact.mutate({ id: contact.id, updates: { is_read: true, read_at: new Date().toISOString() } });
    }
  };

  const updateStatus = (id: string, status: ContactStatus) => {
    updateContact.mutate({ id, updates: { status } });
    if (selectedContact?.id === id) {
      setSelectedContact({ ...selectedContact, status });
    }
  };

  const saveNotes = () => {
    if (!selectedContact) return;
    updateContact.mutate({
      id: selectedContact.id,
      updates: { response_notes: responseNotes },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contact Submissions</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} — {contacts?.length || 0} total
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !contacts?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No contact submissions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact: any) => (
            <Card
              key={contact.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${!contact.is_read ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => openContact(contact)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!contact.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <p className={`font-medium truncate ${!contact.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {contact.name}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{contact.subject}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{contact.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusConfig[contact.status as ContactStatus]?.variant || "outline"}>
                      {statusConfig[contact.status as ContactStatus]?.label || contact.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(contact.created_at), "dd MMM")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedContact?.subject}</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{selectedContact.name}</span>
                <Badge variant={statusConfig[selectedContact.status as ContactStatus]?.variant || "outline"}>
                  {statusConfig[selectedContact.status as ContactStatus]?.label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedContact.email}</span>
                {selectedContact.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedContact.phone}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(selectedContact.created_at), "dd MMM yyyy, HH:mm")}</span>
              </div>
              <div className="rounded-md border p-3 bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{selectedContact.message}</p>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedContact.status === "in_progress" ? "default" : "outline"}
                  onClick={() => updateStatus(selectedContact.id, "in_progress")}
                >
                  <Eye className="mr-1 h-4 w-4" /> In Progress
                </Button>
                <Button
                  size="sm"
                  variant={selectedContact.status === "resolved" ? "default" : "outline"}
                  onClick={() => updateStatus(selectedContact.id, "resolved")}
                >
                  <CheckCircle className="mr-1 h-4 w-4" /> Resolved
                </Button>
                <Button
                  size="sm"
                  variant={selectedContact.status === "archived" ? "default" : "outline"}
                  onClick={() => updateStatus(selectedContact.id, "archived")}
                >
                  <Archive className="mr-1 h-4 w-4" /> Archive
                </Button>
              </div>

              {/* Response Notes */}
              <div>
                <label className="text-sm font-medium text-foreground">Response Notes</label>
                <Textarea
                  className="mt-1"
                  placeholder="Add internal notes about this enquiry..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={saveNotes}>
                    Save Notes
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact Submission</AlertDialogTitle>
                        <AlertDialogDescription>
                          Permanently delete this submission from {selectedContact?.name}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => {
                            deleteContact(selectedContact.id);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
