import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Value } from "@/components/value";
import { HowItWorks } from "@/components/how-it-works";
import { Proof } from "@/components/proof";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

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
        <CTA />
      </main>
      <Footer />
    </>
  );
}
