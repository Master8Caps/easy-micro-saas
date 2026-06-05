import { AnimateOnScroll } from "./animate-on-scroll";
import { ShowcaseFrame } from "./showcase/showcase-frame";
import {
  SwipeCardMock,
  ContentQueueMock,
  AdSetMock,
  BrandDnaMock,
} from "./showcase/mockups";

// Each entry renders a code mockup by default. To swap in a real screenshot
// later, add `image: "/showcase/<file>.png"` to that entry — nothing else
// changes. See docs/native.md.
const visuals = [
  {
    key: "swipe",
    label: "Tinder for social",
    mock: <SwipeCardMock />,
    image: undefined as string | undefined,
    className: "md:row-span-2",
  },
  {
    key: "dna",
    label: "Brand DNA & avatars",
    mock: <BrandDnaMock />,
    image: undefined as string | undefined,
    className: "md:col-span-2",
  },
  {
    key: "queue",
    label: "Content queue",
    mock: <ContentQueueMock />,
    image: undefined as string | undefined,
    className: "",
  },
  {
    key: "ads",
    label: "Auto-built ad sets",
    mock: <AdSetMock />,
    image: undefined as string | undefined,
    className: "",
  },
];

export function Showcase() {
  return (
    <section className="relative px-6 pb-12 md:pb-20">
      <div className="relative mx-auto max-w-5xl">
        <AnimateOnScroll>
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            A peek inside
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={80}>
          <div className="grid gap-4 md:auto-rows-fr md:grid-cols-3">
            {visuals.map((v) => (
              <ShowcaseFrame
                key={v.key}
                label={v.label}
                image={v.image}
                className={v.className}
              >
                {v.mock}
              </ShowcaseFrame>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
