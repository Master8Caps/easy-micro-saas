# Self-Learning System — Design Document

> **Date:** 2026-02-26
> **Status:** Approved
> **Scope:** v1 — manual engagement tracking, thumbs up/down rating, composite scoring, pattern extraction into regeneration prompts

---

## Overview

The self-learning system makes the platform smarter over time by feeding real-world performance data back into content and brain generation. It combines three signal types — click tracking (already built), manual engagement metrics, and user ratings — into a composite score that identifies winning patterns and injects them into regeneration prompts.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data storage | Columns on `content_pieces` | No new tables, engagement is tightly coupled to pieces |
| Engagement entry | One per piece, universal fields | Each piece maps to one channel already |
| Rating | Any lifecycle stage, -1/0/1 | Captures brand voice preference early |
| Signal weighting | Clicks 40%, engagement 40%, rating 20% | Hard data weighted over soft preference |
| Engagement sub-weights | Views x1, likes x3, comments x5, shares x4 | Deeper engagement valued higher |
| Feedback trigger | On regeneration (brain + content) | Enhances existing flow, no new UI surfaces |
| Cold start | No context appended | Prompt unchanged when no data exists |
| Sparse data (<5 pieces) | Directional caveat prefix | "Limited data — treat as directional" |
| UI surfaces | Inline on existing content cards | No new pages or nav items |

## Database Schema Changes

Single migration adding columns to `content_pieces`:

```sql
ALTER TABLE content_pieces
  ADD COLUMN rating SMALLINT DEFAULT NULL
    CHECK (rating IN (-1, 0, 1)),
  ADD COLUMN engagement_views INT DEFAULT NULL,
  ADD COLUMN engagement_likes INT DEFAULT NULL,
  ADD COLUMN engagement_comments INT DEFAULT NULL,
  ADD COLUMN engagement_shares INT DEFAULT NULL,
  ADD COLUMN engagement_logged_at TIMESTAMPTZ DEFAULT NULL;
```

- `rating`: -1 (thumbs down), NULL (no rating), 1 (thumbs up)
- Engagement fields: nullable integers, user-entered
- `engagement_logged_at`: when engagement was last updated

## Composite Scoring

**Formula:** `(clickSignal x 0.4) + (engagementSignal x 0.4) + (ratingSignal x 0.2)`

### Click Signal (40%)
- Source: `links.click_count` (existing)
- Normalized 0-100 relative to top performer within the product

