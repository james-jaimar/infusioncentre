import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Sub {
  table: string;
  event?: Event;
  schema?: string;
  filter?: string;
  onChange?: (payload: any) => void;
  invalidate?: (unknown[] | string)[];
}

/**
 * Subscribe to one or more Postgres realtime events and invalidate
 * react-query keys whenever a change is received. Handles cleanup.
 *
 * NOTE: Tables must be in the `supabase_realtime` publication.
 */
export function useRealtimeInvalidate(
  channelName: string,
  subs: Sub[],
  enabled: boolean = true
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || subs.length === 0) return;
    const channel = supabase.channel(channelName);

    for (const s of subs) {
      (channel as any).on(
        "postgres_changes",
        {
          event: s.event ?? "*",
          schema: s.schema ?? "public",
          table: s.table,
          ...(s.filter ? { filter: s.filter } : {}),
        },
        (payload: any) => {
          try {
            s.onChange?.(payload);
          } catch (e) {
            console.warn("realtime handler error", e);
          }
          for (const key of s.invalidate ?? []) {
            qc.invalidateQueries({
              queryKey: Array.isArray(key) ? key : [key],
            });
          }
        }
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);
}