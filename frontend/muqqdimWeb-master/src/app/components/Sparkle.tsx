interface SparkleProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
}

export function Sparkle({
  className = "",
  size = 18,
  color = "#C6A75E",
  opacity = 0.7,
}: SparkleProps) {
  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
        fill={color}
      />
    </svg>
  );
}
