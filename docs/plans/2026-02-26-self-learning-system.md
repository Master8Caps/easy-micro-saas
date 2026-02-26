# Self-Learning System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add engagement tracking, thumbs up/down ratings, composite scoring, and performance-aware regeneration to the content marketing platform.

**Architecture:** New columns on `content_pieces` table for rating + engagement data. New server actions for updating ratings/engagement and extracting learning insights. Existing brain and content generation prompts enhanced with a "Performance Context" section built from composite scores. Two new UI components (rating buttons + engagement popover) added inline on existing content card surfaces.

**Tech Stack:** Next.js 15 (App Router), Supabase (Postgres), TypeScript, Tailwind CSS, Anthropic Claude API

**Design Doc:** `docs/plans/2026-02-26-self-learning-system-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00016_self_learning_columns.sql`

**Step 1: Write the migration**

```sql
-- Self-learning system: rating + engagement tracking on content_pieces
ALTER TABLE public.content_pieces
  ADD COLUMN rating SMALLINT DEFAULT NULL
    CONSTRAINT content_pieces_rating_check CHECK (rating IN (-1, 0, 1)),
  ADD COLUMN engagement_views INT DEFAULT NULL,
  ADD COLUMN engagement_likes INT DEFAULT NULL,
  ADD COLUMN engagement_comments INT DEFAULT NULL,
  ADD COLUMN engagement_shares INT DEFAULT NULL,
  ADD COLUMN engagement_logged_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient filtering of pieces with engagement data
CREATE INDEX idx_content_pieces_engagement
  ON public.content_pieces (product_id)
  WHERE engagement_logged_at IS NOT NULL OR rating IS NOT NULL;
```

**Step 2: Apply the migration**

Run in Supabase SQL Editor or via CLI. Verify with:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content_pieces'
  AND column_name IN ('rating', 'engagement_views', 'engagement_likes', 'engagement_comments', 'engagement_shares', 'engagement_logged_at');
```

Expected: 6 rows, all nullable.

**Step 3: Commit**

```bash
git add supabase/migrations/00016_self_learning_columns.sql
git commit -m "feat: add rating and engagement columns to content_pieces (migration 00016)"
```

---

### Task 2: Rating Server Action

**Files:**
- Modify: `apps/app/server/actions/content.ts` (add at end of file, after existing exports)

**Step 1: Add the `updateContentRating` server action**

Add to the end of `apps/app/server/actions/content.ts`:

```typescript
// ── Update content piece rating ──────────────────────
export async function updateContentRating(
  pieceId: string,
  rating: -1 | 0 | 1,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ rating })
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat: add updateContentRating server action"
```

---

### Task 3: Engagement Server Action

**Files:**
- Modify: `apps/app/server/actions/content.ts` (add after rating action)

**Step 1: Add the `updateContentEngagement` server action**

Add after `updateContentRating` in `apps/app/server/actions/content.ts`:

```typescript
// ── Update content piece engagement metrics ──────────
export async function updateContentEngagement(
  pieceId: string,
  engagement: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
  },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({
      engagement_views: engagement.views ?? null,
      engagement_likes: engagement.likes ?? null,
      engagement_comments: engagement.comments ?? null,
      engagement_shares: engagement.shares ?? null,
      engagement_logged_at: new Date().toISOString(),
    })
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
  return { success: true };
}
```

**Step 2: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat: add updateContentEngagement server action"
```

---

### Task 4: Composite Scoring in `score-utils.ts`

**Files:**
- Modify: `apps/app/lib/score-utils.ts` (add composite scoring function)

**Step 1: Add composite scoring helper**

Add to end of `apps/app/lib/score-utils.ts`:

