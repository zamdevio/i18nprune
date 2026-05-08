import { useToolVersion } from "../../contexts/version";

/** Hover-only copy when the registry could not be reached (no on-screen paragraph). */
const OFFLINE_HINT =
  "Could not reach the npm registry from this browser. The version shown is the CLI bundled with this site.";

function shellClasses(
  phase: "loading" | "offline" | "live",
): { wrap: string; dot: string } {
  if (phase === "loading") {
    return {
      wrap: "border-border/60 bg-secondary/40 text-muted-foreground",
      dot: "bg-muted-foreground",
    };
  }
  if (phase === "offline") {
    return {
      wrap: "border-amber-400/40 bg-amber-500/[0.12] text-amber-950 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-50",
      dot: "bg-amber-500 dark:bg-amber-400",
    };
  }
  return {
    wrap: "border-emerald-500/40 bg-emerald-500/[0.12] text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-400/10 dark:text-emerald-50",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  };
}

type VersionBadgeProps = {
  className?: string;
};

/** Header: compact pill — green when npm responded, soft yellow when not (details on hover). */
export function VersionBadge({ className = "" }: VersionBadgeProps) {
  const { staticVersion, npmLatest, status, updateAvailable, isNpmReachable } =
    useToolVersion();

  const phase =
    status === "loading" ? "loading" : isNpmReachable ? "live" : "offline";
  const { wrap, dot } = shellClasses(phase);

  const title =
    status === "loading"
      ? `CLI v${staticVersion} — checking npm…`
      : !isNpmReachable
        ? OFFLINE_HINT
        : updateAvailable
          ? `Bundled v${staticVersion} · npm latest v${npmLatest}`
          : `CLI v${staticVersion} · matches npm latest v${npmLatest}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums uppercase tracking-wider shadow-sm ${wrap} ${className}`}
      title={title}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${dot} ${status === "loading" ? "animate-pulse" : ""}`} />
      v{staticVersion}
      {status === "ready" && isNpmReachable && updateAvailable ? (
        <span
          className="rounded bg-emerald-600/20 px-1 text-[0.6rem] font-extrabold text-emerald-900 dark:text-emerald-100"
          aria-label="Newer version on npm"
        >
          npm {npmLatest}
        </span>
      ) : null}
    </span>
  );
}

export default VersionBadge;
