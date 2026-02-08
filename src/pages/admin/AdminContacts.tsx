import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminContacts() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Contact Submissions</h1>
        <p className="text-muted-foreground">Manage enquiries from the website contact form</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contact submission management will be implemented in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
