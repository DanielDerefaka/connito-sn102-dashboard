"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Miner } from "@/lib/api";
import {
  fmtNum,
  fmtPct,
  fmtScore,
  hfRepoUrl,
  sinceUnix,
} from "@/lib/api";
import { useLeaderboard } from "@/lib/useLeaderboard";

export default function MinerDetailPage() {
  const params = useParams();
  const uid = Number(params?.uid);

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
  const miner: Miner | undefined = miners.find((m) => m.uid === uid);
  const phase = data?.data.phase;
  const round = data?.data.round;
  const meta = data?.meta;

  const sorted = [...miners].sort(
    (a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity)
  );
  const rank = sorted.findIndex((m) => m.uid === uid);

  return (
    <>
      <div className="mb-8">
        <Link href="/" className="text-sm dim hover:text-ink">
          ← back to leaderboard
        </Link>
      </div>

      {error && data ? (
        <div className="mb-6 px-3 py-2 text-xs font-mono border border-ink-100 rounded-md flex items-center justify-between">
          <span>
            api error · last good data shown ·{" "}
            {httpStatus ? `HTTP ${httpStatus}` : "network"}
          </span>
          <span className="dim">retrying 5s…</span>
        </div>
      ) : null}

      {error && !data ? (
        <div className="border border-ink-100 rounded-md p-10 text-center dim text-sm">
          api unavailable
          {httpStatus ? <> (HTTP <span className="font-mono">{httpStatus}</span>)</> : null}
          . retrying every 5s.
        </div>
      ) : null}

      {showingCached ? (
        <div className="mb-6 px-3 py-2 text-xs font-mono border border-dashed border-ink-200 rounded-md flex items-center justify-between">
          <span>
            no current round · showing previous data
            {cachedAt ? (
              <span className="dim ml-2">
                (cached {fmtRelMs(Date.now() - cachedAt)})
              </span>
            ) : null}
          </span>
          <span className="dim">next poll in {nextRefreshSeconds}s</span>
        </div>
      ) : null}

      {isLoading && !data ? <div className="dim text-sm">Loading…</div> : null}

      {data && !miner ? (
        <div className="border border-ink-100 rounded-md p-6 text-sm">
          <div className="text-base font-medium mb-2">
            uid <span className="font-mono">{uid}</span> isn&apos;t in this
            round&apos;s eval roster
          </div>
          <p className="dim mb-3">
            The dashboard shows only miners the validator picked to evaluate{" "}
            <em>this specific round</em> (foreground top-N + background staleness
            rotation). Validators only score ~30-70 miners per round, so most
            uids skip any given round.
          </p>
          <p className="dim mb-3">
            <strong className="text-ink">This does NOT mean the miner isn&apos;t earning.</strong>{" "}
            Chain incentive is a rolling 8-round average — if uid {uid} was scored in
            previous rounds, it&apos;s still earning emission even when not in the
            current round&apos;s roster.
          </p>
          <p className="dim text-xs">
            For chain-wide stats (incentive, emission, stake), query the metagraph
            directly via{" "}
            <code className="font-mono text-ink">
              python scripts/check_chain_state.py
            </code>{" "}
            on the miner box, or watch{" "}
            <a
              href={`https://tao.app/subnet/102/uid/${uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:underline"
            >
              tao.app/subnet/102/uid/{uid}
            </a>
            .
          </p>
          <div className="mt-4 pt-3 border-t border-ink-100 text-xs dim">
            next leaderboard poll in{" "}
            <span className="font-mono text-ink">{nextRefreshSeconds}s</span>
          </div>
        </div>
      ) : null}

      {miner ? (
        <>
          <header className="border-b border-ink-100 pb-8 mb-8">
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tightest">
                  uid <span className="font-mono">{miner.uid}</span>
                </h1>
                {miner.hotkey ? (
                  <p className="mt-2 text-sm font-mono dim">{miner.hotkey}</p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider dim mb-1">Rank</div>
                <div className="font-mono text-2xl">
                  {rank >= 0 ? `#${rank + 1}` : "—"}
                  <span className="dim text-sm font-sans">
                    {" "}
                    / {miners.length}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 mb-10 text-sm">
            <Field label="Score">
              <span className="font-mono text-2xl">{fmtScore(miner.score)}</span>
            </Field>
            <Field label="Weight submitted">
              <span className="font-mono text-2xl">{fmtPct(miner.weight_submitted)}</span>
            </Field>
            <Field label="Val loss">
              <span className="font-mono text-2xl">{fmtNum(miner.val_loss, 4)}</span>
              {round?.baseline_loss != null && miner.val_loss != null ? (
                <DeltaBadge value={miner.val_loss - round.baseline_loss} />
              ) : null}
            </Field>
            <Field label="Δ loss vs base">
              <span className="font-mono text-2xl">{fmtNum(miner.delta_loss, 4)}</span>
            </Field>

            <Field label="In assignment" wide>
              {miner.in_assignment ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ink inline-block" />
                  yes
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 dim">
                  <span className="w-2 h-2 rounded-full border border-ink-200 inline-block" />
                  no
                </span>
              )}
            </Field>

            <Field label="Round">
              <span className="font-mono">{round?.id ?? "—"}</span>
            </Field>
            <Field label="Baseline">
              <span className="font-mono">
                {round?.baseline_loss != null
                  ? round.baseline_loss.toFixed(4)
                  : "—"}
              </span>
            </Field>
            <Field label="Phase">
              {phase?.name ?? "—"}
              {phase?.blocks_remaining != null ? (
                <span className="dim font-mono ml-2">· {phase.blocks_remaining}b</span>
              ) : null}
            </Field>
          </div>

          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-wider dim mb-3">
              HuggingFace submission
            </h2>
            {miner.hf_repo_id ? (
              <div className="border border-ink-100 rounded-md p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="font-mono text-base">
                      <a
                        href={hfRepoUrl(miner.hf_repo_id, miner.hf_revision) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {miner.hf_repo_id}
                      </a>
                    </div>
                    {miner.hf_revision ? (
                      <div className="text-xs dim font-mono mt-1">
                        revision: {miner.hf_revision}
                      </div>
                    ) : null}
                  </div>
                  <a
                    href={hfRepoUrl(miner.hf_repo_id, miner.hf_revision) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-wider dim hover:text-ink"
                  >
                    open ↗
                  </a>
                </div>
                {miner.hf_repo_id && miner.hf_revision ? (
                  <div className="mt-4 text-xs dim font-mono">
                    <a
                      className="hover:text-ink hover:underline"
                      href={`${hfRepoUrl(miner.hf_repo_id, miner.hf_revision)}/model_expgroup_0.pt`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      model_expgroup_0.pt ↗
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border border-dashed border-ink-200 rounded-md p-5 text-sm dim">
                The validator&apos;s payload for this round didn&apos;t include
                an HF repo for uid {uid}.{" "}
                <span className="text-ink">
                  This doesn&apos;t mean the miner has no submission
                </span>{" "}
                — score / weight / val_loss are populated, so a checkpoint was
                evaluated. The repo+revision fields will populate again when the
                validator emits a complete leaderboard payload (this dashboard
                caches them per-uid once seen).
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-wider dim mb-3">Hotkey</h2>
            {miner.hotkey ? (
              <div className="font-mono text-xs break-all dim">{miner.hotkey}</div>
            ) : (
              <div className="text-sm dim">
                Not provided by the validator this round. Will populate once
                the API returns a complete payload.
              </div>
            )}
          </section>
        </>
      ) : null}

      <footer className="mt-16 pt-6 border-t border-ink-100 text-xs dim font-mono flex items-center justify-between">
        <span>
          {meta?.last_success_ts ? (
            <>
              <span className="dot" />
              updated {sinceUnix(meta.last_success_ts)}
            </>
          ) : null}
        </span>
        <span>
          uid {uid} · refresh in {nextRefreshSeconds}s
        </span>
      </footer>
    </>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wider dim mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const cls = value < 0 ? "pos" : value > 0 ? "neg" : "dim";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`ml-2 text-xs font-mono ${cls}`}>
      ({sign}
      {value.toFixed(4)})
    </span>
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
