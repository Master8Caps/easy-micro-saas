import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { StartFlow } from "@/components/magic/start-flow";

export const metadata = {
  title: "See your Brand DNA — Easy Micro SaaS",
  description: "Enter your website and get your brand DNA, customer avatars, and sample posts — free.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  return (
    <>
      <Navbar />
      <main>
        <StartFlow initialUrl={url ?? ""} />
      </main>
      <Footer />
    </>
  );
}
