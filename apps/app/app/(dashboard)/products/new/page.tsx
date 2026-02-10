"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/server/actions/products";

const channelOptions = [
  "LinkedIn",
  "X / Twitter",
  "Reddit",
  "Product Hunt",
  "Indie Hackers",
  "Email",
  "Blog / SEO",
  "Paid Ads",
];

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
  const [goals, setGoals] = useState("");
  const [channels, setChannels] = useState<string[]>([]);

  function toggleChannel(channel: string) {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const result = await createProduct({
      name,
      description,
      market,
      goals,
      channels,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/products/${result.id}/brain`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            Step {step} of 3
          </p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-white" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              What are you building?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Tell us about your product. Be specific — better input means
              better output.
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Product name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. InvoiceBot"
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  One-line description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Automated invoicing for freelancers who hate chasing payments"
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Target market / problem being solved
                </label>
                <textarea
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  rows={3}
                  placeholder="e.g. Freelance designers and developers who waste hours every month creating and following up on invoices. They need something that handles it automatically."
                  className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name || !description || !market}
              className="mt-8 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              What are your goals?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              What does success look like in the next 30 days?
            </p>

            <div className="mt-8">
              <label className="block text-sm font-medium text-zinc-300">
                Goals
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
                placeholder="e.g. Get 50 signups from freelancers, validate that automated invoice reminders are the killer feature, figure out if LinkedIn or Twitter is the better channel."
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!goals}
                className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Where do you want to reach people?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Pick the channels you want to focus on. Select at least one.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {channelOptions.map((channel) => (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    channels.includes(channel)
                      ? "border-white bg-white/10 text-zinc-100"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={channels.length === 0 || loading}
                className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
              >
                {loading ? "Creating..." : "Generate Marketing Brain"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
