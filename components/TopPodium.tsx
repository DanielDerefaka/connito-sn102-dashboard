"use client";

import Link from "next/link";
import type { Miner } from "@/lib/api";
import { fmtNum, fmtScore, hfRepoUrl, truncHex } from "@/lib/api";

const CROWN_GOLD = "#d4a017";
const CROWN_SILVER = "#737373";
const CROWN_BRONZE = "#92400e";

function CrownIcon({ color, size = 28 }: { color: string; size?: number }) {
  // Simple 5-point crown SVG, single color, monochrome friendly.
  return (
    <svg
      width={size}
      height={(size * 18) / 28}
      viewBox="0 0 28 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1 4.5 L5 13 L9.5 6 L14 14 L18.5 6 L23 13 L27 4.5 L25 17 H3 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="1" cy="4" r="1.6" fill={color} />
      <circle cx="14" cy="3" r="1.8" fill={color} />
      <circle cx="27" cy="4" r="1.6" fill={color} />
    </svg>
  );
}

interface PodiumCardProps {
  miner: Miner | undefined;
  rank: 1 | 2 | 3;
}

function PodiumCard({ miner, rank }: PodiumCardProps) {
  const accent =
    rank === 1 ? CROWN_GOLD : rank === 2 ? CROWN_SILVER : CROWN_BRONZE;
  const label = rank === 1 ? "1ST" : rank === 2 ? "2ND" : "3RD";
  const elevation = rank === 1 ? "md:-mt-3" : "";

  if (!miner) {
    return (
      <div
        className={`border border-dashed border-ink-100 rounded-md p-5 flex flex-col items-center text-center ${elevation}`}
      >
        <div className="opacity-30 mb-2">
          <CrownIcon color={accent} size={rank === 1 ? 36 : 28} />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider dim mb-2">
          {label}
        </div>
        <div className="dim text-sm">no miner</div>
      </div>
    );
  }

  const repoUrl = hfRepoUrl(miner.hf_repo_id, miner.hf_revision);

  return (
    <Link
      href={`/miner/${miner.uid}`}
      className={`group block border rounded-md p-5 hover:bg-ink-50/50 transition-colors ${elevation}`}
      style={{
        borderColor: accent,
        borderWidth: rank === 1 ? "2px" : "1px",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">
          <CrownIcon color={accent} size={rank === 1 ? 36 : 28} />
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-wider mb-3"
          style={{ color: accent }}
        >
          {label} · rank #{rank}
        </div>
        <div className="font-mono text-2xl mb-0.5">
          uid <span className="font-semibold">{miner.uid}</span>
        </div>
        <div className="font-mono text-xs dim mb-3">
          {miner.hotkey ? truncHex(miner.hotkey, 10) : "—"}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs mt-2 pt-3 border-t border-ink-100">
          <div className="text-left">
            <div className="dim uppercase tracking-wider text-[10px]">Score</div>
            <div className="font-mono text-base font-semibold">
              {fmtScore(miner.score)}
            </div>
          </div>
          <div className="text-right">
            <div className="dim uppercase tracking-wider text-[10px]">
              Val loss
            </div>
            <div className="font-mono text-base">
              {fmtNum(miner.val_loss, 4)}
            </div>
          </div>
        </div>
      </div>

      {repoUrl ? (
        <div className="mt-3 pt-3 border-t border-ink-100 text-center">
          <span className="font-mono text-[10px] dim group-hover:text-ink">
            {miner.hf_repo_id}
            {miner.hf_revision ? `@${miner.hf_revision.slice(0, 7)}` : ""}
          </span>
        </div>
      ) : null}
    </Link>
  );
}

export default function TopPodium({ miners }: { miners: Miner[] }) {
  // Take top 3 by score; only consider miners with positive score
  const ranked = [...miners]
    .filter((m) => (m.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  if (ranked.length === 0) {
    return null;
  }

  const [first, second, third] = ranked;

  return (
    <section className="mb-8">
      <h2 className="text-xs uppercase tracking-wider dim mb-4 text-center">
        Round leaders
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* visual order on desktop: 2nd, 1st, 3rd (classic podium) */}
        <div className="md:order-1">
          <PodiumCard miner={second} rank={2} />
        </div>
        <div className="md:order-2">
          <PodiumCard miner={first} rank={1} />
        </div>
        <div className="md:order-3">
          <PodiumCard miner={third} rank={3} />
        </div>
      </div>
    </section>
  );
}
