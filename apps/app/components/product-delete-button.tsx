"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/server/actions/products";
import { useUser } from "@/components/user-context";

export function ProductDeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { role } = useUser();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (role !== "admin") return null;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProduct(productId);
    if (result.error) {
      setDeleting(false);
      setShowConfirm(false);
      alert(result.error);
      return;
    }
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="rounded-lg border border-red-500/30 p-1.5 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
        title="Delete product"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-white">Delete Product</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-200">{productName}</span>?
              This will permanently delete all campaigns, content, and analytics data.
            </p>
            <p className="mt-2 text-sm font-medium text-red-400">This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={deleting}
                className="rounded-lg border border-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
