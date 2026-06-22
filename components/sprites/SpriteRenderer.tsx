"use client";

import { useEffect, useRef } from "react";
import { SpriteEngine } from "./SpriteEngine";

interface SpriteRendererProps {
  /** Called once when the engine is live. Parent drives it imperatively. */
  onReady: (engine: SpriteEngine) => void;
  ariaLabel?: string;
}

/**
 * Mounts the <canvas> and the SpriteEngine, then gets out of the way. This
 * component intentionally holds no game state and never re-renders during
 * animation — RoomScene mutates the engine through the ref handed back by
 * onReady, so frame-by-frame movement never touches React (Task 4).
 */
export default function SpriteRenderer({
  onReady,
  ariaLabel,
}: SpriteRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpriteEngine | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SpriteEngine(canvas);
    engineRef.current = engine;
    engine.start();
    onReadyRef.current(engine);

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas);

    const onWindowResize = () => engine.resize();
    window.addEventListener("resize", onWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWindowResize);
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      className="absolute inset-0 z-[5] h-full w-full"
    />
  );
}
