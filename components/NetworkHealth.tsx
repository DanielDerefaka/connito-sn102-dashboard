"use client";

import useSWR from "swr";
import type { NetworkHealth as NHType } from "@/lib/api";
import { API_BASE, REFRESH_MS, fetcher } from "@/lib/api";

export default function NetworkHealth() {
  const { data, error } = useSWR<NHType>(
    `${API_BASE}/api/v1/network-health`,
    fetcher,
    { refreshInterval: REFRESH_MS, revalidateOnFocus: false }
  );

  if (error) return null;

  return (
    <div className="mt-10 pt-6 border-t border-ink-100">
      <h2 className="text-xs uppercase tracking-wider dim mb-3">Network</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs font-mono">
        <Cell label="liveness" value={data?.liveness_heartbeats} />
        <Cell label="weight sets" value={data?.successful_weight_sets} />
        <Cell label="rpc errors" value={data?.rpc_errors} />
        <Cell label="scored" value={data?.miners_scored_current_round} />
        <Cell label="failed" value={data?.miners_failed_current_round} />
        <Cell label="cpu %" value={data?.system_cpu_percent?.toFixed(1)} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div>
      <div className="dim mb-0.5">{label}</div>
      <div>{value ?? "—"}</div>
    </div>
  );
}