```typescript
export interface CompositeInput {
  clicks: number;
  maxClicks: number;
  engagementViews: number | null;
  engagementLikes: number | null;
  engagementComments: number | null;
  engagementShares: number | null;
  maxEngagementRaw: number;
  rating: number | null; // -1, 0, or 1
}

export function computeEngagementRaw(
  views: number | null,
  likes: number | null,
  comments: number | null,
  shares: number | null,
): number {
  return (
    (views ?? 0) * 1 +
    (likes ?? 0) * 3 +
    (comments ?? 0) * 5 +
    (shares ?? 0) * 4
  );
}

export function computeCompositeScore(input: CompositeInput): number {
  // Click signal (40%) — normalized 0-100
  const clickSignal =
    input.maxClicks > 0
      ? (input.clicks / input.maxClicks) * 100
      : 0;

  // Engagement signal (40%) — normalized 0-100
  const engagementRaw = computeEngagementRaw(
    input.engagementViews,
    input.engagementLikes,
    input.engagementComments,
    input.engagementShares,
  );
  const engagementSignal =
    input.maxEngagementRaw > 0
      ? (engagementRaw / input.maxEngagementRaw) * 100
      : 0;

  // Rating signal (20%) — thumbs up=100, neutral=50, thumbs down=0
  const ratingSignal =
    input.rating === 1 ? 100 : input.rating === -1 ? 0 : 50;

  const composite =
    clickSignal * 0.4 + engagementSignal * 0.4 + ratingSignal * 0.2;

  return Math.round(composite);
}
```

**Step 2: Commit**

```bash
git add apps/app/lib/score-utils.ts
git commit -m "feat: add composite scoring helpers to score-utils"
```

---

### Task 5: Update `loadPerformanceScores` for Composite Scoring

**Files:**
- Modify: `apps/app/server/actions/performance.ts`

**Step 1: Update imports and interfaces**

At the top of `performance.ts`, update the CampaignScore interface to include engagement and composite data. Add content piece data to the query.

The key changes to `loadPerformanceScores`:

1. After fetching links (current step 2, ~line 67), add a query for content pieces with engagement/rating data:

```typescript
  // 2b. Fetch content pieces with engagement + rating data
  const { data: contentPieces } = await supabase
    .from("content_pieces")
    .select("id, campaign_id, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at")
    .eq("product_id", input.productId);
```

2. After the `clicksByLink` section (~line 90), aggregate engagement per campaign:

```typescript
  // 3b. Aggregate engagement per campaign
  const campaignEngagement = new Map<string, { raw: number; rating: number; ratingCount: number }>();
  for (const piece of contentPieces ?? []) {
    if (!piece.campaign_id) continue;
    // Filter by period if applicable
    if (period !== "all" && piece.engagement_logged_at) {
      const loggedAt = new Date(piece.engagement_logged_at);
      const daysAgo = period === "7d" ? 7 : 30;
      const since = new Date();
      since.setDate(since.getDate() - daysAgo);
      if (loggedAt < since) continue;
    }
    const raw = computeEngagementRaw(
      piece.engagement_views,
      piece.engagement_likes,
      piece.engagement_comments,
      piece.engagement_shares,
    );
    const current = campaignEngagement.get(piece.campaign_id) ?? { raw: 0, rating: 0, ratingCount: 0 };
    current.raw += raw;
    if (piece.rating !== null) {
      current.rating += piece.rating;
      current.ratingCount += 1;
    }
    campaignEngagement.set(piece.campaign_id, current);
  }
```

3. Update the campaign score building section (~line 106-124) to use composite scoring:

```typescript
  // Compute max values for normalization
  const maxCampaignClicks = Math.max(
    ...Array.from(campaignClicks.values()).map((v) => v.clicks),
    1,
  );
  const maxCampaignEngagement = Math.max(
    ...Array.from(campaignEngagement.values()).map((v) => v.raw),
    1,
  );

  const campaignScores: CampaignScore[] = campaigns.map((c) => {
    const clickData = campaignClicks.get(c.id) ?? { clicks: 0, linkCount: 0 };
    const engData = campaignEngagement.get(c.id) ?? { raw: 0, rating: 0, ratingCount: 0 };
    const avgRating = engData.ratingCount > 0 ? engData.rating / engData.ratingCount : null;
    // Map avg rating (-1 to 1) to the -1/0/1 scale for composite
    const ratingForComposite = avgRating !== null ? (avgRating > 0.3 ? 1 : avgRating < -0.3 ? -1 : 0) : null;

    return {
      campaignId: c.id,
      avatarId: c.avatar_id,
      channel: c.channel,
      angle: c.angle,
      category: c.category,
      totalClicks: clickData.clicks,
      linkCount: clickData.linkCount,
      engagementRaw: engData.raw,
      normalizedScore: computeCompositeScore({
        clicks: clickData.clicks,
        maxClicks: maxCampaignClicks,
        engagementViews: null, // already aggregated as raw
        engagementLikes: null,
        engagementComments: null,
        engagementShares: null,
        maxEngagementRaw: maxCampaignEngagement,
        rating: ratingForComposite,
      }),
    };
  });
```

