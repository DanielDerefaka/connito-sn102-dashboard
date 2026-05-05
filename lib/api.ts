// API client + types for the Connito Telemetry Gateway.
// Spec: https://dashboard-api.connito.ai/openapi.json
// Polls live every 12s (the gateway's own poll interval).

export const API_BASE = "https://dashboard-api.connito.ai";
export const REFRESH_MS = 12_000;

export interface SubnetMeta {
  netuid: number;
  total_miners: number;
  validator_count: number;
}

export interface PhaseInfo {
  name: string;
  index?: number;
  started_at_block?: number;
  ends_at_block?: number;
  blocks_remaining?: number;
  head_block?: number;
  cycle_index?: number;
  cycle_length?: number;
  upcoming?: { name: string; start_block: number; actor: string }[];
}

export interface RoundStats {
  roster?: number;
  scored?: number;
  failed?: number;
  downloaded?: number;
  claimed?: number;
  pending?: number;
}

export interface RoundInfo {
  id: number | null;
  baseline_loss: number | null;
  stats: RoundStats | null;
  baseline_loss_history?: { round_id: number; baseline_loss: number; timestamp: number }[];
}

export interface Miner {
  uid: number;
  hotkey: string;
  score?: number | null;
  delta_loss?: number | null;
  val_loss?: number | null;
  weight_submitted?: number | null;
  hf_repo_id?: string | null;
  hf_revision?: string | null;
  in_assignment?: boolean;
}

export interface LeaderboardData {
  validator: Record<string, unknown> | null;
  subnet: SubnetMeta;
  phase: PhaseInfo | null;
  round: RoundInfo | null;
  leaderboard: Miner[];
}

export interface LeaderboardMeta {
  validator_count?: number;
  polled_validator_count?: number;
  last_success_ts?: number;
  poll_interval_seconds?: number;
  stale?: boolean;
  stale_reason?: string | null;
  served_from?: string;
  contributing_validators?: number[];
  missing_validators?: number[];
}

export interface LeaderboardResponse {
  data: LeaderboardData;
  meta: LeaderboardMeta;
}

export interface NetworkHealth {
  liveness_heartbeats?: number;
  successful_weight_sets?: number;
  rpc_errors?: number;
  miners_scored_current_round?: number | null;
  miners_failed_current_round?: number | null;
  system_cpu_percent?: number;
  dht_peers?: number;
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json();
};

// Helpers
export const fmtPct = (x: number | null | undefined, digits = 2) =>
  x == null ? "—" : `${(x * 100).toFixed(digits)}%`;

export const fmtNum = (x: number | null | undefined, digits = 4) =>
  x == null ? "—" : x.toFixed(digits);

export const fmtScore = (x: number | null | undefined) =>
  x == null ? "—" : x.toFixed(3);

export const truncHex = (s: string | null | undefined, chars = 8) => {
  if (!s) return "—";
  return s.length > chars + 6 ? `${s.slice(0, chars)}…${s.slice(-4)}` : s;
};

export const hfRepoUrl = (repo?: string | null, rev?: string | null) => {
  if (!repo) return null;
  return rev ? `https://huggingface.co/${repo}/tree/${rev}` : `https://huggingface.co/${repo}`;
};

export const taoExtrinsicUrl = (block: number) => `https://tao.app/extrinsic/${block}`;

export const sinceUnix = (unix?: number) => {
  if (!unix) return "—";
  const ms = Date.now() - unix * 1000;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
};
