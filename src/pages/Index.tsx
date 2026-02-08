import PublicLayout from "@/components/layout/PublicLayout";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ServicesSection from "@/components/home/ServicesSection";
import TrainingSection from "@/components/home/TrainingSection";

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <TrainingSection />
    </PublicLayout>
  );
};

export default Index;
