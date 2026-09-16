export function ChatWidgetPreview() {
  return (
    <div className="h-[360px] bg-[radial-gradient(circle_at_30%_20%,#1e1e2c,transparent_60%),linear-gradient(160deg,#15151f,#0f0f16)] flex items-end justify-start p-5">
      <div className="w-[280px] rounded-2xl border border-base-border bg-base-panel2/95 backdrop-blur shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-base-border">
          <span className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm">
            💬
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">העוזר החכם</p>
            <p className="text-[11px] text-success">מחובר עכשיו</p>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-base-bg text-ink-secondary text-xs rounded-2xl rounded-bl-sm px-3 py-2 w-fit max-w-[85%]">
            שלום! איך אפשר לעזור היום?
          </div>
          <div className="bg-accent text-base-bg text-xs font-medium rounded-2xl rounded-br-sm px-3 py-2 w-fit max-w-[85%] mr-auto">
            אני רוצה לתאם פגישה
          </div>
        </div>
        <div className="px-3 pb-3">
          <div className="text-[11px] text-ink-muted border border-base-border rounded-full px-3 py-1.5">
            הקלד הודעה כאן...
          </div>
        </div>
      </div>
    </div>
  );
}
