// ── Component props (TypeScript interface) ───────────────────────────
// All props are optional — the component has sensible defaults.
interface SparkleProps {
  className?: string; // positioning utilities (top-[…] left-[…] etc.)
  size?: number; // width and height in pixels
  color?: string; // fill color (defaults to brand gold)
  opacity?: number; // 0 (invisible) to 1 (fully visible)
}

export function Sparkle({
  className = "",
  size = 18,
  color = "#C6A75E", // brand gold
  opacity = 0.7,
}: SparkleProps) {
  return (
    <svg
      // `absolute` lets the parent place the sparkle anywhere via className
      // `pointer-events-none` makes sure it never blocks clicks on real UI
      className={`absolute pointer-events-none ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* SVG path describing a 4-pointed star/sparkle shape.
          The path traces a center-out star with concave sides. */}
      <path
        d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill={color}
      />
    </svg>
  );
}
