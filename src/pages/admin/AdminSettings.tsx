import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ChairsSettingsTab from "@/components/admin/settings/ChairsSettingsTab";
import AppointmentTypesTab from "@/components/admin/settings/AppointmentTypesTab";
import StatusDictionaryTab from "@/components/admin/StatusDictionaryTab";
import ProtocolConfigTab from "@/components/admin/settings/ProtocolConfigTab";
import FormPackConfigTab from "@/components/admin/settings/FormPackConfigTab";
import FeatureFlagsTab from "@/components/admin/settings/FeatureFlagsTab";
import EmailNotificationsTab from "@/components/admin/settings/EmailNotificationsTab";
import ClinicSettingsTab from "@/components/admin/settings/ClinicSettingsTab";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure all aspects of your clinic operations</p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="clinic">Clinic</TabsTrigger>
            <TabsTrigger value="chairs">Chairs</TabsTrigger>
            <TabsTrigger value="types">Appointment Types</TabsTrigger>
            <TabsTrigger value="protocols">Protocols</TabsTrigger>
            <TabsTrigger value="forms">Form Packs</TabsTrigger>
            <TabsTrigger value="statuses">Statuses</TabsTrigger>
            <TabsTrigger value="features">Feature Flags</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="clinic"><ClinicSettingsTab /></TabsContent>
        <TabsContent value="chairs"><ChairsSettingsTab /></TabsContent>
        <TabsContent value="types"><AppointmentTypesTab /></TabsContent>
        <TabsContent value="protocols"><ProtocolConfigTab /></TabsContent>
        <TabsContent value="forms"><FormPackConfigTab /></TabsContent>
        <TabsContent value="statuses"><StatusDictionaryTab /></TabsContent>
        <TabsContent value="features"><FeatureFlagsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
