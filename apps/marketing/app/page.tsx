import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Problem } from "@/components/problem";
import { Value } from "@/components/value";
import { HowItWorks } from "@/components/how-it-works";
import { Proof } from "@/components/proof";
import { BlogTeaser } from "@/components/blog-teaser";
import { Pricing } from "@/components/pricing";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { SITE_VARIANT } from "@/lib/variant";
import { CalmHome } from "@/components/home/calm/calm-home";

// Revalidate so the blog teaser picks up newly published posts.
export const revalidate = 60;

export default function HomePage() {
  if (SITE_VARIANT === "calm") return <CalmHome />;

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Showcase />
        <Problem />
        <Value />
        <HowItWorks />
        <Proof />
        <BlogTeaser />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
