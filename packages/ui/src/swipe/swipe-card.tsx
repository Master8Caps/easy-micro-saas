"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { resolveDrag, glowFromDrag, type SwipeDirection } from "./swipe-gesture";

const THRESHOLD = 100;
const FLING_DISTANCE = 600;
const FLING_MS = 220;

export interface SwipeCardHandle {
  /** Programmatically throw the card (used by buttons / keyboard). */
  flick: (direction: SwipeDirection) => void;
}

export interface SwipeCardProps {
  children: ReactNode;
  /** Fired once the card is thrown past the threshold or flicked. */
  onResolve: (direction: SwipeDirection) => void;
  /** Overlay stamps shown as the card is dragged each way (optional). */
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  disabled?: boolean;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard({ children, onResolve, leftLabel, rightLabel, disabled }, ref) {
    const [dx, setDx] = useState(0);
    const [active, setActive] = useState(false);
    const [flung, setFlung] = useState<SwipeDirection | null>(null);
    const startX = useRef(0);
    const committed = useRef(false);

    function commit(direction: SwipeDirection) {
      if (committed.current) return;
      committed.current = true;
      setFlung(direction);
      setTimeout(() => onResolve(direction), FLING_MS);
    }

    useImperativeHandle(ref, () => ({
      flick: (direction) => {
        if (flung || disabled) return;
        commit(direction);
      },
    }));

    function onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if (flung || disabled) return;
      setActive(true);
      startX.current = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!active) return;
      setDx(e.clientX - startX.current);
    }
    function onPointerUp() {
      if (!active) return;
      setActive(false);
      const direction = resolveDrag(dx, THRESHOLD);
      if (!direction) {
        setDx(0);
        return;
      }
      commit(direction);
    }

    const translateX = flung ? (flung === "left" ? -FLING_DISTANCE : FLING_DISTANCE) : dx;
    const rotate = Math.max(-18, Math.min(18, translateX * 0.05));
    const glow = flung ? { side: flung, opacity: 1 } : glowFromDrag(dx, THRESHOLD);
    const ring =
      glow.side === "left"
        ? "0 0 40px rgba(239,68,68,0.55)"
        : glow.side === "right"
          ? "0 0 40px rgba(16,185,129,0.55)"
          : "0 10px 30px rgba(0,0,0,0.4)";

    return (
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative cursor-grab touch-none select-none active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          boxShadow: ring,
          opacity: flung ? 0 : 1,
          transition: active
            ? "none"
            : "transform 0.3s ease-out, opacity 0.3s ease-out, box-shadow 0.15s",
        }}
      >
        {leftLabel && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-start pl-5"
            style={{ opacity: glow.side === "left" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
            aria-hidden
          >
            {leftLabel}
          </div>
        )}
        {rightLabel && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end pr-5"
            style={{ opacity: glow.side === "right" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
            aria-hidden
          >
            {rightLabel}
          </div>
        )}
        {children}
      </div>
    );
  },
);
