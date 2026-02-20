"use client";

import { useState, useEffect } from "react";
import { updateAvatar } from "@/server/actions/avatars";

const KNOWN_CHANNELS = [
  "LinkedIn",
  "X / Twitter",
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "Pinterest",
  "Reddit",
  "Product Hunt",
  "Indie Hackers",
  "Email",
  "Blog / SEO",
];

interface DbAvatar {
  id: string;
  name: string;
  description: string;
  pain_points: string[];
  channels: string[];
  icp_details: {
    role: string;
    context: string;
    motivation: string;
  };
  is_active: boolean;
}

interface AvatarEditPanelProps {
  avatar: DbAvatar;
  onSave: (updated: DbAvatar) => void;
  onClose: () => void;
}

export function AvatarEditPanel({ avatar, onSave, onClose }: AvatarEditPanelProps) {
  const [name, setName] = useState(avatar.name);
  const [description, setDescription] = useState(avatar.description);
  const [painPoints, setPainPoints] = useState<string[]>(avatar.pain_points);
  const [channels, setChannels] = useState<string[]>(avatar.channels);
  const [role, setRole] = useState(avatar.icp_details.role);
  const [context, setContext] = useState(avatar.icp_details.context);
  const [motivation, setMotivation] = useState(avatar.icp_details.motivation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function toggleChannel(ch: string) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  }

  function removePainPoint(index: number) {
    setPainPoints((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePainPoint(index: number, value: string) {
    setPainPoints((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function addPainPoint() {
    setPainPoints((prev) => [...prev, ""]);
  }

  async function handleSave() {
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const filteredPoints = painPoints.filter((p) => p.trim() !== "");
    if (filteredPoints.length === 0) {
      setError("At least one pain point is required");
      return;
    }
    if (channels.length === 0) {
      setError("At least one channel is required");
      return;
    }

    setSaving(true);

    const result = await updateAvatar({
      avatarId: avatar.id,
      name: name.trim(),
      description: description.trim(),
      pain_points: filteredPoints,
      channels,
      icp_details: {
        role: role.trim(),
        context: context.trim(),
        motivation: motivation.trim(),
      },
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onSave({
      ...avatar,
      name: name.trim(),
      description: description.trim(),
      pain_points: filteredPoints,
      channels,
      icp_details: {
        role: role.trim(),
        context: context.trim(),
        motivation: motivation.trim(),
      },
    });
  }

  const inputClass =
    "w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/[0.06] bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
          <h2 className="text-lg font-semibold">Edit Avatar</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. SaaS Founder"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass + " resize-none"}
              placeholder="Who they are and their context..."
            />
          </div>

          {/* Pain Points */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pain Points
            </label>
            <div className="space-y-2">
              {painPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updatePainPoint(index, e.target.value)}
                    className={inputClass + " flex-1"}
                    placeholder="Pain point..."
                  />
                  <button
                    onClick={() => removePainPoint(index)}
                    className="shrink-0 rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPainPoint}
              className="mt-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
            >
              + Add pain point
            </button>
          </div>

          {/* Channels */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {KNOWN_CHANNELS.map((ch) => {
                const selected = channels.some(
                  (c) => c.toLowerCase() === ch.toLowerCase(),
                );
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.1] hover:text-zinc-400"
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ICP Details */}
          <div>
            <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              ICP Details
            </label>
            <div className="space-y-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Technical founder building a SaaS"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  className={inputClass + " resize-none"}
                  placeholder="Their situation and environment..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Motivation</label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={2}
                  className={inputClass + " resize-none"}
                  placeholder="What drives them to seek a solution..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-6">
          {error && (
            <p className="mb-3 text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