Note: Since we're aggregating engagement at campaign level (sum of all pieces), pass `engagementRaw` directly. Modify `computeCompositeScore` to accept an optional pre-computed `engagementRawOverride` or compute at the aggregated level inline. The simplest approach: compute the engagement signal inline here:

```typescript
    const engagementSignal = maxCampaignEngagement > 0 ? (engData.raw / maxCampaignEngagement) * 100 : 0;
    const clickSignal = maxCampaignClicks > 0 ? (clickData.clicks / maxCampaignClicks) * 100 : 0;
    const ratingSignal = ratingForComposite === 1 ? 100 : ratingForComposite === -1 ? 0 : 50;
    const compositeScore = Math.round(clickSignal * 0.4 + engagementSignal * 0.4 + ratingSignal * 0.2);
```

4. Update `CampaignScore` interface to include `engagementRaw: number`.

5. Update avatar and channel aggregation to use the composite `normalizedScore` (these already aggregate from campaign scores, so the composite flows through automatically).

6. Update `hasData` check: `hasData: totalClicks > 0 || Array.from(campaignEngagement.values()).some(e => e.raw > 0)`

**Step 2: Add import**

At the top of `performance.ts`:
```typescript
import { computeEngagementRaw } from "@/lib/score-utils";
```

**Step 3: Commit**

```bash
git add apps/app/server/actions/performance.ts apps/app/lib/score-utils.ts
git commit -m "feat: update performance scoring to use composite scores (clicks + engagement + rating)"
```

---

### Task 6: Learning Insights Server Action

**Files:**
- Create: `apps/app/server/actions/learning.ts`

**Step 1: Create the `loadLearningInsights` action**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { computeEngagementRaw } from "@/lib/score-utils";

export interface LearningInsight {
  topPerformers: {
    angle: string;
    hook: string;
    channel: string;
    contentType: string;
    avatarName: string;
    painPoints: string[];
    bodySnippet: string;
    compositeScore: number;
    clicks: number;
    engagementRaw: number;
  }[];
  patterns: {
    topPainPoints: string[];
    topChannels: string[];
    topContentTypes: string[];
    styleCues: string[];
  };
  underperformers: {
    angle: string;
    channel: string;
    compositeScore: number;
  }[];
  thumbsDownPieces: {
    angle: string;
    channel: string;
    contentType: string;
  }[];
  totalPiecesWithSignals: number;
}

