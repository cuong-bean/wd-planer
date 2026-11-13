export default function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" role="img" aria-label={`${label}: ${pct}%`}>
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div className="lbl">
        <div>
          <b>{pct}%</b>
          <small>{label}</small>
        </div>
      </div>
    </div>
  );
}
