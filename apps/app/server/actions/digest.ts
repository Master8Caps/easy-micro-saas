// apps/app/server/actions/digest.ts
import { createServiceClient } from "@/lib/supabase/service";

export interface DigestProduct {
  id: string;
  name: string;
  totalClicks: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topPiece: {
    title: string;
    channel: string;
    compositeScore: number;
  } | null;
}

export interface DigestData {
  email: string;
  totalClicksAllProducts: number;
  postsThisWeek: number;
  topPerformer: { title: string; channel: string; score: number } | null;
  products: DigestProduct[];
  totalProductCount: number;
  actionItems: {
    readyToPost: number;
    scheduledThisWeek: number;
    campaignsWithNoContent: number;
  };
}

function compositeScore(piece: {
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  clickCount: number;
}): number {
  const clicks = Math.min(piece.clickCount / 50, 1) * 100;
  const eng =
    ((piece.engagement_views || 0) +
      (piece.engagement_likes || 0) * 3 +
      (piece.engagement_comments || 0) * 5 +
      (piece.engagement_shares || 0) * 4) /
    10;
  const engNorm = Math.min(eng, 100);
  const rating = ((piece.rating || 0) / 5) * 100;
  return clicks * 0.4 + engNorm * 0.4 + rating * 0.2;
}

export async function getDigestDataForUser(
  userId: string,
  email: string,
): Promise<DigestData | null> {
  const supabase = createServiceClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoISO = weekAgo.toISOString();
  const nextWeekISO = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", userId);

  if (!products || products.length === 0) return null;

  const productIds = products.map((p) => p.id);

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, title, status, posted_at, scheduled_for, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, campaigns(channel), links(click_count)",
    )
    .in("product_id", productIds)
    .eq("archived", false);

  if (!pieces) return null;

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, content_pieces(id)")
    .in("product_id", productIds)
    .eq("archived", false);

  const productMap = new Map<string, DigestProduct>();
  for (const prod of products) {
    productMap.set(prod.id, {
      id: prod.id,
      name: prod.name,
      totalClicks: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      topPiece: null,
    });
  }

  let totalClicksAll = 0;
  let postsThisWeek = 0;
  let globalTop: { title: string; channel: string; score: number } | null = null;
  let readyToPost = 0;
  let scheduledThisWeek = 0;

  for (const piece of pieces) {
    const clickCount =
      (piece.links as { click_count: number }[] | null)?.reduce(
        (sum, l) => sum + (l.click_count || 0),
        0,
      ) || 0;
    const prodData = productMap.get(piece.product_id);
    if (!prodData) continue;

    prodData.totalClicks += clickCount;
    prodData.totalViews += piece.engagement_views || 0;
    prodData.totalLikes += piece.engagement_likes || 0;
    prodData.totalComments += piece.engagement_comments || 0;
    prodData.totalShares += piece.engagement_shares || 0;
    totalClicksAll += clickCount;

    if (piece.posted_at && piece.posted_at >= weekAgoISO) {
      postsThisWeek++;
    }

    if (piece.status === "approved") {
      readyToPost++;
    }

    if (
      piece.scheduled_for &&
      piece.scheduled_for >= now.toISOString() &&
      piece.scheduled_for <= nextWeekISO
    ) {
      scheduledThisWeek++;
    }

    const score = compositeScore({ ...piece, clickCount });
    const channel =
      (piece.campaigns as { channel: string }[] | null)?.[0]?.channel || "unknown";

    if (!prodData.topPiece || score > prodData.topPiece.compositeScore) {
      prodData.topPiece = {
        title: piece.title || "Untitled",
        channel,
        compositeScore: score,
      };
    }

    if (!globalTop || score > globalTop.score) {
      globalTop = {
        title: piece.title || "Untitled",
        channel,
        score,
      };
    }
  }

  const campaignsNoContent =
    campaigns?.filter(
      (c) =>
        !c.content_pieces || (c.content_pieces as { id: string }[]).length === 0,
    ).length || 0;

  const activeProducts = Array.from(productMap.values()).filter(
    (p) =>
      p.totalClicks > 0 ||
      p.totalViews > 0 ||
      p.totalLikes > 0 ||
      p.topPiece !== null,
  );
  const totalProductCount = activeProducts.length;

  if (
    totalClicksAll === 0 &&
    postsThisWeek === 0 &&
    readyToPost === 0 &&
    scheduledThisWeek === 0 &&
    activeProducts.length === 0 &&
    campaignsNoContent === 0
  ) {
    return null;
  }

  return {
    email,
    totalClicksAllProducts: totalClicksAll,
    postsThisWeek,
    topPerformer: globalTop,
    products: activeProducts.slice(0, 5),
    totalProductCount,
    actionItems: {
      readyToPost,
      scheduledThisWeek,
      campaignsWithNoContent: campaignsNoContent,
    },
  };
}