export async function loadLearningInsights(
  productId: string,
): Promise<LearningInsight | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch content pieces with engagement, rating, campaign + avatar info
  const { data: pieces } = await supabase
    .from("content_pieces")
    .select(`
      id, type, title, body, rating,
      engagement_views, engagement_likes, engagement_comments, engagement_shares,
      campaigns!inner(angle, hook, channel, avatar_id),
      avatars!inner(name, pain_points),
      links(click_count)
    `)
    .eq("product_id", productId)
    .eq("archived", false);

  if (!pieces || pieces.length === 0) return null;

  // Score each piece
  type ScoredPiece = (typeof pieces)[number] & {
    compositeScore: number;
    clicks: number;
    engagementRaw: number;
  };

  const scored: ScoredPiece[] = [];

  // First pass: compute raw values to find maxes
  const rawValues = pieces.map((p) => {
    const clicks = (p.links ?? []).reduce((sum, l) => sum + (l.click_count ?? 0), 0);
    const engRaw = computeEngagementRaw(
      p.engagement_views,
      p.engagement_likes,
      p.engagement_comments,
      p.engagement_shares,
    );
    return { piece: p, clicks, engRaw };
  });

  const maxClicks = Math.max(...rawValues.map((v) => v.clicks), 1);
  const maxEng = Math.max(...rawValues.map((v) => v.engRaw), 1);

  // Filter to pieces with any signal data
  for (const { piece, clicks, engRaw } of rawValues) {
    const hasSignal =
      clicks > 0 ||
      engRaw > 0 ||
      piece.rating !== null;

    if (!hasSignal) continue;

    const clickSignal = (clicks / maxClicks) * 100;
    const engSignal = (engRaw / maxEng) * 100;
    const ratingSignal = piece.rating === 1 ? 100 : piece.rating === -1 ? 0 : 50;
    const compositeScore = Math.round(
      clickSignal * 0.4 + engSignal * 0.4 + ratingSignal * 0.2,
    );

    scored.push({ ...piece, compositeScore, clicks, engagementRaw: engRaw });
  }

  if (scored.length === 0) return null;

  // Sort by composite score descending
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  // Top performers (score >= 70)
  const topPerformers = scored
    .filter((p) => p.compositeScore >= 70)
    .slice(0, 5)
    .map((p) => ({
      angle: p.campaigns?.angle ?? "",
      hook: p.campaigns?.hook ?? "",
      channel: p.campaigns?.channel ?? "",
      contentType: p.type,
      avatarName: p.avatars?.name ?? "",
      painPoints: p.avatars?.pain_points ?? [],
      bodySnippet: p.body.slice(0, 300),
      compositeScore: p.compositeScore,
      clicks: p.clicks,
      engagementRaw: p.engagementRaw,
    }));

  // Underperformers (score <= 30, excluding thumbs-down which get their own section)
  const underperformers = scored
    .filter((p) => p.compositeScore <= 30 && p.rating !== -1)
    .slice(-5)
    .map((p) => ({
      angle: p.campaigns?.angle ?? "",
      channel: p.campaigns?.channel ?? "",
      compositeScore: p.compositeScore,
    }));

  // Thumbs-down pieces (explicitly rejected regardless of other metrics)
  const thumbsDownPieces = scored
    .filter((p) => p.rating === -1)
    .map((p) => ({
      angle: p.campaigns?.angle ?? "",
      channel: p.campaigns?.channel ?? "",
      contentType: p.type,
    }));

  // Pattern extraction from top 50% of scored pieces
  const topHalf = scored.slice(0, Math.ceil(scored.length / 2));

  // Top pain points (most frequent across top pieces)
  const painPointCounts = new Map<string, number>();
  for (const p of topHalf) {
    for (const pp of p.avatars?.pain_points ?? []) {
      painPointCounts.set(pp, (painPointCounts.get(pp) ?? 0) + 1);
    }
  }
  const topPainPoints = Array.from(painPointCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pp]) => pp);

  // Top channels
  const channelCounts = new Map<string, number>();
  for (const p of topHalf) {
    const ch = p.campaigns?.channel ?? "";
    if (ch) channelCounts.set(ch, (channelCounts.get(ch) ?? 0) + 1);
  }
  const topChannels = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ch]) => ch);

  // Top content types
  const typeCounts = new Map<string, number>();
  for (const p of topHalf) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
  }
  const topContentTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // Style cues from top performers' body text
  const styleCues: string[] = [];
  const topBodies = topPerformers.map((p) => p.bodySnippet).join(" ");
  if (topBodies.includes("?")) styleCues.push("Question-led hooks");
  if (topBodies.split("\n").some((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))) {
    styleCues.push("Bullet-point formatting");
  }
  const avgLength = topPerformers.length > 0
    ? topPerformers.reduce((sum, p) => sum + p.bodySnippet.length, 0) / topPerformers.length
    : 0;
  if (avgLength < 150) styleCues.push("Short, punchy format");
  else if (avgLength > 250) styleCues.push("Longer, detailed format");

  return {
    topPerformers,
    patterns: {
      topPainPoints,
      topChannels,
      topContentTypes,
      styleCues,
    },
    underperformers,
    thumbsDownPieces,
    totalPiecesWithSignals: scored.length,
  };
}
```

**Step 2: Commit**

```bash
git add apps/app/server/actions/learning.ts
git commit -m "feat: add loadLearningInsights server action for pattern extraction"
```

---

### Task 7: Enhance Brain Generation Prompt

**Files:**
- Modify: `apps/app/server/actions/brain.ts`

**Step 1: Add learning context builder function**

Add before the `buildPrompt` function (~line 285):

```typescript
import { loadLearningInsights, type LearningInsight } from "./learning";

