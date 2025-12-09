import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection, FeaturesSection, CTASection } from "@/components/landing";
import { FeaturedGuides } from "@/components/guides";
import { getFeaturedGuides } from "@/lib/guides";

export default function Home() {
  const featuredGuides = getFeaturedGuides(3);

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FeaturedGuides guides={featuredGuides} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
