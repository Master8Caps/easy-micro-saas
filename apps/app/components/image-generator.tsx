"use client";

import { useState, useRef } from "react";
import {
  generateImage,
  uploadContentImage,
  deleteContentImage,
  updateImagePrompt,
} from "@/server/actions/images";

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
type ImageQuality = "medium" | "high";

const SIZE_LABELS: Record<ImageSize, string> = {
  "1024x1024": "Square (1024×1024)",
  "1024x1536": "Portrait (1024×1536)",
  "1536x1024": "Landscape (1536×1024)",
};

const CHANNEL_DEFAULTS: Record<string, ImageSize> = {
  linkedin: "1536x1024",
  twitter: "1536x1024",
  facebook: "1024x1024",
  instagram: "1024x1024",
  pinterest: "1024x1536",
  tiktok: "1024x1536",
  youtube: "1536x1024",
};

interface ImageGeneratorProps {
  contentPieceId: string;
  imageUrl: string | null;
  imageSource: "generated" | "uploaded" | null;
  imagePromptUsed: string | null;
  body: string;
  channel?: string;
}

export default function ImageGenerator({
  contentPieceId,
  imageUrl: initialImageUrl,
  imageSource: initialImageSource,
  imagePromptUsed: initialPromptUsed,
  body,
  channel,
}: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageSource, setImageSource] = useState(initialImageSource);
  const [promptUsed, setPromptUsed] = useState(initialPromptUsed);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(initialPromptUsed || "");
  const [size, setSize] = useState<ImageSize>(
    channel
      ? CHANNEL_DEFAULTS[channel.toLowerCase()] || "1024x1024"
      : "1024x1024"
  );
  const [quality, setQuality] = useState<ImageQuality>("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Save edited prompt first if user modified it
      if (showPromptEditor && editedPrompt !== promptUsed) {
        await updateImagePrompt(contentPieceId, editedPrompt);
        setPromptUsed(editedPrompt);
      }
      const result = await generateImage(contentPieceId, { size, quality });
      setImageUrl(result.imageUrl);
      setImageSource("generated");
      setShowPromptEditor(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PNG, JPG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadContentImage(contentPieceId, formData);
      setImageUrl(result.imageUrl);
      setImageSource("uploaded");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteContentImage(contentPieceId);
      setImageUrl(null);
      setImageSource(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      await updateImagePrompt(contentPieceId, editedPrompt);
      setPromptUsed(editedPrompt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    }
  };

  // --- Render ---

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-white/[0.06]">
      {/* Error display */}
      {error && (
        <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Image preview */}
      {imageUrl && (
        <div className="mb-3">
          <img
            src={imageUrl}
            alt="Generated content image"
            className="w-full rounded-lg"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">
              {imageSource === "generated" ? "AI Generated" : "Uploaded"}
            </span>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(imageUrl);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `image-${contentPieceId}.png`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  setError("Failed to download image");
                }
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Download
            </button>
            <div className="flex-1" />
            {imageSource === "generated" && (
              <button
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Edit Prompt
              </button>
            )}
            {imageSource === "uploaded" ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    if (!editedPrompt) setEditedPrompt(promptUsed || body);
                    setShowPromptEditor(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-300"
                >
                  Generate AI Image Instead
                </button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Upload Instead
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-400 hover:text-red-300"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Prompt editor */}
      {showPromptEditor && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Image Prompt
          </label>
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-100"
          />
          <div className="mt-1 flex gap-2">
            <button
              onClick={handleSavePrompt}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Save Prompt
            </button>
          </div>
        </div>
      )}

      {/* Generation/Upload controls */}
      {!isGenerating && !isUploading && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Aspect ratio selector */}
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as ImageSize)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-300 [&>option]:bg-white dark:[&>option]:bg-zinc-900"
          >
            {Object.entries(SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* HD toggle */}
          <label className="flex items-center gap-1 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={quality === "high"}
              onChange={(e) =>
                setQuality(e.target.checked ? "high" : "medium")
              }
              className="rounded border-zinc-300 text-indigo-500 focus:ring-indigo-500/30 dark:border-zinc-600"
            />
            HD
          </label>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {imageUrl ? "Regenerate" : "Generate Image"}
          </button>

          {/* Upload button (when no image yet) */}
          {!imageUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.03]"
            >
              Upload Image
            </button>
          )}

          {/* Prompt preview toggle (when no image yet) */}
          {!imageUrl && !showPromptEditor && (
            <button
              onClick={() => {
                // Initialize prompt from body if not set yet
                if (!editedPrompt) setEditedPrompt(promptUsed || body);
                setShowPromptEditor(true);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            >
              Edit Prompt
            </button>
          )}
        </div>
      )}

      {/* Loading states */}
      {isGenerating && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          <span className="text-sm text-zinc-400">Generating image...</span>
        </div>
      )}
      {isUploading && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          <span className="text-sm text-zinc-400">Uploading...</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