function buildPerformanceContext(insights: LearningInsight): string {
  const sections: string[] = [];

  // Sparse data caveat
  if (insights.totalPiecesWithSignals < 5) {
    sections.push("NOTE: Limited performance data available — treat these insights as directional, not definitive.\n");
  }

  // Top performers
  if (insights.topPerformers.length > 0) {
    const topLines = insights.topPerformers.map(
      (p) => `- Avatar "${p.avatarName}" / "${p.angle}" on ${p.channel} (${p.clicks} clicks, engagement score ${p.engagementRaw})`,
    );
    sections.push(`Top performing campaigns:\n${topLines.join("\n")}`);
  }

  // Patterns
  if (insights.patterns.topPainPoints.length > 0) {
    sections.push(`Pain points that resonate most: ${insights.patterns.topPainPoints.join(", ")}`);
  }
  if (insights.patterns.topChannels.length > 0) {
    sections.push(`Best performing channels: ${insights.patterns.topChannels.join(", ")}`);
  }
  if (insights.patterns.topContentTypes.length > 0) {
    sections.push(`Best content types: ${insights.patterns.topContentTypes.join(", ")}`);
  }
  if (insights.patterns.styleCues.length > 0) {
    sections.push(`Winning content style: ${insights.patterns.styleCues.join(", ")}`);
  }

  // What to avoid
  const avoidLines: string[] = [];
  for (const u of insights.underperformers) {
    avoidLines.push(`- "${u.angle}" on ${u.channel} (score: ${u.compositeScore}/100)`);
  }
  for (const td of insights.thumbsDownPieces) {
    avoidLines.push(`- "${td.angle}" on ${td.channel} (user rejected this style)`);
  }
  if (avoidLines.length > 0) {
    sections.push(`What to avoid:\n${avoidLines.join("\n")}`);
  }

  return `

## Performance Context from Previous Campaigns
Your previous output was tested in the real world. Here's what we learned:

${sections.join("\n\n")}

Use these insights when generating new avatars and campaigns. Evolve what works, retire what doesn't, and experiment with new angles informed by these patterns.`;
}
```

**Step 2: Inject performance context into `generateBrain`**

In the `generateBrain` function, after fetching the product data but before calling `buildPrompt` (~line 100), add:

```typescript
  // Load learning insights for performance-aware generation
  const insights = await loadLearningInsights(input.productId);
```

Then after the `buildPrompt` call, append the context:

```typescript
  let prompt = buildPrompt(product);
  if (insights) {
    prompt += buildPerformanceContext(insights);
  }
```

**Step 3: Commit**

```bash
git add apps/app/server/actions/brain.ts
git commit -m "feat: inject performance context into brain generation prompt"
```

---

### Task 8: Enhance Content Generation Prompt

**Files:**
- Modify: `apps/app/server/actions/content.ts`

**Step 1: Add content-level performance context builder**

Add before `buildContentPrompt` (~line 70):

```typescript
import { loadLearningInsights, type LearningInsight } from "./learning";

function buildContentPerformanceContext(insights: LearningInsight): string {
  const sections: string[] = [];

  if (insights.totalPiecesWithSignals < 5) {
    sections.push("NOTE: Limited performance data — treat as directional.\n");
  }

  // Top performing content examples
  if (insights.topPerformers.length > 0) {
    const examples = insights.topPerformers.slice(0, 3).map(
      (p) => `- "${p.bodySnippet}..." (${p.clicks} clicks, engagement: ${p.engagementRaw})`,
    );
    sections.push(`Top performing content for tone/style reference:\n${examples.join("\n")}`);
  }

  // Patterns
  if (insights.patterns.styleCues.length > 0) {
    sections.push(`Winning patterns: ${insights.patterns.styleCues.join(", ")}`);
  }

  // Avoid
  const avoidLines: string[] = [];
  for (const td of insights.thumbsDownPieces) {
    avoidLines.push(`- "${td.angle}" style on ${td.channel}`);
  }
  for (const u of insights.underperformers.slice(0, 3)) {
    avoidLines.push(`- "${u.angle}" approach on ${u.channel}`);
  }
  if (avoidLines.length > 0) {
    sections.push(`Avoid these styles/approaches:\n${avoidLines.join("\n")}`);
  }

  return `

## What's Working for This Product (Real Performance Data)
${sections.join("\n\n")}

Generate content that builds on these winning patterns while staying fresh — don't copy, evolve.`;
}
```

**Step 2: Inject into `generateContentForCampaign`**

In `generateContentForCampaign`, after building the prompt but before the Claude API call, add:

```typescript
  // Load learning insights for performance-aware content
  const insights = await loadLearningInsights(input.productId);
  if (insights) {
    prompt += buildContentPerformanceContext(insights);
  }
```

This applies to both `buildContentPrompt` and `buildAdContentPrompt` paths. Find where the prompt variable is finalized and append before the API call.

**Step 3: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat: inject performance context into content generation prompt"
```

