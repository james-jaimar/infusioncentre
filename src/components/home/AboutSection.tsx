import { Link } from "react-router-dom";
import SectionLabel from "@/components/ui/SectionLabel";

const AboutSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel className="mb-6">About</SectionLabel>
          
          <h2 className="font-heading text-3xl lg:text-[48px] font-bold text-foreground mb-8">
            Private Nursing Practice, Northcliff
          </h2>
          
          <div className="space-y-6 text-muted-foreground text-lg mb-8">
            <p>
              The Johannesburg Infusion Centre is a private nursing practice based in Northcliff, 
              Johannesburg. We specialize in providing professional nursing care outside of the 
              hospital environment, offering a comfortable and convenient alternative for patients 
              requiring IV infusions, wound care, and other nursing procedures.
            </p>
            <p>
              Our services are provided by experienced, registered nurses who are dedicated to 
              delivering high-quality, compassionate care. We work closely with referring doctors 
              to ensure that each patient receives the appropriate treatment according to their 
              prescription.
            </p>
          </div>
          
          <p className="font-semibold text-foreground text-lg mb-10">
            Our services are available by appointment only.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/services" 
              className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors"
            >
              Information for Patients
            </Link>
            <Link 
              to="/doctors" 
              className="inline-block bg-secondary text-foreground border border-border px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary hover:text-white hover:border-primary transition-colors"
            >
              Information for Doctors
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
