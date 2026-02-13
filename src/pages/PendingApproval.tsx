import { Link } from "react-router-dom";
import { Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function PendingApproval() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/">
          <img src={logo} alt="The Johannesburg Infusion Centre" className="h-20 w-auto mb-6 mx-auto" />
        </Link>
        <div className="bg-card p-8 shadow-sm space-y-4">
          <Clock className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground">Account Pending Approval</h1>
          <p className="text-muted-foreground">
            Your account has been created and is waiting for admin approval. You'll be able to log in once your account has been reviewed.
          </p>
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground">Need help? Contact us:</p>
            <a href="tel:+27118801830" className="flex items-center justify-center gap-2 text-primary hover:underline">
              <Phone className="h-4 w-4" />
              011 880 1830
            </a>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
