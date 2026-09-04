"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { GameResults } from "@/components/GameResults";
import { MaskMark, Postcard } from "@/components/Postcard";
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";

export function PlayScreen({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  return <GuestSessionGate><Game roomId={roomId as Id<"rooms">} sessionId={sessionId as Id<"gameSessions">} /></GuestSessionGate>;
}

function Game({ roomId, sessionId }: { roomId: Id<"rooms">; sessionId: Id<"gameSessions"> }) {
  const data = useQuery(api.traitors.get, { sessionId });
  const passTurn = useMutation(api.traitors.passTurn);
  const vote = useMutation(api.traitors.vote);
  const now = useServerNow(roomId);
  const [voteOpen, setVoteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVoteOpen(data?.session.state.phase === "voting");
  }, [data?.session.state.phase]);

  // One clock. Which deadline it counts down to depends on the phase.
  const secondsLeft = useMemo(() => {
    const state = data?.session.state;
    if (!state) return 0;
    const deadline =
      state.phase === "speaking" ? state.turnStartedAt + state.turnDurationMs
      : state.phase === "voting" ? state.votingEndsAt
      : state.phase === "discussing" ? state.discussEndsAt
      : null;
    return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  }, [data, now]);

  // Recomputed once per turn, not per tick: changing animation-delay on a
  // running animation would make the bar jump.
  const turnStyle = useMemo(() => {
    const state = data?.session.state;
    if (!state || state.phase !== "speaking") return undefined;
    return {
      "--turn-ms": `${state.turnDurationMs}ms`,
      "--turn-delay": `${state.turnStartedAt - now}ms`,
    } as CSSProperties;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.session.state?.phase, data?.session.state?.turnStartedAt]);

  if (data === undefined) return <AuthShell title="Setting the table"><div className="auth-skeleton" /></AuthShell>;
  if (!data) return <AuthShell title="Game unavailable"><p className="auth-note">This game session is no longer available.</p></AuthShell>;

  const state = data.session.state;
  const active = data.players.filter((player: { _id: string }) => state.activePlayerIds.includes(player._id));
  // A revote is only ever between the players who tied.
  const candidates = state.tiedIds ? active.filter((player: { _id: string }) => state.tiedIds.includes(player._id)) : active;
  const activeId = state.speakingOrder[state.currentPlayerIndex];
  const isMyTurn = data.me?._id === activeId && state.phase === "speaking";
  const myVote = state.votes[data.me?._id ?? ""];
  const submitVote = async (targetPlayerId: Id<"roomPlayers">) => {
    setPending(true); setError(null);
    try { await vote({ sessionId, targetPlayerId }); setVoteOpen(false); } catch (thrown) { setError(errorText(thrown, "Could not record that vote.")); }
    setPending(false);
  };

  if (state.phase === "discussing") {
    const tied = data.players.filter((player: { _id: string }) => (state.tiedIds ?? []).includes(player._id));
    return (
      <main className="auth-shell">
        <div className="auth-column">
          <header className="auth-head">
            <h1 className="page-title">It is a tie.</h1>
            <p className="auth-sub">Fifteen seconds to argue, then you vote again between them.</p>
          </header>
          <Card data-tone="lavender">
            <div className="flex items-center justify-between mb-4"><span className="label">Tied</span><span className="code-type" data-tip="Time left to argue">{secondsLeft}s</span></div>
            <div className="auth-stack">{tied.map((player: { _id: string; displayName: string }) => <div key={player._id} className="traitor-player"><span>{player.displayName}</span></div>)}</div>
          </Card>
        </div>
      </main>
    );
  }

  // The reveal is its own phase so nobody misses the result of their vote.
  if (state.phase === "revealing" && state.reveal) {
    const reveal = state.reveal;
    return (
      <main className="auth-shell">
        <div className="auth-column">
          <div className="traitor-reveal" aria-hidden="true"><span>●</span><span>●</span><span>●</span><span>●</span><b>✦</b></div>
          <header className="auth-head rise-in" style={{ "--i": 4 } as CSSProperties}>
            <h1 className="page-title">{reveal.playerId ? `${reveal.displayName} was voted out.` : "Nobody goes out."}</h1>
            <p className="auth-sub">
              {reveal.playerId
                ? `${reveal.displayName} was ${reveal.wasTraitor ? "" : "not "}the traitor.`
                : `${reveal.reason} Everyone stays in.`}
            </p>
          </header>
          <Card data-tone={reveal.wasTraitor ? "mint" : "peach"}>
            <p className="label">{reveal.gameOver ? "That ends it" : "Next round"}</p>
            <p className="body mt-2 text-[var(--color-text-secondary)]">
              {reveal.gameOver
                ? "Sit tight for the result."
                : "Fresh names are coming, and the speaking order gets reshuffled."}
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (state.phase === "finished") {
    const traitorWon = state.winner === "traitor";
    const traitor = data.players.find((player: { _id: string }) => player._id === state.revealedTraitorId);
    const winnerIds = data.players
      .filter((player: { _id: string }) =>
        traitorWon
          ? player._id === state.revealedTraitorId
          : player._id !== state.revealedTraitorId && state.activePlayerIds.includes(player._id)
      )
      .map((player: { _id: string }) => player._id);
    return (
      <GameResults
        gameSlug={data.game?.slug}
        players={data.players}
        winnerIds={winnerIds}
        mark={traitorWon ? <MaskMark /> : "🪷"}
        winnerTag={traitorWon ? <><MaskMark className="is-inline" />Traitor</> : undefined}
        headline={traitorWon ? "The traitor survived." : "The traitor was found."}
        sub={traitorWon ? "The last two players could not expose them in time." : "Good reading. The room got there."}
      >
        {/* Only worth naming when they lost. If they won, their name is the card. */}
        {traitor && !traitorWon && (
          <Card variant="flat" data-tone="peach">
            <p className="label">The traitor</p>
            <p className="section-title mt-2">{traitor.displayName}</p>
          </Card>
        )}
      </GameResults>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-column traitor-game">
        <header className="auth-head"><h1 className="page-title">Round {data.session.currentRound}</h1></header>
        <Postcard
          role={data.me?.assignment?.isTraitor ? "traitor" : "innocent"}
          word={data.me?.assignment?.name ?? "Your name"}
        />
        <div className="flex items-center justify-between"><span className="label">Speaking order</span>{state.phase === "speaking" ? <span className="code-type" data-tip="Time left in this turn">{secondsLeft}s</span> : <span className="label">Voting</span>}</div>
        {state.phase === "speaking" && (
          <div className="turn-bar" key={state.turnStartedAt} style={turnStyle}>
            <span />
          </div>
        )}
        <div className="auth-stack traitor-order">{state.speakingOrder.map((playerId: string, index: number) => { const player = data.players.find((item: { _id: string }) => item._id === playerId); return player ? <div key={playerId} className="traitor-player rise-in" style={{ "--i": index } as CSSProperties} data-active={playerId === activeId ? "true" : undefined} data-eliminated={!state.activePlayerIds.includes(playerId) ? "true" : undefined} data-tip={!state.activePlayerIds.includes(playerId) ? "Voted out" : playerId === activeId ? "Speaking now" : `Speaks ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}`}><span>{player.displayName}</span>{playerId === activeId && <span className="label">Speaking</span>}</div> : null; })}</div>
        {state.phase === "speaking" && <Button variant="secondary" isBlock data-tip={isMyTurn ? "End your turn early" : "Only the speaker can pass"} disabled={!isMyTurn} onClick={() => { void passTurn({ sessionId }); }}>{isMyTurn ? "Pass the chance" : `Waiting for ${data.players.find((player: { _id: string }) => player._id === activeId)?.displayName ?? "the next player"}`}</Button>}
        {state.phase === "voting" && <Button variant="primary" isBlock data-tip={myVote ? "You can change it until the clock runs out" : "One vote each"} onClick={() => setVoteOpen(true)}>{myVote ? "Change your vote" : "Vote out a player"} · {secondsLeft}s</Button>}
        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
      </div>
      <Modal isOpen={voteOpen} onClose={() => setVoteOpen(false)} title={state.tiedIds ? "Revote between the tied players" : "Vote out the traitor"}>
        <div className="auth-stack">{candidates.map((player: { _id: Id<"roomPlayers">; displayName: string }) => <Button key={player._id} variant={myVote === player._id ? "yellow" : "outline"} isBlock data-tip={player._id === data.me?._id ? "You cannot vote for yourself" : myVote === player._id ? "Your current vote" : undefined} disabled={player._id === data.me?._id || pending} onClick={() => void submitVote(player._id)}>{player.displayName}{player._id === data.me?._id ? " (you)" : ""}</Button>)}</div>
      </Modal>
    </main>
  );
}
