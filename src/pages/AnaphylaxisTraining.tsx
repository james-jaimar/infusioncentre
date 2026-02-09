import PublicLayout from "@/components/layout/PublicLayout";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import anaphylaxisImg from "@/assets/anaphylaxis-training.webp";
import CourseBookingForm from "@/components/training/CourseBookingForm";
import { useTrainingCourses } from "@/hooks/useTrainingCourses";

const AnaphylaxisTraining = () => {
  const { data: courses } = useTrainingCourses();
  const anaphylaxisCourse = courses?.find((c) => c.name.toLowerCase().includes("anaphylaxis"));
  const curriculum = [
    "Understanding anaphylaxis pathophysiology",
    "Recognising signs and symptoms",
    "Differentiating anaphylaxis from other reactions",
    "Risk factors and triggers",
    "Immediate management protocol",
    "Adrenaline administration (routes and dosing)",
    "Airway management basics",
    "Calling for help and escalation",
    "Monitoring after treatment",
    "Biphasic reactions awareness",
    "Documentation requirements"
  ];

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl lg:text-[57.6px] font-bold text-white mb-4">
            ANAPHYLAXIS TRAINING
          </h1>
          <p className="text-lg text-white/80 italic max-w-2xl mx-auto">
            Essential emergency response training for healthcare professionals
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Image */}
            <div>
              <img 
                src={anaphylaxisImg} 
                alt="Anaphylaxis Training Course"
                className="w-full h-auto shadow-lg"
              />
            </div>

            {/* Content */}
            <div>
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Anaphylaxis Recognition & Management
              </h2>
              
              <div className="space-y-4 text-muted-foreground mb-8">
                <p>
                  This half-day course provides essential training on the recognition and 
                  management of anaphylaxis. Anaphylaxis is a life-threatening emergency, 
                  and every healthcare professional should be trained to recognise and 
                  respond appropriately.
                </p>
                <p>
                  Participants will learn to identify the signs and symptoms of anaphylactic 
                  reactions, administer appropriate emergency treatment, and manage patients 
                  until further medical assistance arrives.
                </p>
              </div>

              {/* Grey box with curriculum */}
              <div className="bg-secondary p-6 lg:p-8 mb-8">
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  This training covers:
                </h3>
                <ul className="space-y-2">
                  {curriculum.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-foreground">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                <strong>Note:</strong> Upon completion, participants will receive a 
                Certificate of Completion and CPD points. Contact us for pricing 
                and available dates.
              </p>

              {anaphylaxisCourse ? (
                <CourseBookingForm courseId={anaphylaxisCourse.id} courseName={anaphylaxisCourse.name} />
              ) : (
                <Link 
                  to="/contact" 
                  className="inline-block bg-primary text-white px-8 py-4 font-body font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors"
                >
                  Enquire Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default AnaphylaxisTraining;
