import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/magic/reveal";
import { getLead } from "@/lib/magic/store";

export const metadata = {
  title: "Your Brand DNA — Easy Micro SaaS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MagicResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <Reveal result={lead.result} id={id} />
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to put it to work?</h2>
          <Link href={`/signup?lead=${id}`} className="mt-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            Start for £49.95/mo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
