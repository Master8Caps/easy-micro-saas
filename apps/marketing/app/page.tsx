import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Value } from "@/components/value";
import { HowItWorks } from "@/components/how-it-works";
import { Proof } from "@/components/proof";
import { BlogTeaser } from "@/components/blog-teaser";
import { Pricing } from "@/components/pricing";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

// Revalidate so the blog teaser picks up newly published posts.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
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
