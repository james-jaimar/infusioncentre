import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, FileText } from "lucide-react";
import EmailLogTab from "@/components/admin/EmailLogTab";
import EmailTemplatesTab from "@/components/admin/EmailTemplatesTab";

export default function AdminCommunications() {
  const [tab, setTab] = useState("log");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communication Hub</h1>
        <p className="text-muted-foreground">Email logs, templates, and compose</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="log" className="gap-2">
            <Mail className="h-4 w-4" /> Email Log
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <EmailLogTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <EmailTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