---

### Task 9: Rating Buttons Component

**Files:**
- Create: `apps/app/components/rating-buttons.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { updateContentRating } from "@/server/actions/content";

export function RatingButtons({
  pieceId,
  initialRating,
}: {
  pieceId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [saving, setSaving] = useState(false);

  async function handleRate(value: -1 | 1) {
    const newRating = rating === value ? 0 : value;
    const prevRating = rating;
    setRating(newRating);
    setSaving(true);
    try {
      const result = await updateContentRating(pieceId, newRating as -1 | 0 | 1);
      if (result.error) {
        setRating(prevRating);
      }
    } catch {
      setRating(prevRating);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleRate(1)}
        disabled={saving}
        className={`rounded p-1 transition-colors ${
          rating === 1
            ? "text-emerald-400 bg-emerald-400/10"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        }`}
        title="Thumbs up"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={rating === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </button>
      <button
        onClick={() => handleRate(-1)}
        disabled={saving}
        className={`rounded p-1 transition-colors ${
          rating === -1
            ? "text-red-400 bg-red-400/10"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        }`}
        title="Thumbs down"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={rating === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/app/components/rating-buttons.tsx
git commit -m "feat: add RatingButtons component (thumbs up/down)"
```

---

### Task 10: Engagement Popover Component

