import { Link } from "react-router-dom";
import SectionLabel from "@/components/ui/SectionLabel";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[500px] lg:min-h-[600px] flex items-center">
      {/* Background with hero image */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Nurse with patient" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-700/80 via-slate-600/60 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl text-white">
          <SectionLabel className="text-white/90 mb-6">
            Private Nursing Practice
          </SectionLabel>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-[57.6px] font-bold leading-tight mb-6">
            Specialists in out-of-hospital patient care.
          </h1>
          
          <p className="text-lg lg:text-xl opacity-90 mb-8">
            I.V. Infusions, Advanced Wound Care, Stoma Therapy and General Nursing Procedures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/contact" 
              className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors text-center"
            >
              Book an Appointment
            </Link>
            <Link 
              to="/services" 
              className="inline-block bg-white/10 backdrop-blur text-white border border-white/30 px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-white/20 transition-colors text-center"
            >
              Our Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
