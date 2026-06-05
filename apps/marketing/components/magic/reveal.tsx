import type { MagicResult } from "@/lib/magic/types";
import { BrandDna } from "./brand-dna";
import { AvatarCards } from "./avatar-cards";
import { BrandedPost } from "./branded-post";

export function Reveal({ result }: { result: MagicResult }) {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Your Brand DNA</h2>
        <BrandDna brand={result.brand} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Who to target</h2>
        <AvatarCards avatars={result.avatars} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Sample posts, in your brand</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.samplePosts.map((p, i) => (
            <BrandedPost key={i} post={p} brand={result.brand} />
          ))}
        </div>
      </section>
    </div>
  );
}
