import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "./new-campaign-form";

export default async function NewCampaignPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description")
    .order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold">New Ad Campaign</h1>
      <p className="mt-1 text-sm text-content-muted">
        Set up your campaign and we&apos;ll generate deployment-ready ad packages
      </p>
      <NewCampaignForm products={products ?? []} />
    </div>
  );
}
