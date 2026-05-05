"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import type { LeaderboardResponse, Miner, PhaseInfo, RoundInfo } from "./api";
import { API_BASE, REFRESH_MS, fetcher } from "./api";

const CACHE_KEY = "connito.lastLeaderboard.v1";
const MINER_INFO_KEY = "connito.minerInfo.v1";

interface CachedSnapshot {
  cachedAt: number;
  apiTs?: number;
  leaderboard: Miner[];
  phase: PhaseInfo | null;
  round: RoundInfo | null;
}

/** Per-uid persistent metadata that the API sometimes returns null for. */
interface MinerInfo {
  hotkey?: string | null;
  hf_repo_id?: string | null;
  hf_revision?: string | null;
  lastSeenAt: number;
}
type MinerInfoMap = Record<number, MinerInfo>;

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export interface UseLeaderboardResult {
  data?: LeaderboardResponse;
  liveMiners: Miner[];
  cachedMiners: Miner[];
  /** Effective miners with hotkey/repo/revision filled from per-uid info cache when API returns null. */
  miners: Miner[];
  showingCached: boolean;
  apiAgeSeconds: number | null;
  nextRefreshSeconds: number;
  cachedAt: number | null;
  /** Look up persistent info for a uid (falls back to localStorage). */
  getMinerInfo: (uid: number) => MinerInfo | undefined;
  isLoading: boolean;
  error: unknown;
}

export function useLeaderboard(): UseLeaderboardResult {
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `${API_BASE}/api/v1/leaderboard`,
    fetcher,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: false,
      keepPreviousData: true,
      shouldRetryOnError: true,
      errorRetryInterval: 5_000,
      errorRetryCount: 999_999,
    }
  );

  const [cached, setCached] = useState<CachedSnapshot | null>(null);
  const [minerInfo, setMinerInfo] = useState<MinerInfoMap>({});

  // Bootstrap cache on mount
  useEffect(() => {
    setCached(readJson<CachedSnapshot>(CACHE_KEY));
    setMinerInfo(readJson<MinerInfoMap>(MINER_INFO_KEY) ?? {});
  }, []);

  // On every live response, update per-uid info map for any non-null fields
  useEffect(() => {
    if (!data) return;
    const live = data.data.leaderboard;
    if (!Array.isArray(live) || live.length === 0) return;

    setMinerInfo((prev) => {
      let changed = false;
      const next = { ...prev };
      const now = Date.now();
      for (const m of live) {
        const cur = next[m.uid] ?? { lastSeenAt: 0 };
        const merged: MinerInfo = {
          hotkey: m.hotkey ?? cur.hotkey,
          hf_repo_id: m.hf_repo_id ?? cur.hf_repo_id,
          hf_revision: m.hf_revision ?? cur.hf_revision,
          lastSeenAt: now,
        };
        if (
          merged.hotkey !== cur.hotkey ||
          merged.hf_repo_id !== cur.hf_repo_id ||
          merged.hf_revision !== cur.hf_revision
        ) {
          next[m.uid] = merged;
          changed = true;
        }
      }
      if (changed) writeJson(MINER_INFO_KEY, next);
      return changed ? next : prev;
    });

    // Also persist the full leaderboard if it has actually-scored miners (not all-null fields).
    const hasUseful = live.some(
      (m) => m.score != null && m.score > 0 && (m.hf_repo_id || m.hotkey)
    );
    if (live.length > 0) {
      const snap: CachedSnapshot = {
        cachedAt: Date.now(),
        apiTs: data.meta.last_success_ts,
        leaderboard: live,
        phase: data.data.phase,
        round: data.data.round,
      };
      // Only update the "previous" snapshot when it has real content; don't overwrite
      // a known-good cache with all-null junk.
      if (hasUseful) {
        writeJson(CACHE_KEY, snap);
        setCached(snap);
      }
    }
  }, [data]);

  // 1s ticker for countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const liveMiners = data?.data.leaderboard ?? [];
  const cachedMiners = cached?.leaderboard ?? [];
  const showingCached = liveMiners.length === 0 && cachedMiners.length > 0;
  const baseMiners = liveMiners.length > 0 ? liveMiners : cachedMiners;

  // Enrich each miner with cached per-uid info (only fill nulls; never overwrite live values)
  const miners: Miner[] = useMemo(() => {
    return baseMiners.map((m) => {
      const info = minerInfo[m.uid];
      if (!info) return m;
      return {
        ...m,
        hotkey: m.hotkey ?? info.hotkey ?? null,
        hf_repo_id: m.hf_repo_id ?? info.hf_repo_id ?? null,
        hf_revision: m.hf_revision ?? info.hf_revision ?? null,
      };
    });
  }, [baseMiners, minerInfo]);

  const apiAgeSeconds = data?.meta.last_success_ts
    ? Math.max(0, Math.floor(now / 1000 - data.meta.last_success_ts))
    : null;

  const pollSec = data?.meta.poll_interval_seconds ?? 12;
  const nextRefreshSeconds =
    apiAgeSeconds == null ? pollSec : Math.max(0, pollSec - (apiAgeSeconds % pollSec));

  const getMinerInfo = (uid: number) => minerInfo[uid];

  return {
    data,
    liveMiners,
    cachedMiners,
    miners,
    showingCached,
    apiAgeSeconds,
    nextRefreshSeconds,
    cachedAt: cached?.cachedAt ?? null,
    getMinerInfo,
    isLoading,
    error,
  };
}
