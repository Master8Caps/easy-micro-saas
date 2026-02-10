"use server";

import { createClient } from "@/lib/supabase/server";

interface LoadBrainInput {
  productId: string;
}

export async function loadBrain(input: LoadBrainInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch product status
  const { data: product } = await supabase
    .from("products")
    .select("status")
    .eq("id", input.productId)
    .single();

  // Find the most recent completed generation for this product
  const { data: generation } = await supabase
    .from("generations")
    .select("id, raw_output")
    .eq("product_id", input.productId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!generation || !generation.raw_output) {
    return { output: null, productStatus: product?.status ?? "active" };
  }

  return {
    output: generation.raw_output,
    productStatus: product?.status ?? "active",
  };
}
