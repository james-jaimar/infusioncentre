import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { resetTimers } = useSessionTimeout({
    enabled: !!user,
    onWarning: () => {
      setShowWarning(true);
    },
    onTimeout: () => {
      setShowWarning(false);
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
    },
  });

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimers();
  };

  // Close warning if user becomes null (logged out)
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
    }
  }, [user]);

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in 5 minutes due to inactivity. Click below to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
