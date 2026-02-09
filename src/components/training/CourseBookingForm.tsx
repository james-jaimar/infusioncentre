import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

const bookingSchema = z.object({
  participant_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(10, "Valid phone number required").max(20),
  organisation: z.string().trim().max(200).optional(),
  preferred_dates: z.string().trim().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface CourseBookingFormProps {
  courseId: string;
  courseName: string;
}

const CourseBookingForm = ({ courseId, courseName }: CourseBookingFormProps) => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      participant_name: "",
      email: "",
      phone: "",
      organisation: "",
      preferred_dates: "",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("course_bookings").insert({
        course_id: courseId,
        participant_name: data.participant_name,
        email: data.email,
        phone: data.phone || null,
        organisation: data.organisation || null,
        preferred_dates: data.preferred_dates || null,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-secondary p-8 text-center">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">
          Booking Request Received
        </h3>
        <p className="text-muted-foreground">
          Thank you for your interest in the {courseName}. We'll be in touch shortly to confirm dates and availability.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary p-6 lg:p-8">
      <h3 className="font-heading text-xl font-bold text-foreground mb-6">
        Register Your Interest
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="participant_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 082 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="organisation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation / Practice</FormLabel>
                <FormControl>
                  <Input placeholder="Your workplace (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preferred_dates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Dates</FormLabel>
                <FormControl>
                  <Textarea placeholder="Let us know your preferred dates or availability (optional)" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </button>
        </form>
      </Form>
    </div>
  );
};

export default CourseBookingForm;
