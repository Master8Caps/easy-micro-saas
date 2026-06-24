import { CalmNav } from "./calm-nav";
import { CalmHero } from "./calm-hero";
import { CalmMagic } from "./calm-magic";
import { CalmEmailGate } from "./calm-email-gate";
import { CalmBreadth } from "./calm-breadth";
import { CalmSwipe } from "./calm-swipe";
import { CalmPricing } from "./calm-pricing";
import { CalmBlog } from "./calm-blog";
import { CalmFooter } from "./calm-footer";

export function CalmHome() {
  return (
    <>
      <CalmNav />
      <main>
        <CalmHero />
        <CalmMagic />
        <CalmEmailGate />
        <CalmBreadth />
        <CalmSwipe />
        <CalmPricing />
        <CalmBlog />
      </main>
      <CalmFooter />
    </>
  );
}
