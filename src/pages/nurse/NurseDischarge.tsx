import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Legacy route: /nurse/discharge/:treatmentId
 * Discharge is now an in-page stage on the job card. This component
 * redirects to the job card for the matching appointment.
 */
export default function NurseDischarge() {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!treatmentId) {
      navigate("/nurse/command-centre", { replace: true });
      return;
    }
    supabase
      .from("treatments")
      .select("appointment_id")
      .eq("id", treatmentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.appointment_id) {
          navigate(`/nurse/job-card/${data.appointment_id}`, { replace: true });
        } else {
          navigate("/nurse/command-centre", { replace: true });
        }
      });
  }, [treatmentId, navigate]);

  return <div className="text-center py-12 text-muted-foreground">Redirecting to job card…</div>;
}
