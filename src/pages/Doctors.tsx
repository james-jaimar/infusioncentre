import PublicLayout from "@/components/layout/PublicLayout";
import { Link } from "react-router-dom";
import SectionLabel from "@/components/ui/SectionLabel";
import { Check } from "lucide-react";

const Doctors = () => {
  const infusionServices = [
    "Iron infusions",
    "Vitamin & nutrient infusions",
    "Medication infusions as prescribed",
    "Hydration therapy",
    "Ketamine infusions (with appropriate protocols)"
  ];

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl lg:text-[57.6px] font-bold text-white mb-4">
            INFORMATION FOR DOCTORS
          </h1>
          <p className="text-lg text-white/80 italic max-w-2xl mx-auto">
            Partner with us to provide your patients with professional infusion services.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Content */}
            <div>
              <SectionLabel className="mb-6">Who we are</SectionLabel>
              
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Private Nursing Practice
              </h2>
              
              <div className="space-y-4 text-muted-foreground mb-8">
                <p>
                  The Johannesburg Infusion Centre is a private nursing practice providing 
                  professional out-of-hospital infusion services. We offer a comfortable, 
                  safe environment for your patients to receive their prescribed IV treatments.
                </p>
                <p>
                  Our experienced nursing team administers infusions according to your 
                  prescription, with careful monitoring and detailed documentation provided 
                  after each treatment.
                </p>
              </div>

              <SectionLabel className="mb-6">Out-of-hospital Infusions</SectionLabel>
              
              <p className="text-muted-foreground mb-6">
                We can administer a wide range of IV treatments as prescribed, including:
              </p>

              <ul className="space-y-3 mb-8">
                {infusionServices.map((service) => (
                  <li key={service} className="flex items-start gap-3 text-foreground">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    {service}
                  </li>
                ))}
              </ul>

              <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                Referral Process
              </h3>
              <p className="text-muted-foreground mb-6">
                Simply provide a prescription or referral letter specifying the treatment, 
                dosage, frequency, and duration. Your patient can then contact us to schedule 
                their appointment. We will provide you with treatment notes and observations 
                after each session.
              </p>

              <Link 
                to="/contact" 
                className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </Link>
            </div>

            {/* Image placeholder */}
            <div className="bg-secondary p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-4xl">💉</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  IV drip bag image placeholder
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Doctors;
