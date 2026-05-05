"use client";

import PhaseHeader from "@/components/PhaseHeader";
import Leaderboard from "@/components/Leaderboard";
import ValidatorPanel from "@/components/ValidatorPanel";
import TopPodium from "@/components/TopPodium";
import { useLeaderboard } from "@/lib/useLeaderboard";

export default function HomePage() {
  const {
    data,
    miners,
    showingCached,
    apiAgeSeconds,
    nextRefreshSeconds,
    cachedAt,
    error,
    isLoading,
  } = useLeaderboard();

  const httpStatus = (error as Error & { status?: number } | undefined)?.status;
  const showCold = !data && (isLoading || error);

  if (showCold) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-semibold tracking-tightest">Connito · SN102</h1>
        <p className="mt-3 text-sm dim">
          {isLoading && !error ? (
            "Loading…"
          ) : (
            <>
              <span className="font-mono">dashboard-api.connito.ai</span> is
              currently unavailable
              {httpStatus ? (
                <>
                  {" "}
                  (HTTP <span className="font-mono">{httpStatus}</span>)
                </>
              ) : null}
              .
            </>
          )}
        </p>
        <p className="mt-1 text-xs dim">
          Retrying every 5 seconds — this page will populate when the API comes
          back.
        </p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div className="mb-4 -mt-4 px-3 py-2 text-xs font-mono border border-ink-100 rounded-md flex items-center justify-between">
          <span>
            api error · last good data shown ·{" "}
            {httpStatus ? `HTTP ${httpStatus}` : "network"}
          </span>
          <span className="dim">retrying 5s…</span>
        </div>
      ) : null}

      <PhaseHeader
        data={data}
        nextRefreshSeconds={nextRefreshSeconds}
        apiAgeSeconds={apiAgeSeconds}
      />

      {showingCached ? (
        <div className="mb-4 px-3 py-2 text-xs font-mono border border-dashed border-ink-200 rounded-md flex items-center justify-between">
          <span>
            no current round · showing previous leaderboard
            {cachedAt ? (
              <span className="dim ml-2">
                (cached {fmtRelMs(Date.now() - cachedAt)})
              </span>
            ) : null}
          </span>
          <span className="dim">next validator update in {nextRefreshSeconds}s</span>
        </div>
      ) : null}

      <TopPodium miners={miners} />
      <Leaderboard miners={miners} />
      <ValidatorPanel data={data} />

      <footer className="mt-16 pt-6 border-t border-ink-100 text-xs dim font-mono flex items-center justify-between">
        <span>
          api ·{" "}
          <a
            className="hover:text-ink"
            href="https://dashboard-api.connito.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            /docs
          </a>
        </span>
        <span>
          connito sn102 · refresh in {nextRefreshSeconds}s
        </span>
      </footer>
    </>
  );
}

function fmtRelMs(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
