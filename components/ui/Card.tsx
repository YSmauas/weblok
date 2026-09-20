export function Card({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-base-border bg-base-panel/80 backdrop-blur-sm
        shadow-[0_0_0_1px_var(--accent-soft),0_8px_30px_-12px_var(--accent)]
        p-6 ${className}`}
    >
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      {description && (
        <p className="text-sm text-ink-secondary mt-1">{description}</p>
      )}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}