### Engagement Signal (40%)
- Raw score: `views x 1 + likes x 3 + comments x 5 + shares x 4`
- Normalized 0-100 relative to top performer within the product
- If no engagement logged: treated as 0 (doesn't penalize, just not counted)

### Rating Signal (20%)
- Thumbs up (1) = 100
- No rating (NULL) = 50 (neutral, doesn't skew)
- Thumbs down (-1) = 0

### Score Tiers (unchanged from existing)
- >= 80: Top performer (emerald)
- 50-79: Moderate (amber)
- 20-49: Low (orange)
- < 20: Underperforming (red)
- 0 / no data: No data (zinc)

## Server Actions

### New: `updateContentRating(pieceId, rating)`
- Auth check, RLS enforced
- Sets `rating` column (-1, 0, or 1)
- `revalidatePath`

### New: `updateContentEngagement(pieceId, { views?, likes?, comments?, shares? })`
- Auth check, RLS enforced
- Sets engagement columns + `engagement_logged_at = now()`
- Accepts partial input (user might only know some metrics)
- `revalidatePath`

### New: `loadLearningInsights(productId)`
- Fetches all content pieces with any signal data (clicks, engagement, or rating)
- Computes composite scores for each piece
- Aggregates and returns:
  - **Top performers (score >= 70):** angle, hook, channel, content type, avatar pain points, truncated body text
  - **Patterns:** most effective pain points, best channels, best content types per channel, tone/style cues from top content
  - **Underperformers (score <= 30):** angles and hooks to avoid
  - **Thumbs-down pieces:** explicitly flagged regardless of other metrics
- Used by brain and content regeneration

### Modified: `generateBrain(productId)`
- Before building prompt, calls `loadLearningInsights(productId)`
- If insights exist, appends "Performance Context" section to prompt:
  - Top performing avatars and why they resonated
  - Top pain points that drove engagement
  - Best channels ranked
  - Patterns in winning content (tone, format, hooks)
  - What to avoid (low performers + thumbs-down patterns)
- If no insights: prompt unchanged (cold start)
- If sparse data (<5 pieces): context included with directional caveat

### Modified: `generateContentForCampaign(campaignId, productId)`
- Before building prompt, calls `loadLearningInsights(productId)`
- If insights exist, appends examples of top-performing content with engagement numbers
- Includes tone/style patterns and things to avoid
- If no insights: prompt unchanged (cold start)

### Modified: `loadPerformanceScores(productId, period?)`
- Existing click-based scoring enhanced with composite formula
- Fetches engagement + rating data alongside click counts
- Returns composite scores instead of click-only scores
- Period filtering applies to both clicks (from clicks table) and engagement (from `engagement_logged_at`)

## UI Components

### Thumbs Up/Down Buttons
- Two small icon buttons next to existing `CopyButton` on every content piece
- Surfaces: content page cards, campaign panel pieces, schedule panel pieces
- Active state: filled icon with colour (green for up, red for down)
- Clicking active thumb clears rating (back to neutral)
- Optimistic update with server rollback on error

### Engagement Popover
- "Log engagement" button appears only on posted content pieces
- Opens compact popover (similar to DatePicker pattern) with 4 number inputs:
  - Views / Impressions
  - Likes / Reactions
  - Comments
  - Shares / Reposts
- "Save" button, pre-populated with existing values if already logged
- After saving, button shows summary (e.g. "324 views, 12 likes")
- Can re-open to update numbers anytime

### Brain Page Performance Bars (Enhanced)
- Existing progress bars switch from click-only to composite score
- Label changes from "X clicks" to richer display (e.g. "Score: 72 · 15 clicks · 48 likes")
- Period toggle continues to work with composite data

## Pattern Extraction Details

### What Gets Extracted from Top Performers
1. Full context: angle, hook, channel, content type, avatar pain points used
2. Truncated body text (for tone/style reference in prompts)
3. Cross-performer patterns: recurring pain points, channel preferences, content type effectiveness

### Prompt Injection Format (Brain)
```
## Performance Context from Previous Campaigns
Your previous output was tested in the real world. Here's what we learned:

Top performing avatars: [avatar names + why they resonated]
Top pain points: [specific pain points that drove engagement]
Channels with best results: [ranked]
Patterns in winning content: [tone, format, hooks]
What to avoid: [low performers + thumbs-down patterns]

Use these insights when generating new avatars and campaigns.
Evolve what works, retire what doesn't, and experiment with
new angles informed by these patterns.
```

### Prompt Injection Format (Content)
```
## What's Working for This Product
Top performing content examples (for tone/style reference):
- "[truncated body]" (72 likes, 15 comments)
- "[truncated body]" (340 views, 8 shares)

Patterns: [hooks that work, tone cues, length preferences]
Avoid: [angles/styles that underperformed or were thumbs-downed]

Generate content that builds on these winning patterns while
staying fresh — don't copy, evolve.
```

### Cold Start Behaviour
- **Zero data:** No performance context. Prompt unchanged.
- **Sparse data (<5 pieces with signals):** Context included with prefix: "Limited data available — treat as directional, not definitive."
- **Rich data (5+ pieces):** Full context as above.

## Out of Scope (v2)
- Metricool / platform API integrations for auto-pulling metrics
- AI-assisted content editing via natural language prompt
- pgvector embeddings for semantic content similarity
- Proactive suggestions ("try these new angles")
- Engagement time-series / trend tracking
- User-configurable signal weights
