import type { MagicResult } from "@/lib/magic/types";
import { BrandDna } from "./brand-dna";
import { AvatarCards } from "./avatar-cards";
import { BrandedPostCarousel } from "./branded-post-carousel";

export function Reveal({ result }: { result: MagicResult }) {
  return (
    <div className="flex flex-col gap-12">
      {/* Centre stage: the branded posts lead. */}
      <section>
        <h2 className="mb-6 text-center text-xl font-bold tracking-tight">Sample posts, in your brand</h2>
        <BrandedPostCarousel posts={result.samplePosts} brand={result.brand} />
      </section>

      {/* Supporting cards beneath. */}
      <section className="flex flex-col gap-10">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Your Brand DNA</h3>
          <BrandDna brand={result.brand} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Who to target</h3>
          <AvatarCards avatars={result.avatars} />
        </div>
      </section>
    </div>
  );
}
