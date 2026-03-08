import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Palette, Armchair, Users } from "lucide-react";

interface TenantFormProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  submitLabel: string;
}

const defaultValues = {
  name: "",
  slug: "",
  plan: "professional",
  billing_email: "",
  primary_color: "#3E5B84",
  secondary_color: "#6B8EB2",
  accent_color: "#E8A87C",
  max_chairs: 10,
  max_users: 50,
  is_active: true,
};

export default function TenantForm({ initialValues, onSubmit, submitLabel }: TenantFormProps) {
  const [values, setValues] = useState(initialValues ?? defaultValues);
  const update = (patch: any) => setValues((v: any) => ({ ...v, ...patch }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Clinic Name</Label>
          <Input value={values.name} onChange={e => update({ name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={values.slug} onChange={e => update({ slug: e.target.value })} placeholder="clinic-slug" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={values.plan} onValueChange={v => update({ plan: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Billing Email</Label>
          <Input type="email" value={values.billing_email || ""} onChange={e => update({ billing_email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Primary</Label>
          <div className="flex gap-2">
            <input type="color" value={values.primary_color} onChange={e => update({ primary_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.primary_color} onChange={e => update({ primary_color: e.target.value })} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Secondary</Label>
          <div className="flex gap-2">
            <input type="color" value={values.secondary_color} onChange={e => update({ secondary_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.secondary_color} onChange={e => update({ secondary_color: e.target.value })} className="flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Accent</Label>
          <div className="flex gap-2">
            <input type="color" value={values.accent_color} onChange={e => update({ accent_color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
            <Input value={values.accent_color} onChange={e => update({ accent_color: e.target.value })} className="flex-1" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Armchair className="h-3 w-3" /> Max Chairs</Label>
          <Input type="number" value={values.max_chairs} onChange={e => update({ max_chairs: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Max Users</Label>
          <Input type="number" value={values.max_users} onChange={e => update({ max_users: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      {initialValues && (
        <div className="flex items-center gap-3">
          <Switch checked={values.is_active} onCheckedChange={v => update({ is_active: v })} />
          <Label>Active</Label>
        </div>
      )}
      <Button onClick={() => onSubmit(values)} className="w-full">{submitLabel}</Button>
    </div>
  );
}
