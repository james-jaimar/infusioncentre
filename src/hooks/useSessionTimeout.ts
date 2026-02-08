import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_BEFORE = 2 * 60 * 1000; // Show warning 2 minutes before timeout

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
