import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePatient } from "@/hooks/usePatients";
import { useUpsertPatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const patientSchema = z.object({
  // Personal Details (Step 1)
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  id_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Emergency Contact (Step 2)
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  
  // Medical Aid (Step 3)
  medical_aid_name: z.string().optional(),
  medical_aid_number: z.string().optional(),
  medical_aid_plan: z.string().optional(),
  medical_aid_main_member: z.string().optional(),
  referring_doctor_name: z.string().optional(),
  referring_doctor_practice: z.string().optional(),
  referring_doctor_phone: z.string().optional(),
  
  // Medical History (Step 4)
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  previous_surgeries: z.string().optional(),
  medical_notes: z.string().optional(),
  
  // General
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const steps = [
  { title: "Personal Details", description: "Basic patient information" },
  { title: "Emergency Contact", description: "Emergency contact details" },
  { title: "Medical Aid", description: "Medical aid and referring doctor" },
  { title: "Medical History", description: "Allergies and conditions" },
];

export default function PatientNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  const createPatient = useCreatePatient();
  const upsertMedicalHistory = useUpsertPatientMedicalHistory();
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const isSubmitting = createPatient.isPending || upsertMedicalHistory.isPending;

  const handleNext = async () => {
    // Validate current step fields
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof PatientFormData)[] => {
    switch (step) {
      case 0:
        return ["first_name", "last_name", "id_number", "date_of_birth", "gender", "phone", "email", "address_line_1", "address_line_2", "city", "postal_code"];
      case 1:
        return ["emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship"];
      case 2:
        return ["medical_aid_name", "medical_aid_number", "medical_aid_plan", "medical_aid_main_member", "referring_doctor_name", "referring_doctor_practice", "referring_doctor_phone"];
      case 3:
        return ["allergies", "chronic_conditions", "previous_surgeries", "medical_notes", "notes"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    try {
      // Create the patient first
      const patient = await createPatient.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name,
        id_number: data.id_number || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address_line_1: data.address_line_1 || null,
        address_line_2: data.address_line_2 || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        medical_aid_name: data.medical_aid_name || null,
        medical_aid_number: data.medical_aid_number || null,
        medical_aid_plan: data.medical_aid_plan || null,
        medical_aid_main_member: data.medical_aid_main_member || null,
        referring_doctor_name: data.referring_doctor_name || null,
        referring_doctor_practice: data.referring_doctor_practice || null,
        referring_doctor_phone: data.referring_doctor_phone || null,
        notes: data.notes || null,
        user_id: null,
        status: 'active',
      });

      // Create medical history if any fields are filled
      if (data.allergies || data.chronic_conditions || data.previous_surgeries || data.medical_notes) {
        await upsertMedicalHistory.mutateAsync({
          patient_id: patient.id,
          allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
          chronic_conditions: data.chronic_conditions ? data.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean) : null,
          previous_surgeries: data.previous_surgeries || null,
          notes: data.medical_notes || null,
          current_medications: null,
          updated_by: null,
        });
      }

      toast.success("Patient created successfully");
      navigate(`/admin/patients/${patient.id}`);
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error("Failed to create patient. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/patients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add New Patient</h1>
          <p className="text-muted-foreground">
            Complete the intake form to add a new patient
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`hidden sm:block text-sm ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Personal Details */}
              {currentStep === 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="id_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="SA ID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="072 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="patient@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address_line_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address_line_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartment, suite, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Johannesburg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Emergency Contact */}
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="072 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Input placeholder="Spouse, Parent, Sibling, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Step 3: Medical Aid */}
              {currentStep === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="medical_aid_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Aid</FormLabel>
                          <FormControl>
                            <Input placeholder="Discovery, Bonitas, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medical_aid_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Medical aid number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="medical_aid_plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan/Option</FormLabel>
                          <FormControl>
                            <Input placeholder="Plan name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medical_aid_main_member"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Member Name</FormLabel>
                          <FormControl>
                            <Input placeholder="If different from patient" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <hr className="my-4" />
                  <h3 className="font-medium">Referring Doctor</h3>

                  <FormField
                    control={form.control}
                    name="referring_doctor_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="referring_doctor_practice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Practice Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Practice or hospital" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referring_doctor_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="011 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Step 4: Medical History */}
              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List allergies separated by commas (e.g., Penicillin, Latex, Sulfa drugs)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chronic_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chronic Conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List conditions separated by commas (e.g., Diabetes, Hypertension)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="previous_surgeries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Surgeries</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any previous surgeries"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medical_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional medical information"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any other notes about this patient"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Patient
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
