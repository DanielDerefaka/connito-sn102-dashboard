"use client";

import type { LeaderboardResponse } from "@/lib/api";
import { sinceUnix } from "@/lib/api";

interface Props {
  data: LeaderboardResponse | undefined;
  nextRefreshSeconds?: number;
  apiAgeSeconds?: number | null;
}

export default function PhaseHeader({ data, nextRefreshSeconds, apiAgeSeconds }: Props) {
  const subnet = data?.data.subnet;
  const phase = data?.data.phase;
  const round = data?.data.round;
  const meta = data?.meta;

  return (
    <header className="mb-8 border-b border-ink-100 pb-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tightest">
            Connito · SN<span className="font-mono">{subnet?.netuid ?? "—"}</span>
          </h1>
          <p className="mt-1 text-sm dim">
            Live leaderboard · refresh{" "}
            <span className="font-mono">
              {nextRefreshSeconds != null ? `in ${nextRefreshSeconds}s` : "12s"}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider dim mb-1">
            <span className="dot" />
            <span className="font-mono">{meta?.stale ? "stale" : "live"}</span>
            {apiAgeSeconds != null ? (
              <span className="ml-2 dim">· {apiAgeSeconds}s old</span>
            ) : meta?.last_success_ts ? (
              <span className="ml-2">· {sinceUnix(meta.last_success_ts)}</span>
            ) : null}
          </div>
          <div className="text-xs dim font-mono">
            block {phase?.head_block ?? "—"} · cycle {phase?.cycle_index ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <Stat label="Phase">
          <span className="font-medium">{phase?.name ?? "—"}</span>
          {phase?.blocks_remaining != null ? (
            <span className="dim font-mono ml-2">
              · {phase.blocks_remaining} blk left
            </span>
          ) : null}
        </Stat>
        <Stat label="Round">
          <span className="font-mono">{round?.id ?? "—"}</span>
        </Stat>
        <Stat label="Baseline loss">
          <span className="font-mono">
            {round?.baseline_loss != null ? round.baseline_loss.toFixed(4) : "—"}
          </span>
        </Stat>
        <Stat label="Total miners">
          <span className="font-mono">{subnet?.total_miners ?? "—"}</span>
          <span className="dim ml-1">/ {meta?.validator_count ?? subnet?.validator_count ?? 0}v</span>
        </Stat>
      </div>

      {round?.stats ? (
        <div className="mt-4 flex gap-6 text-xs dim font-mono flex-wrap">
          {Object.entries(round.stats).map(([k, v]) => (
            <span key={k}>
              {k}: <span className="text-ink">{v ?? "—"}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* When phase/round are null (between rounds), show a small countdown banner */}
      {!phase && !round && data ? (
        <div className="mt-4 text-xs dim font-mono">
          validator is between rounds · next poll in{" "}
          <span className="text-ink">{nextRefreshSeconds ?? 12}s</span>
        </div>
      ) : null}
    </header>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider dim mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
