import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface Row {
  id: string;
  recipient: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export default function SmsLogPanel() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sms_log", status],
    queryFn: async () => {
      let q = supabase
        .from("communication_log")
        .select("id,recipient,subject,status,error_message,sent_at,created_at")
        .eq("type", "sms")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") q = q.eq("status", status as "pending" | "sent" | "failed");
      const { data, error } = await q;
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(
      (r) =>
        r.recipient.toLowerCase().includes(s) ||
        (r.subject ?? "").toLowerCase().includes(s) ||
        (r.error_message ?? "").toLowerCase().includes(s),
    );
  }, [data, search]);

  const counts = useMemo(() => {
    const c = { sent: 0, failed: 0, pending: 0 };
    data.forEach((r) => { c[r.status as keyof typeof c] = (c[r.status as keyof typeof c] ?? 0) + 1; });
    return c;
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Outgoing SMS log</CardTitle>
            <CardDescription>
              Last 200 messages. {counts.sent} sent · {counts.failed} failed · {counts.pending} pending.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search number / message / error…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {(["all", "sent", "failed", "pending"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">When</TableHead>
                <TableHead className="w-[140px]">To</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Loading…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No SMS messages yet.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(r.sent_at ?? r.created_at).toLocaleString("en-ZA", {
                      timeZone: "Africa/Johannesburg",
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{r.recipient}</TableCell>
                  <TableCell className="text-xs">{r.subject ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {r.status === "failed" ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="destructive" className="cursor-help gap-1">
                              <AlertTriangle className="h-3 w-3" /> Failed
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-xs">{r.error_message ?? "Unknown error"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : r.status === "sent" ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Sent</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}