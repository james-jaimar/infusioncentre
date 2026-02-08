import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function PatientDashboard() {
  const { profile } = useAuth();

  const firstName = profile?.first_name || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          Manage your appointments and view your treatment records.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              No upcoming appointments
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contact">Request Appointment</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Treatment Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              View your treatment history
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient/records">View Records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contact Us</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Questions? Get in touch
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contact">Contact</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Your Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This patient portal allows you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>View your upcoming and past appointments</li>
            <li>Access your treatment records and history</li>
            <li>Update your profile and contact information</li>
            <li>Request new appointments through our contact form</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            If you have any questions or need assistance, please don't hesitate to contact us at{" "}
            <a href="tel:+27118801830" className="text-primary hover:underline">
              011 880 1830
            </a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
