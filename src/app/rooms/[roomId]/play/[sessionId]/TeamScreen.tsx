"use client";

import { useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { Gavel, LogOut } from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { Card } from "@/components/Card";
import { GameResults } from "@/components/GameResults";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { MovieTicket } from "@/components/MovieTicket";
import { RoundIntro } from "@/components/RoundIntro";
import { TierBoard } from "@/components/TierBoard";
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";
import { RAISES, TURN_SECONDS, categoryLabel } from "../../../../../../convex/teamRules";

export function TeamScreen({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  return (
    <GuestSessionGate>
      <Team roomId={roomId as Id<"rooms">} sessionId={sessionId as Id<"gameSessions">} />
    </GuestSessionGate>
  );
}

type Player = { _id: Id<"roomPlayers">; displayName: string; score: number; status: string };
type Owned = { title: string; tag: string; price: number; rating?: number };

function Team({ roomId, sessionId }: { roomId: Id<"rooms">; sessionId: Id<"gameSessions"> }) {
  const data = useQuery(api.team.get, { sessionId });
  const raise = useMutation(api.team.raise);
  const leaveBid = useMutation(api.team.leaveBid);
  const now = useServerNow(roomId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (data === undefined) {
    return <AuthShell title="Opening the auction"><div className="auth-skeleton" /></AuthShell>;
  }
  if (!data) {
    return <AuthShell title="Game unavailable"><p className="auth-note">This game session is no longer available.</p></AuthShell>;
  }

  const state = data.session.state;
  const players: Player[] = data.players.filter((player: Player) => player.status !== "removed");
  const nameOf = (id: string | null) => players.find((player) => player._id === id)?.displayName ?? "Nobody";
  const myId = data.me?._id as string | undefined;
  const purse = myId ? (state.purses[myId] ?? 0) : 0;
  const squads = state.squads as Record<string, Owned[]>;

  if (state.phase === "finished") {
    return (
      <GameResults
        gameSlug={data.game?.slug}
        players={players}
        winnerIds={state.winnerIds ?? []}
        headline="Squads are in."
        sub="A squad scores what it is worth, not what it cost. Money left in the purse buys nothing."
        mark="🧾"
        winnerTag="Best squad"
      >
        <TierBoard
          category={categoryLabel(state.category)}
          players={players.map((player) => ({
            id: player._id as string,
            name: player.displayName,
            score: player.score,
            spent: state.budget - (state.purses[player._id as string] ?? 0),
            squad: squads[player._id as string] ?? [],
          }))}
        />
      </GameResults>
    );
  }

  const act = async (run: () => Promise<unknown>) => {
    setPending(true);
    setError(null);
    try { await run(); } catch (thrown) { setError(errorText(thrown, "That bid did not go through.")); }
    setPending(false);
  };

  const secondsLeft = Math.max(0, Math.ceil((state.deadline - now) / 1000));
  const myTurn = Boolean(myId && state.turnId === myId && state.phase === "bidding");
  const iAmOut = Boolean(myId && state.out.includes(myId));
  const holding = Boolean(myId && state.bidderId === myId);
  const closed = state.phase === "sold";
  // The lot on the block and the lot just closed are the same row of state, so
  // the ticket never unmounts. The gavel adds a stamp to it, that is all.
  const lot = closed ? state.sold?.lot : state.current;

  return (
    <main className="auth-shell">
      {/* Once, at the top of the auction. Twelve lots means twelve countdowns
          if this keys off the lot number, and nobody needs telling to look up
          twelve times. */}
      <RoundIntro roundKey="team-open" label={categoryLabel(state.category)} />
      <div className="auth-column">
        <header className="auth-head">
          <p className="label">Lot {state.lot + 1} of {data.session.totalRounds} · {categoryLabel(state.category)}</p>
        </header>

        <MovieTicket
          word={lot?.title ?? "Next lot"}
          category={lot?.tag}
          serial={state.lot + 1}
          brand="Make Your Team · Auction"
          stub={closed ? "Gavel Down" : "On The Block"}
          serialLabel="Lot"
          stamp={closed ? (state.sold?.winnerId ? "Sold" : "Unsold") : undefined}
        />

        {closed ? (
          <p className="lot-sold-line">
            {state.sold?.winnerId
              ? <>to <b>{nameOf(state.sold.winnerId)}</b> for <b>₹{state.sold.price}</b></>
              : "Nobody wanted it. Straight to the next one."}
          </p>
        ) : (
          <>
            {/* Bid, clock and purse in one board. A bidder reads all three in
                the same glance, so they should not be three panels. */}
            <section className="bid-board">
              <div className="bid-head">
                <div>
                  <span className="label">Current bid</span>
                  <p className="bid-amount">₹{state.bid}</p>
                  <p className="small muted">{state.bidderId ? `${nameOf(state.bidderId)} holds it` : "No bids yet"}</p>
                </div>
                <div className="bid-turn">
                  <div
                    className="bid-clock"
                    style={{ "--sweep": Math.min(1, secondsLeft / TURN_SECONDS) } as CSSProperties}
                    data-low={secondsLeft <= 5 ? "true" : undefined}
                    data-mine={myTurn ? "true" : undefined}
                  >
                    <span className="bid-seconds">{secondsLeft}</span>
                  </div>
                  <span className="label bid-turn-name">{myTurn ? "Your turn" : nameOf(state.turnId)}</span>
                </div>
              </div>

              <div className="bid-purse">
                <div className="bid-purse-head">
                  <span className="label">Your purse</span>
                  <span className="bid-purse-num">₹{purse}<span className="muted"> of ₹{state.budget}</span></span>
                </div>
                <div className="bid-purse-track">
                  <span className="bid-purse-fill" style={{ width: `${(purse / state.budget) * 100}%` }} />
                </div>
              </div>
            </section>

            {myTurn ? (
              <div className="bid-pad-wrap">
                <span className="label">Raise the bid</span>
                <div className="bid-pad">
                  {RAISES.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="bid-key"
                      disabled={pending || state.bid + amount > purse}
                      onClick={() => void act(() => raise({ sessionId, amount }))}
                    >
                      <span className="bid-key-plus">+</span>
                      <span className="bid-key-num">{amount}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-outline btn-block" disabled={pending} onClick={() => void act(() => leaveBid({ sessionId }))}>
                  <span className="btn-label inline-flex items-center gap-2">
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Leave the bid
                  </span>
                </button>
              </div>
            ) : (
              <p className="auth-note">
                {holding
                  ? "You hold the top bid. If it comes back to you, the lot is yours."
                  : iAmOut
                    ? "You walked away from this one. Next lot in a moment."
                    : purse < state.bid + 1
                      ? "You cannot cover the next bid, so the auctioneer skips you."
                      : `Waiting on ${nameOf(state.turnId)}.`}
              </p>
            )}
          </>
        )}

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="label">The room</span>
            <span className="small muted" data-tip="Everyone started with the same purse">₹{state.budget} each</span>
          </div>
          <div className="auth-stack">
            {players.map((player, index) => {
              const id = player._id as string;
              const squad = squads[id] ?? [];
              return (
                <div
                  key={id}
                  className="bidder-row rise-in"
                  style={{ "--i": index } as CSSProperties}
                  data-turn={state.turnId === id ? "true" : undefined}
                  data-out={state.out.includes(id) ? "true" : undefined}
                >
                  <span className="bidder-name">
                    {state.bidderId === id && <Gavel className="w-3.5 h-3.5" aria-hidden="true" />}
                    {player.displayName}
                  </span>
                  <span className="bidder-meta">
                    <b>₹{state.purses[id] ?? 0}</b>
                    <span className="muted">{squad.length} {squad.length === 1 ? "lot" : "lots"}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {myId && (squads[myId]?.length ?? 0) > 0 && (
          <Card variant="flat">
            <span className="label">Your squad</span>
            <div className="squad-list mt-3">
              {squads[myId].map((lot) => (
                <span key={lot.title} className="squad-chip">
                  {lot.title}
                  <b>₹{lot.price}</b>
                </span>
              ))}
            </div>
          </Card>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
      </div>
    </main>
  );
}
