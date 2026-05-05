"use client";

import Link from "next/link";
import type { Miner } from "@/lib/api";
import { fmtNum, fmtPct, fmtScore, hfRepoUrl, truncHex } from "@/lib/api";

export default function Leaderboard({ miners }: { miners: Miner[] }) {
  if (!miners || miners.length === 0) {
    return (
      <div className="border border-ink-100 rounded-md p-10 text-center dim text-sm">
        Leaderboard is empty for this round. Validators are between rounds — data
        will populate when scoring resumes (refreshes every 12s).
      </div>
    );
  }

  // Sort: scored first by score desc, then unscored alphabetically by uid
  const sorted = [...miners].sort((a, b) => {
    const sa = a.score ?? -Infinity;
    const sb = b.score ?? -Infinity;
    if (sa !== sb) return sb - sa;
    return (a.uid ?? 0) - (b.uid ?? 0);
  });

  return (
    <div>
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
            {sorted.map((m, i) => {
              const repoUrl = hfRepoUrl(m.hf_repo_id, m.hf_revision);
              const score = m.score;
              const isTop3 = i < 3 && score != null && score > 0;
              return (
                <tr
                  key={m.uid + m.hotkey}
                  className="row-link border-b border-ink-100 last:border-b-0"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/miner/${m.uid}`}
                      className={`font-mono ${isTop3 ? "font-semibold" : "dim"}`}
                    >
                      {i + 1}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-mono">
                    <Link href={`/miner/${m.uid}`} className="hover:underline">
                      {m.uid}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-mono dim">
                    <Link href={`/miner/${m.uid}`} className="hover:text-ink">
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
                          <span className="dim">@{m.hf_revision.slice(0, 7)}</span>
                        ) : null}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {m.in_assignment ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-ink" title="in assignment" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full border border-ink-200" title="not in assignment" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs dim">
        {sorted.length} miners shown · ranked by score this round · click row for
        details.
      </p>
    </div>
  );
}
