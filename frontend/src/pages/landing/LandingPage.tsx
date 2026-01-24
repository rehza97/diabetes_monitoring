import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { BackToTop } from "@/components/shared/BackToTop";
import { SkipLinks } from "@/components/shared/SkipLinks";
import { useTheme } from "@/context/ThemeContext";
import { HeroSection } from "./sections/HeroSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { ScreenshotsSection } from "./sections/ScreenshotsSection";
import { StatisticsSection } from "./sections/StatisticsSection";
import { PricingSection } from "./sections/PricingSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { FAQSection } from "./sections/FAQSection";
import { CTASection } from "./sections/CTASection";

export function LandingPage() {
  const { setTheme } = useTheme();

  // Force light theme for landing page according to plan.md
  useEffect(() => {
    setTheme("light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, [setTheme]);

  return (
    <AppLayout>
      <SkipLinks />
      <main id="main-content">
        <HeroSection />
        <AnimatedSection animation="fade-in">
          <FeaturesSection />
        </AnimatedSection>
        <AnimatedSection animation="slide-up">
          <HowItWorksSection />
        </AnimatedSection>
        <AnimatedSection animation="fade-in">
          <ScreenshotsSection />
        </AnimatedSection>
        <AnimatedSection animation="slide-up">
          <StatisticsSection />
        </AnimatedSection>
        <AnimatedSection animation="fade-in">
          <PricingSection />
        </AnimatedSection>
        <AnimatedSection animation="slide-up">
          <TestimonialsSection />
        </AnimatedSection>
        <AnimatedSection animation="fade-in">
          <FAQSection />
        </AnimatedSection>
        <AnimatedSection animation="slide-up">
          <CTASection />
        </AnimatedSection>
      </main>
      <BackToTop />
    </AppLayout>
  );
}
