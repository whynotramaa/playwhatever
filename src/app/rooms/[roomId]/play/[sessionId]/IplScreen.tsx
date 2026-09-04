"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { IplAnswerRow, IplBoard, IplGuessBox, type Guess } from "@/components/IplBoard";
import { GameResults } from "@/components/GameResults";
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";

export function IplScreen({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  return (
    <GuestSessionGate>
      <Ipl roomId={roomId as Id<"rooms">} sessionId={sessionId as Id<"gameSessions">} />
    </GuestSessionGate>
  );
}

type Player = { _id: Id<"roomPlayers">; displayName: string; score: number; status: string };

function Ipl({ roomId, sessionId }: { roomId: Id<"rooms">; sessionId: Id<"gameSessions"> }) {
  const data = useQuery(api.ipl.get, { sessionId });
  const roster = useQuery(api.ipl.roster, {});
  const submitGuess = useMutation(api.ipl.guess);
  const now = useServerNow(roomId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guesses: Guess[] = useMemo(() => data?.me?.guesses ?? [], [data]);

  if (data === undefined) {
    return <AuthShell title="Picking a player"><div className="auth-skeleton" /></AuthShell>;
  }
  if (!data) {
    return <AuthShell title="Game unavailable"><p className="auth-note">This game session is no longer available.</p></AuthShell>;
  }

  const state = data.session.state;
  const players: Player[] = data.players.filter((player: Player) => player.status !== "removed");
  const secondsLeft = state.phase === "guessing" ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 0;

  if (state.phase === "finished") {
    return (
      <GameResults
        gameSlug={data.game?.slug}
        players={players}
        winnerIds={state.winnerIds ?? []}
        headline="Stumps."
        sub="Eight points for a first-guess call, one for scraping in, three more for getting there first."
      />
    );
  }

  if (state.phase === "revealing") {
    const reveal = state.reveal;
    const nameOf = (id: string) => players.find((player) => player._id === id)?.displayName ?? "Someone";
    return (
      <main className="auth-shell">
        <div className="auth-column">
          <header className="auth-head">
            <p className="label">Round {data.session.currentRound} of {data.session.totalRounds}</p>
            <h1 className="page-title">{reveal.answerName}</h1>
          </header>
          <Card>
            <IplAnswerRow name={reveal.answerName} attrs={reveal.answer} />
          </Card>
          <Card>
            <p className="label">Who got there</p>
            {reveal.order.length === 0 ? (
              <p className="body mt-2">Nobody. That one stays hidden.</p>
            ) : (
              <div className="auth-stack mt-3">
                {reveal.order.map((id: string, index: number) => (
                  <div key={id} className="flex items-center justify-between rise-in" style={{ "--i": index } as CSSProperties}>
                    <span><span className="muted mr-2">{index + 1}</span>{nameOf(id)}</span>
                    <b>{reveal.solved[id]} {reveal.solved[id] === 1 ? "try" : "tries"}</b>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    );
  }

  const triesLeft = state.maxTries - guesses.length;
  const done = data.me?.solved != null || triesLeft <= 0;

  const send = async (name: string) => {
    setPending(true);
    setError(null);
    try {
      await submitGuess({ sessionId, name });
    } catch (thrown) {
      setError(errorText(thrown, "Could not send that guess."));
    }
    setPending(false);
  };

  return (
    <main className="auth-shell">
      <div className="auth-column ipl-game">
        <header className="auth-head">
          <p className="label">Round {data.session.currentRound} of {data.session.totalRounds}</p>
          <h1 className="page-title">Who is the IPL player?</h1>
        </header>

        <div className="flex items-center justify-between">
          <span className="label" data-tip="Guesses you have left">{triesLeft} {triesLeft === 1 ? "try" : "tries"} left</span>
          <span className="code-type" data-tip="Time left in this round">{secondsLeft}s</span>
        </div>

        <IplBoard guesses={guesses} />

        {done ? (
          <p className="auth-note">
            {data.me?.solved != null
              ? `Got it in ${data.me.solved}. Waiting for the rest of the room.`
              : "Out of guesses. Waiting for the rest of the room."}
          </p>
        ) : (
          <IplGuessBox roster={roster} guesses={guesses} pending={pending} onGuess={(name) => void send(name)} />
        )}

        {players.length > 1 && (
          <div className="ipl-rivals">
            {state.board
              .filter((row: { playerId: string }) => players.some((player) => player._id === row.playerId))
              .map((row: { playerId: string; displayName: string; tries: number; solved: number | null }) => (
                <span key={row.playerId} className="ipl-rival" data-solved={row.solved != null ? "true" : undefined}>
                  {row.displayName}
                  <b>{row.solved != null ? `✓ ${row.solved}` : `${row.tries}/${state.maxTries}`}</b>
                </span>
              ))}
          </div>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
      </div>
    </main>
  );
}