**Files:**
- Create: `apps/app/components/engagement-popover.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { updateContentEngagement } from "@/server/actions/content";

interface EngagementData {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  loggedAt: string | null;
}

export function EngagementPopover({
  pieceId,
  initial,
}: {
  pieceId: string;
  initial: EngagementData;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [views, setViews] = useState(initial.views?.toString() ?? "");
  const [likes, setLikes] = useState(initial.likes?.toString() ?? "");
  const [comments, setComments] = useState(initial.comments?.toString() ?? "");
  const [shares, setShares] = useState(initial.shares?.toString() ?? "");
  const [data, setData] = useState(initial);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const engagement = {
      views: views ? parseInt(views, 10) : null,
      likes: likes ? parseInt(likes, 10) : null,
      comments: comments ? parseInt(comments, 10) : null,
      shares: shares ? parseInt(shares, 10) : null,
    };
    try {
      const result = await updateContentEngagement(pieceId, engagement);
      if (!result.error) {
        setData({
          ...engagement,
          loggedAt: new Date().toISOString(),
        });
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const hasData = data.loggedAt !== null;

  // Summary for inline display
  const summaryParts: string[] = [];
  if (data.views) summaryParts.push(`${data.views} views`);
  if (data.likes) summaryParts.push(`${data.likes} likes`);
  if (data.comments) summaryParts.push(`${data.comments} comments`);
  if (data.shares) summaryParts.push(`${data.shares} shares`);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
          hasData
            ? "text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        }`}
        title={hasData ? summaryParts.join(" · ") : "Log engagement"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        {hasData && summaryParts.length > 0 && (
          <span className="max-w-[120px] truncate">{summaryParts.slice(0, 2).join(" · ")}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-xl border border-white/[0.1] bg-zinc-900 p-4 shadow-xl">
          <p className="mb-3 text-xs font-medium text-zinc-300">Log Engagement</p>
          <div className="space-y-2">
            {[
              { label: "Views", value: views, set: setViews },
              { label: "Likes", value: likes, set: setLikes },
              { label: "Comments", value: comments, set: setComments },
              { label: "Shares", value: shares, set: setShares },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-2">
                <label className="w-20 text-xs text-zinc-500">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/app/components/engagement-popover.tsx
git commit -m "feat: add EngagementPopover component for logging engagement metrics"
```

---

### Task 11: Add Rating + Engagement to Content List Page

**Files:**
- Modify: `apps/app/app/(dashboard)/content/content-list.tsx`

**Step 1: Update the `ContentPieceRow` interface**

In `content-list.tsx` at ~line 19, add the new fields to the interface:

```typescript
interface ContentPieceRow {
  // ... existing fields ...
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  engagement_logged_at: string | null;
}
```

**Step 2: Add imports**

At the top of the file, add:

```typescript
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
```

**Step 3: Add components to the action bar**

In the content card action area (~line 427-441), add RatingButtons and EngagementPopover next to the existing CopyButton. Insert before `<CopyButton>`:

```tsx
<RatingButtons pieceId={piece.id} initialRating={piece.rating} />
{piece.status === "posted" && (
  <EngagementPopover
    pieceId={piece.id}
    initial={{
      views: piece.engagement_views,
      likes: piece.engagement_likes,
      comments: piece.engagement_comments,
      shares: piece.engagement_shares,
      loggedAt: piece.engagement_logged_at,
    }}
  />
)}
```

**Step 4: Update the server query**

The content page's server component that fetches data needs to include the new columns in its Supabase `.select()` query. Find the content page server component and add `rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at` to the select string.

**Step 5: Commit**

```bash
git add apps/app/app/(dashboard)/content/content-list.tsx
git commit -m "feat: add rating buttons and engagement popover to content list page"
```

---

### Task 12: Add Rating + Engagement to Campaign Panel

**Files:**
- Modify: `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx`

**Step 1: Add imports**

```typescript
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
```

**Step 2: Add to content piece action area**

In the campaign panel, each content piece's action bar is at ~line 289-302. Add RatingButtons and EngagementPopover in the action div (the one with `onClick={(e) => e.stopPropagation()}`), before LifecycleAction:

```tsx
<RatingButtons pieceId={piece.id} initialRating={piece.rating} />
{piece.status === "posted" && (
  <EngagementPopover
    pieceId={piece.id}
    initial={{
      views: piece.engagement_views,
      likes: piece.engagement_likes,
      comments: piece.engagement_comments,
      shares: piece.engagement_shares,
      loggedAt: piece.engagement_logged_at,
    }}
  />
)}
```

**Step 3: Update the `loadContentForCampaign` query**

In `apps/app/server/actions/content.ts`, update the `loadContentForCampaign` select (~line 418) to include:
```
rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at
```

**Step 4: Commit**

```bash
git add apps/app/app/(dashboard)/campaigns/campaign-panel.tsx apps/app/server/actions/content.ts
git commit -m "feat: add rating buttons and engagement popover to campaign panel"
```

---

### Task 13: Add Rating + Engagement to Schedule Page

**Files:**
- Modify: `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

**Step 1: Add imports**

```typescript
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
```

**Step 2: Add to the content panel actions**

In the schedule content panel (~line 457-475), add after the LifecycleAction section:

```tsx
<RatingButtons pieceId={piece.id} initialRating={piece.rating} />
{piece.status === "posted" && (
  <EngagementPopover
    pieceId={piece.id}
    initial={{
      views: piece.engagement_views,
      likes: piece.engagement_likes,
      comments: piece.engagement_comments,
      shares: piece.engagement_shares,
      loggedAt: piece.engagement_logged_at,
    }}
  />
)}
```

**Step 3: Update the schedule page's Supabase query**

In the schedule page server component, add the new columns to the `.select()` query for content pieces.

**Step 4: Commit**

```bash
git add apps/app/app/(dashboard)/schedule/schedule-calendar.tsx
git commit -m "feat: add rating buttons and engagement popover to schedule page"
```

---

### Task 14: Update Brain Page Performance Display

**Files:**
- Modify: `apps/app/app/(dashboard)/products/[id]/brain/page.tsx`

**Step 1: Update performance display labels**

On the brain page, avatar cards show performance at ~line 496-528 and campaign cards at ~line 779-791. Update the display text to reflect composite scoring:

For avatar cards, change the click count display to show composite info:
```tsx
// Replace: "{avatarScore.totalClicks} clicks"
// With:
{avatarScore.totalClicks > 0 && `${avatarScore.totalClicks} clicks`}
{avatarScore.totalClicks > 0 && avatarScore.engagementRaw > 0 && " · "}
{avatarScore.engagementRaw > 0 && `${avatarScore.engagementRaw} eng.`}
```

For campaign cards, same pattern:
```tsx
// Replace: "{score.totalClicks} clicks"
// With a richer label showing composite data
```

The `CampaignScore` interface now includes `engagementRaw`, so this data flows through from the updated `loadPerformanceScores`.

**Step 2: Commit**

```bash
git add apps/app/app/(dashboard)/products/[id]/brain/page.tsx
git commit -m "feat: update brain page performance bars to show composite score data"
```

---

### Task 15: Update EMS_PLAN.md

**Files:**
- Modify: `EMS_PLAN.md`

**Step 1: Add self-learning system to Completed Work section**

Add a new section under Completed Work:

```markdown
### App — Self-Learning System (v1)
- [x] Migration 00016: rating + engagement columns on content_pieces
- [x] `updateContentRating()` server action — thumbs up/down (-1/0/1) on any content piece
- [x] `updateContentEngagement()` server action — views, likes, comments, shares with timestamp
- [x] Composite scoring — clicks (40%) + engagement (40%) + rating (20%), normalized 0-100
- [x] `loadLearningInsights()` — pattern extraction from scored content (top performers, patterns, underperformers, thumbs-down)
- [x] Brain generation enhanced — performance context injected into prompt when insights available
- [x] Content generation enhanced — top-performing examples and style patterns injected into prompt
- [x] `RatingButtons` component — thumbs up/down on content cards (content page, campaign panel, schedule)
- [x] `EngagementPopover` component — log views/likes/comments/shares on posted content
- [x] Performance bars on brain page show composite scores (not just clicks)
- [x] Cold start: no context when zero data; sparse data (<5 pieces) gets directional caveat
```

**Step 2: Add test checklist**

Add to Test Checklist section:

```markdown
### Self-Learning System

#### Rating
- [ ] Thumbs up button on content card → turns green, saves to DB
- [ ] Click thumbs up again → clears rating (back to neutral)
- [ ] Thumbs down button → turns red, saves to DB
- [ ] Rating available on draft, approved, scheduled, and posted pieces
- [ ] Rating appears on content page, campaign panel, and schedule page
- [ ] Refresh page → rating persists

#### Engagement Tracking
- [ ] "Log engagement" button appears only on posted content pieces
- [ ] Click button → popover opens with 4 number inputs
- [ ] Enter values → save → popover closes, button shows summary
- [ ] Re-open popover → values pre-populated
- [ ] Update values → save → summary updates
- [ ] Partial input works (only fill in likes, leave others empty)
- [ ] Click outside popover → closes without saving
- [ ] Escape key → closes without saving

#### Composite Scoring
- [ ] Brain page: avatar performance bars reflect composite score (not just clicks)
- [ ] Brain page: campaign performance bars reflect composite score
- [ ] Performance bars update when engagement is logged
- [ ] Performance bars update when rating is given
- [ ] Period toggle still works (All time / 30d / 7d)
- [ ] Product with only engagement data (no clicks) still shows scores
- [ ] Product with only ratings (no clicks, no engagement) still shows scores

#### Learning / Regeneration
- [ ] Regenerate brain with performance data → prompt includes performance context
- [ ] Regenerate brain with sparse data (<5 pieces) → includes directional caveat
- [ ] Regenerate brain with zero data → prompt unchanged (no performance context)
- [ ] Regenerate content with performance data → prompt includes top-performing examples
- [ ] Thumbs-downed content noted in "what to avoid" section of prompt
- [ ] Generated content shows influence of performance data (different angles/tone vs cold start)
```

**Step 3: Move self-learning from "Immediate" to completed and update What's Next**

Update the Immediate section to remove self-learning and regeneration logic items, as they're now done.

**Step 4: Commit**

```bash
git add EMS_PLAN.md
git commit -m "docs: add self-learning system to completed work and test checklist"
```

---

## Task Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `supabase/migrations/00016_self_learning_columns.sql` |
| 2 | Rating server action | `apps/app/server/actions/content.ts` |
| 3 | Engagement server action | `apps/app/server/actions/content.ts` |
| 4 | Composite scoring helpers | `apps/app/lib/score-utils.ts` |
| 5 | Update performance scoring | `apps/app/server/actions/performance.ts` |
| 6 | Learning insights action | `apps/app/server/actions/learning.ts` (new) |
| 7 | Brain prompt enhancement | `apps/app/server/actions/brain.ts` |
| 8 | Content prompt enhancement | `apps/app/server/actions/content.ts` |
| 9 | Rating buttons component | `apps/app/components/rating-buttons.tsx` (new) |
| 10 | Engagement popover component | `apps/app/components/engagement-popover.tsx` (new) |
| 11 | Content list integration | `apps/app/app/(dashboard)/content/content-list.tsx` |
| 12 | Campaign panel integration | `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx` |
| 13 | Schedule page integration | `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` |
| 14 | Brain page performance update | `apps/app/app/(dashboard)/products/[id]/brain/page.tsx` |
| 15 | Update plan + test checklist | `EMS_PLAN.md` |
