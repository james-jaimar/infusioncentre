import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TIMEOUT_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const WARNING_BEFORE = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const DEBOUNCE_INTERVAL = 30 * 1000; // Only reset timers every 30 seconds max

interface UseSessionTimeoutOptions {
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { user, signOut } = useAuth();
  const { onWarning, onTimeout, enabled = true } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    onTimeout?.();
    await signOut();
  }, [clearTimers, onTimeout, signOut]);

  const resetTimers = useCallback(() => {
    if (!user || !enabled) return;
    
    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, TIMEOUT_DURATION);
  }, [user, enabled, clearTimers, onWarning, handleTimeout]);

  useEffect(() => {
    if (!user || !enabled) {
      clearTimers();
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < DEBOUNCE_INTERVAL) return;
      resetTimers();
    };

    // Initial timer setup
    resetTimers();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, enabled, resetTimers, clearTimers]);

  return {
    resetTimers,
    lastActivity: lastActivityRef.current,
  };
}
