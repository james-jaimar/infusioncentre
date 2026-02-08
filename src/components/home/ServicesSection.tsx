import { Link } from "react-router-dom";
import serviceInfusion from "@/assets/service-infusion.jpg";
import serviceWound from "@/assets/service-wound.jpg";
import serviceStoma from "@/assets/service-stoma.jpg";

const services = [
  {
    title: "IV Infusion Therapy",
    description: [
      "We provide a professional and comfortable environment for patients requiring intravenous infusions. Our services include administration of prescribed medications, iron infusions, vitamin therapy, and hydration treatments.",
      "All infusions are administered by qualified registered nurses with extensive experience in IV therapy. We ensure proper monitoring throughout the treatment and provide detailed documentation for referring doctors."
    ],
    bullets: [
      "Iron infusions",
      "Vitamin & nutrient infusions",
      "Medication infusions",
      "Hydration therapy"
    ],
    image: serviceInfusion,
    imageAlt: "IV Infusion Therapy",
    reverse: false
  },
  {
    title: "Advanced Wound Care",
    description: [
      "Our wound care service provides professional assessment and treatment of various wound types. We use evidence-based techniques and advanced dressings to promote optimal healing.",
      "Whether you have a surgical wound, chronic ulcer, or other wound requiring professional care, our experienced nurses can provide the treatment you need."
    ],
    bullets: [
      "Wound assessment and evaluation",
      "Dressing changes",
      "Post-surgical wound care",
      "Chronic wound management"
    ],
    image: serviceWound,
    imageAlt: "Advanced Wound Care",
    reverse: true
  },
  {
    title: "Stoma Care & Patient Support",
    description: [
      "Living with a stoma can be challenging, but with the right support and care, patients can maintain a high quality of life. Our stoma care service provides both clinical care and patient education.",
      "We offer ongoing support to help patients manage their stoma with confidence, including appliance fitting, skin care, and troubleshooting common issues."
    ],
    bullets: [
      "Stoma assessment and care",
      "Appliance fitting and advice",
      "Skin care management",
      "Patient education and support"
    ],
    image: serviceStoma,
    imageAlt: "Stoma Care",
    reverse: false
  }
];

const ServicesSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl lg:text-[48px] font-bold text-foreground text-center mb-16">
          Services we provide
        </h2>

        <div className="space-y-16 lg:space-y-24">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                service.reverse ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Image */}
              <div className={service.reverse ? "lg:col-start-2" : ""}>
                <img 
                  src={service.image} 
                  alt={service.imageAlt}
                  className="w-full h-auto shadow-lg"
                />
              </div>

              {/* Content */}
              <div className={service.reverse ? "lg:col-start-1" : ""}>
                <h3 className="font-heading text-2xl lg:text-[32px] font-bold text-foreground mb-6">
                  {service.title}
                </h3>
                
                <div className="space-y-4 text-muted-foreground mb-6">
                  {service.description.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <ul className="space-y-2 mb-8">
                  {service.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-foreground">
                      <span className="text-primary mt-1">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>

                <Link 
                  to="/contact" 
                  className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
