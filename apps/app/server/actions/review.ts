"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isRejectReason, type RejectReason } from "@/lib/review/reject-reasons";

export interface ReviewCard {
  id: string;
  type: string;
  title: string | null;
  body: string;
  imageUrl: string | null;
  productId: string;
  productName: string;
  avatarName: string | null;
}

/** Drafts awaiting a yes/no, newest first, scoped by RLS to the user's products. */
export async function getReviewDeck(productId?: string): Promise<ReviewCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Mirrors the embed style proven in learning.ts: products + avatars resolve
  // directly off content_pieces.
  let query = supabase
    .from("content_pieces")
    .select(`
      id, type, title, body, image_url, product_id,
      products(name),
      avatars(name)
    `)
    .eq("status", "draft")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (productId) query = query.eq("product_id", productId);

  const { data } = await query;
  if (!data) return [];

  return (data as Record<string, unknown>[]).map((p) => {
    const product = p.products as { name: string } | null;
    const avatar = p.avatars as { name: string } | null;
    return {
      id: p.id as string,
      type: p.type as string,
      title: (p.title as string | null) ?? null,
      body: p.body as string,
      imageUrl: (p.image_url as string | null) ?? null,
      productId: p.product_id as string,
      productName: product?.name ?? "",
      avatarName: avatar?.name ?? null,
    };
  });
}

/** Right swipe: approve into the library + positive learning signal. */
export async function approveDraft(pieceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ status: "approved", rating: 1 })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}

/** Left swipe: archive + negative learning signal + optional reason. */
export async function rejectDraft(pieceId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const reject_reason: RejectReason | null = isRejectReason(reason) ? reason : null;

  const { error } = await supabase
    .from("content_pieces")
    .update({ archived: true, rating: -1, reject_reason })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}

/** Single-step undo: restore a piece to its pre-swipe draft state. */
export async function undoLastDecision(pieceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ status: "draft", archived: false, rating: null, reject_reason: null })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}
