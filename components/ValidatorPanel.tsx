"use client";

import useSWR from "swr";
import type { LeaderboardResponse, NetworkHealth as NHType } from "@/lib/api";
import { API_BASE, REFRESH_MS, fetcher, sinceUnix } from "@/lib/api";

export default function ValidatorPanel({ data }: { data: LeaderboardResponse | undefined }) {
  const { data: nh } = useSWR<NHType>(
    `${API_BASE}/api/v1/network-health`,
    fetcher,
    { refreshInterval: REFRESH_MS, revalidateOnFocus: false, keepPreviousData: true }
  );

  const validator = data?.data.validator as { mode?: string; uid?: number | null; hotkey?: string | null } | null | undefined;
  const meta = data?.meta;

  // Use gateway-tracked validator counts (meta.*), NOT data.subnet.validator_count
  // (the latter is on-chain validator count which may differ from gateway tracking).
  const total = meta?.validator_count ?? 0;
  const polled = meta?.polled_validator_count ?? 0;
  const contributing = meta?.contributing_validators ?? [];
  const missing = meta?.missing_validators ?? [];

  const liveness = nh?.liveness_heartbeats;
  const weightSets = nh?.successful_weight_sets;
  const rpcErrors = nh?.rpc_errors;
  const scored = nh?.miners_scored_current_round;
  const failed = nh?.miners_failed_current_round;

  const allActive = total > 0 && polled === total && missing.length === 0;

  return (
    <section className="mt-10 pt-6 border-t border-ink-100">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-xs uppercase tracking-wider dim">Validators</h2>
        <div className="text-xs font-mono dim">
          {meta?.served_from ? `served from: ${meta.served_from}` : ""}
          {validator?.mode ? ` · mode: ${validator.mode}` : ""}
        </div>
      </div>

      {/* Top row: validator count summary (all from meta — these reflect gateway state) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Cell
          label="Tracked"
          value={total}
          hint="validators the gateway is polling"
        />
        <Cell
          label="Polled"
          value={polled}
          accent={total > 0 && polled === total ? "ok" : polled > 0 ? "warn" : "down"}
          hint="responded to most recent gateway poll"
        />
        <Cell
          label="Contributing"
          value={contributing.length}
          accent={allActive ? "ok" : contributing.length > 0 ? "warn" : "down"}
          hint="provided data in this payload"
        />
        <Cell
          label="Missing"
          value={missing.length}
          accent={missing.length > 0 ? "warn" : "ok"}
          hint="known but unreachable"
        />
      </div>

      {/* Detail row: which validators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
        <div>
          <div className="dim uppercase tracking-wider mb-1.5">Contributing</div>
          {contributing.length === 0 ? (
            <span className="dim">none</span>
          ) : (
            <div className="font-mono flex flex-wrap gap-1">
              {contributing.map((v) => (
                <span key={String(v)} className="px-1.5 py-0.5 border border-ink-100 rounded">
                  {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="dim uppercase tracking-wider mb-1.5">Missing</div>
          {missing.length === 0 ? (
            <span className="dim">none</span>
          ) : (
            <div className="font-mono flex flex-wrap gap-1">
              {missing.map((v) => (
                <span
                  key={String(v)}
                  className="px-1.5 py-0.5 border border-red-200 text-red-700 rounded"
                >
                  {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Network health */}
      <div className="mb-2">
        <div className="text-xs uppercase tracking-wider dim mb-2">Network health</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs font-mono">
          <Stat label="liveness" value={liveness} />
          <Stat label="weight sets" value={weightSets} accent={weightSets === 0 ? "warn" : undefined} />
          <Stat label="rpc errors" value={rpcErrors} accent={rpcErrors && rpcErrors > 0 ? "warn" : undefined} />
          <Stat label="scored" value={scored} />
          <Stat label="failed" value={failed} accent={failed && failed > 0 ? "warn" : undefined} />
          <Stat label="last poll" value={meta?.last_success_ts ? sinceUnix(meta.last_success_ts) : "—"} />
        </div>
      </div>

      {/* Stale banner */}
      {meta?.stale ? (
        <div className="mt-4 px-3 py-2 text-xs font-mono border border-red-200 bg-red-50 text-red-800 rounded-md">
          gateway marked stale
          {meta?.stale_reason ? <> · reason: {meta.stale_reason}</> : null}
        </div>
      ) : null}
    </section>
  );
}

function Cell({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string | null | undefined;
  hint?: string;
  accent?: "ok" | "warn" | "down";
}) {
  const accentCls =
    accent === "ok" ? "text-emerald-700"
      : accent === "warn" ? "text-amber-700"
      : accent === "down" ? "text-red-700"
      : "";
  return (
    <div>
      <div className="text-xs uppercase tracking-wider dim mb-1">{label}</div>
      <div className={`font-mono text-2xl ${accentCls}`}>{value ?? "—"}</div>
      {hint ? <div className="text-xs dim mt-1">{hint}</div> : null}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string | null | undefined;
  accent?: "warn" | "ok";
}) {
  const accentCls = accent === "warn" ? "text-amber-700" : "";
  return (
    <div>
      <div className="dim mb-0.5">{label}</div>
      <div className={accentCls}>{value ?? "—"}</div>
    </div>
  );
}
