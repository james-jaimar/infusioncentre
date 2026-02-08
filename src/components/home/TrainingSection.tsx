import { Link } from "react-router-dom";
import ivTrainingImg from "@/assets/iv-training-course.webp";
import anaphylaxisImg from "@/assets/anaphylaxis-training.webp";

const courses = [
  {
    title: "IV Line Insertion Training",
    description: "Comprehensive training course for healthcare professionals on peripheral IV cannulation techniques. This on-demand training covers theory, practical skills, and competency assessment.",
    image: ivTrainingImg,
    href: "/iv-training"
  },
  {
    title: "Anaphylaxis Training",
    description: "Essential training on recognising and managing anaphylactic reactions in clinical settings. Learn emergency protocols and adrenaline administration.",
    image: anaphylaxisImg,
    href: "/anaphylaxis-training"
  }
];

const TrainingSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl lg:text-[48px] font-bold text-foreground text-center mb-16">
          Training & Education
        </h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div 
              key={course.title}
              className="flex flex-col md:flex-row bg-secondary overflow-hidden"
            >
              {/* Image */}
              <div className="md:w-2/5 flex-shrink-0">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 md:h-full object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <h3 className="font-heading text-xl lg:text-2xl font-bold text-foreground mb-4">
                  {course.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {course.description}
                </p>
                <Link 
                  to={course.href}
                  className="text-primary font-medium hover:underline inline-flex items-center gap-2"
                >
                  Find out more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrainingSection;
