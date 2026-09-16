export function BrowserFrame({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-base-border bg-base-panel overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-base-border bg-base-panel2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        </div>
        <div
          dir="ltr"
          className="mx-auto text-xs text-ink-muted bg-base-bg/60 rounded-full px-3 py-1 max-w-[220px] truncate"
        >
          {url}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
          }
      
