import { ImageResponse } from "next/og";
import { SITE_VARIANT } from "@/lib/variant";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const color = SITE_VARIANT === "calm" ? "#2F4A3C" : "#6366F1";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path
            d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z"
            fill={color}
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
