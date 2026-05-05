"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Miner } from "@/lib/api";
import { fmtNum, fmtPct, fmtScore, hfRepoUrl, truncHex } from "@/lib/api";

export default function Leaderboard({ miners }: { miners: Miner[] }) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const copy = [...miners].sort((a, b) => {
      const sa = a.score ?? -Infinity;
      const sb = b.score ?? -Infinity;
      if (sa !== sb) return sb - sa;
      return (a.uid ?? 0) - (b.uid ?? 0);
    });
    return copy;
  }, [miners]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => {
      const repo = (m.hf_repo_id ?? "").toLowerCase();
      const rev = (m.hf_revision ?? "").toLowerCase();
      const hk = (m.hotkey ?? "").toLowerCase();
      const uid = String(m.uid);
      return (
        uid.includes(q) ||
        repo.includes(q) ||
        rev.includes(q) ||
        hk.includes(q)
      );
    });
  }, [sorted, query]);

  if (!miners || miners.length === 0) {
    return (
      <div className="border border-ink-100 rounded-md p-10 text-center dim text-sm">
        Leaderboard is empty for this round. Validators are between rounds —
        data will populate when scoring resumes (refreshes every 12s).
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search uid, hotkey, or HF repo…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-ink-100 rounded-md bg-white focus:outline-none focus:border-ink-400 transition-colors font-mono placeholder:font-sans placeholder:text-ink-400"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink text-xs"
              aria-label="clear"
            >
              ✕
            </button>
          ) : null}
        </div>
        <div className="text-xs dim font-mono whitespace-nowrap">
          {filtered.length === sorted.length
            ? `${sorted.length} miners`
            : `${filtered.length} / ${sorted.length}`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider dim border-b border-ink-100">
              <th className="py-3 pr-4 font-medium w-12">#</th>
              <th className="py-3 pr-4 font-medium w-16">UID</th>
              <th className="py-3 pr-4 font-medium">Hotkey</th>
              <th className="py-3 pr-4 font-medium text-right">Score</th>
              <th className="py-3 pr-4 font-medium text-right">Weight</th>
              <th className="py-3 pr-4 font-medium text-right">Val&nbsp;loss</th>
              <th className="py-3 pr-4 font-medium">HF Repo</th>
              <th className="py-3 pl-4 font-medium text-right w-16">Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center dim text-sm">
                  No miners match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const realRank = sorted.findIndex(
                  (s) => s.uid === m.uid && s.hotkey === m.hotkey
                );
                const repoUrl = hfRepoUrl(m.hf_repo_id, m.hf_revision);
                const score = m.score;
                const isTop3 = realRank < 3 && score != null && score > 0;
                return (
                  <tr
                    key={m.uid + (m.hotkey ?? "")}
                    className="row-link border-b border-ink-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/miner/${m.uid}`}
                        className={`font-mono ${
                          isTop3 ? "font-semibold" : "dim"
                        }`}
                      >
                        {realRank + 1}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      <Link
                        href={`/miner/${m.uid}`}
                        className="hover:underline"
                      >
                        {m.uid}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono dim">
                      <Link
                        href={`/miner/${m.uid}`}
                        className="hover:text-ink"
                      >
                        {truncHex(m.hotkey)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">
                      {fmtScore(score)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums dim">
                      {fmtPct(m.weight_submitted)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">
                      {fmtNum(m.val_loss, 4)}
                    </td>
                    <td className="py-3 pr-4 font-mono dim">
                      {repoUrl ? (
                        <a
                          href={repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-ink hover:underline"
                        >
                          {m.hf_repo_id}
                          {m.hf_revision ? (
                            <span className="dim">
                              @{m.hf_revision.slice(0, 7)}
                            </span>
                          ) : null}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      {m.in_assignment ? (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-ink"
                          title="in assignment"
                        />
                      ) : (
                        <span
                          className="inline-block w-2 h-2 rounded-full border border-ink-200"
                          title="not in assignment"
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs dim flex items-baseline gap-3 flex-wrap">
        <span>ranked by score this round · click row for details</span>
        <span className="font-mono">
          score: <span className="text-ink">2.25</span> #1 ·{" "}
          <span className="text-ink">1.5</span> #2 ·{" "}
          <span className="text-ink">1.0</span> #3 · 0 otherwise (rank-bucketed
          per round, EMA over 8 rounds drives chain weight)
        </span>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}
