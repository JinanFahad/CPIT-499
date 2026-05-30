import { Sparkle } from "./Sparkle";

type Variant = "default" | "dense";

const PRESETS: Record<Variant, { className: string; size: number }[]> = {
  default: [
    { className: "top-[5%] left-[5%]", size: 18 },
    { className: "top-[15%] right-[8%]", size: 12 },
    { className: "top-[40%] left-[3%]", size: 22 },
    { className: "top-[60%] right-[5%]", size: 14 },
    { className: "bottom-[20%] left-[7%]", size: 16 },
    { className: "bottom-[10%] right-[15%]", size: 20 },
  ],
  dense: [
    { className: "top-[8%] left-[12%]", size: 20 },
    { className: "top-[20%] right-[15%]", size: 14 },
    { className: "top-[45%] left-[8%]", size: 22 },
    { className: "bottom-[25%] right-[10%]", size: 16 },
    { className: "bottom-[12%] left-[20%]", size: 18 },
    { className: "top-[65%] left-[35%]", size: 12 },
    { className: "top-[15%] left-[40%]", size: 10 },
    { className: "top-[35%] right-[35%]", size: 13 },
    { className: "top-[75%] right-[28%]", size: 17 },
    { className: "bottom-[40%] left-[55%]", size: 11 },
    { className: "top-[55%] right-[55%]", size: 15 },
  ],
};

interface SparkleFieldProps {
  variant?: Variant;
}

export function SparkleField({ variant = "default" }: SparkleFieldProps) {
  return (
    <>
      {PRESETS[variant].map((s, i) => (
        <Sparkle key={i} className={s.className} size={s.size} />
      ))}
    </>
  );
}
