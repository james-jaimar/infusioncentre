import PublicLayout from "@/components/layout/PublicLayout";
import { Link } from "react-router-dom";
import serviceInfusion from "@/assets/service-infusion.jpg";
import serviceWound from "@/assets/service-wound.jpg";
import serviceStoma from "@/assets/service-stoma.jpg";

const services = [
  {
    id: "infusion",
    title: "IV Infusion Therapy",
    description: [
      "We provide a professional and comfortable environment for patients requiring intravenous infusions. Our services include administration of prescribed medications, iron infusions, vitamin therapy, and hydration treatments.",
      "All infusions are administered by qualified registered nurses with extensive experience in IV therapy. We ensure proper monitoring throughout the treatment and provide detailed documentation for referring doctors."
    ],
    bullets: [
      "Iron infusions",
      "Vitamin & nutrient infusions",
      "Medication infusions",
      "Hydration therapy",
      "Ketamine infusions (with appropriate protocols)"
    ],
    image: serviceInfusion,
    reverse: false
  },
  {
    id: "wound",
    title: "Advanced Wound Care",
    description: [
      "Our wound care service provides professional assessment and treatment of various wound types. We use evidence-based techniques and advanced dressings to promote optimal healing.",
      "Whether you have a surgical wound, chronic ulcer, or other wound requiring professional care, our experienced nurses can provide the treatment you need."
    ],
    bullets: [
      "Wound assessment and evaluation",
      "Dressing changes",
      "Post-surgical wound care",
      "Chronic wound management",
      "Diabetic wound care"
    ],
    image: serviceWound,
    reverse: true
  },
  {
    id: "stoma",
    title: "Stoma Care & Patient Support",
    description: [
      "Living with a stoma can be challenging, but with the right support and care, patients can maintain a high quality of life. Our stoma care service provides both clinical care and patient education.",
      "We offer ongoing support to help patients manage their stoma with confidence, including appliance fitting, skin care, and troubleshooting common issues."
    ],
    bullets: [
      "Stoma assessment and care",
      "Appliance fitting and advice",
      "Skin care management",
      "Patient education and support",
      "Troubleshooting common issues"
    ],
    image: serviceStoma,
    reverse: false
  }
];

const Services = () => {
  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl lg:text-[57.6px] font-bold text-white mb-4">
            OUR SERVICES
          </h1>
          <p className="text-lg text-white/80 italic max-w-2xl mx-auto">
            Professional nursing care in a comfortable, out-of-hospital environment.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="space-y-16 lg:space-y-24">
            {services.map((service) => (
              <div 
                key={service.id}
                id={service.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center scroll-mt-24 ${
                  service.reverse ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Image */}
                <div className={service.reverse ? "lg:col-start-2" : ""}>
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-auto shadow-lg"
                  />
                </div>

                {/* Content */}
                <div className={service.reverse ? "lg:col-start-1" : ""}>
                  <h2 className="font-heading text-2xl lg:text-[32px] font-bold text-foreground mb-6">
                    {service.title}
                  </h2>
                  
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

      {/* Additional Services Note */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Other Nursing Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            In addition to our main services, we also provide general nursing procedures 
            such as injections, catheter care, and other treatments as prescribed by 
            your doctor. Contact us to discuss your specific needs.
          </p>
          <Link 
            to="/contact" 
            className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Services;
