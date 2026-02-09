import PublicLayout from "@/components/layout/PublicLayout";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import ivTrainingImg from "@/assets/iv-training-course.webp";
import CourseBookingForm from "@/components/training/CourseBookingForm";
import { useTrainingCourses } from "@/hooks/useTrainingCourses";

const IVTraining = () => {
  const { data: courses } = useTrainingCourses();
  const ivCourse = courses?.find((c) => c.name.toLowerCase().includes("iv"));
  const curriculum = [
    "Anatomy and physiology of veins",
    "Indications and contraindications for IV therapy",
    "Types of IV access devices",
    "Infection prevention and control",
    "Vein selection and assessment",
    "Cannulation technique",
    "Securing and dressing the IV site",
    "Troubleshooting common problems",
    "Recognition of complications",
    "Management of adverse events",
    "Documentation requirements"
  ];

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl lg:text-[57.6px] font-bold text-white mb-4">
            IV LINE INSERTION TRAINING
          </h1>
          <p className="text-lg text-white/80 italic max-w-2xl mx-auto">
            Comprehensive hands-on training for healthcare professionals
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Image */}
            <div>
              <img 
                src={ivTrainingImg} 
                alt="IV Line Insertion Training Course"
                className="w-full h-auto shadow-lg"
              />
            </div>

            {/* Content */}
            <div>
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Professional IV Cannulation Course
              </h2>
              
              <div className="space-y-4 text-muted-foreground mb-8">
                <p>
                  This comprehensive one-day course is designed for nurses and healthcare 
                  professionals who wish to gain competency in peripheral IV cannulation.
                </p>
                <p>
                  The course combines theoretical knowledge with extensive practical training 
                  using simulation models, followed by competency assessment. Upon successful 
                  completion, participants will receive a Certificate of Competency and CPD points.
                </p>
              </div>

              {/* Grey box with curriculum */}
              <div className="bg-secondary p-6 lg:p-8 mb-8">
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">
                  This on-demand training covers:
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
                <strong>Note:</strong> This course is limited to 8 participants to ensure 
                personalised attention and adequate practice time. Contact us for pricing 
                and available dates.
              </p>

              {ivCourse ? (
                <CourseBookingForm courseId={ivCourse.id} courseName={ivCourse.name} />
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

export default IVTraining;
