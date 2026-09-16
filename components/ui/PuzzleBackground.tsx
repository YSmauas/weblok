const PUZZLE_PATH =
  "M20 0h30c2 8 8 8 10 0h30v30c-8 2-8 8 0 10v30H60c-2-8-8-8-10 0H20V60c8-2 8-8 0-10V20V0Z";

function Piece({
  className,
  size = 140,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 90 90"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <path
        d={PUZZLE_PATH}
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeOpacity="0.55"
      />
    </svg>
  );
}

export function PuzzleBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, black, black, transparent)",
      }}
    >
      <Piece
        size={180}
        className="absolute -top-10 -right-16 animate-float opacity-30 drop-shadow-[0_0_18px_var(--accent)]"
      />
      <Piece
        size={110}
        className="absolute top-40 right-[20%] animate-floatSlow opacity-20 drop-shadow-[0_0_14px_var(--accent)] rotate-45"
      />
      <Piece
        size={150}
        className="absolute top-[15%] -left-10 animate-floatSlow opacity-25 drop-shadow-[0_0_16px_var(--accent)] -rotate-12"
      />
      <Piece
        size={90}
        className="absolute top-[55%] left-[8%] animate-float opacity-20 drop-shadow-[0_0_10px_var(--accent)] rotate-90"
      />
      <Piece
        size={130}
        className="absolute bottom-10 right-[10%] animate-float opacity-20 drop-shadow-[0_0_14px_var(--accent)] rotate-[30deg]"
      />
    </div>
  );
}
