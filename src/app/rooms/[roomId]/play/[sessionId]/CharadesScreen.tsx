"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { GameResults } from "@/components/GameResults";
import { RoundIntro } from "@/components/RoundIntro";
import { MovieTicket } from "@/components/MovieTicket";
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";

export function CharadesScreen({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  return <GuestSessionGate><Charades roomId={roomId as Id<"rooms">} sessionId={sessionId as Id<"gameSessions">} /></GuestSessionGate>;
}

type Player = { _id: Id<"roomPlayers">; displayName: string; score: number; status: string };
type Guess = { text: string; correct: boolean };

function Charades({ roomId, sessionId }: { roomId: Id<"rooms">; sessionId: Id<"gameSessions"> }) {
  const data = useQuery(api.charades.get, { sessionId });
  const guess = useMutation(api.charades.guess);
  const passTurn = useMutation(api.charades.passTurn);
  const now = useServerNow(roomId);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondsLeft = useMemo(() => {
    const state = data?.session.state;
    if (!state || state.phase !== "clueing") return 0;
    return Math.max(0, Math.ceil((state.turnStartedAt + state.turnDurationMs - now) / 1000));
  }, [data, now]);

  // Recomputed once per turn, not per tick: changing animation-delay on a
  // running animation would make the bar jump.
  const turnStyle = useMemo(() => {
    const state = data?.session.state;
    if (!state || state.phase !== "clueing") return undefined;
    return {
      "--turn-ms": `${state.turnDurationMs}ms`,
      "--turn-delay": `${state.turnStartedAt - now}ms`,
    } as CSSProperties;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.session.state?.phase, data?.session.state?.turnStartedAt]);

  if (data === undefined) return <AuthShell title="Picking a word"><div className="auth-skeleton" /></AuthShell>;
  if (!data) return <AuthShell title="Game unavailable"><p className="auth-note">This game session is no longer available.</p></AuthShell>;

  const state = data.session.state;
  const round = data.round.state;
  const players: Player[] = data.players.filter((player: Player) => player.status !== "removed");
  const nameOf = (id: string) => players.find((player) => player._id === id)?.displayName ?? "Someone";
  const isGuesser = Boolean(data.me?.isGuesser);
  const actingId = state.clueOrder?.[state.currentIndex];
  const isMyTurn = !isGuesser && data.me?._id === actingId;

  if (state.phase === "finished") {
    return (
      <GameResults
        gameSlug={data.game?.slug}
        players={players}
        winnerIds={state.winnerIds ?? []}
        mark="🎬"
        headline="That is a wrap."
        sub="A point for every word you got, one off for every word you did not. Fewest tries breaks a tie."
      />
    );
  }

  if (state.phase === "revealing" && state.reveal) {
    const reveal = state.reveal;
    return (
      <main className="auth-shell">
        <div className="auth-column">
          <header className="auth-head">
            <h1 className="page-title">
              {reveal.correct ? `${reveal.guesserName} got it.` : `${reveal.guesserName} did not get it.`}
            </h1>
            <p className="auth-sub">{reveal.correct ? `In ${reveal.triesUsed} ${reveal.triesUsed === 1 ? "try" : "tries"}. +1` : `${reveal.reason ?? ""} −1`}</p>
          </header>
          <MovieTicket word={reveal.word} category={reveal.category} serial={data.session.currentRound} />
        </div>
      </main>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setPending(true); setError(null);
    try { await guess({ sessionId, text: draft }); setDraft(""); }
    catch (thrown) { setError(errorText(thrown, "Could not send that guess.")); }
    setPending(false);
  };

  const guesses: Guess[] = state.guesses ?? [];

  return (
    <main className="auth-shell">
      <RoundIntro roundKey={`charades-${data.session.currentRound}`} label="Picking the word" />
      <div className="auth-column traitor-game">
        <header className="auth-head">
          <h1 className="page-title">Round {data.session.currentRound} of {data.session.totalRounds}</h1>
        </header>

        {isGuesser ? (
          <Card data-tone="lavender">
            <p className="label">You are guessing</p>
            <p className="body mt-2 text-[var(--color-text-secondary)]">
              Watch the room. Type what you think it is.
            </p>
          </Card>
        ) : (
          <MovieTicket word={round.word} category={round.category} serial={data.session.currentRound} />
        )}

        <div className="flex items-center justify-between">
          <span className="label">{actingId ? `${nameOf(actingId)} is acting` : "Acting"}</span>
          <span className="code-type" data-tip="Time left in this turn">{secondsLeft}s</span>
        </div>
        <div className="turn-bar" key={state.turnStartedAt} style={turnStyle}><span /></div>

        <div className="auth-stack traitor-order">
          {state.clueOrder?.map((playerId: string, index: number) => (
            <div
              key={playerId}
              className="traitor-player rise-in"
              style={{ "--i": index } as CSSProperties}
              data-active={playerId === actingId ? "true" : undefined}
              data-eliminated={index < state.currentIndex ? "true" : undefined}
              data-tip={index < state.currentIndex ? "Already acted" : playerId === actingId ? "Acting now" : "Waiting for a turn"}
            >
              <span>{nameOf(playerId)}</span>
              {playerId === actingId && <span className="label">Acting</span>}
            </div>
          ))}
        </div>

        {isGuesser ? (
          <>
            <form className="auth-stack" onSubmit={submit}>
              <Input
                label={`Your guess · ${state.triesLeft} ${state.triesLeft === 1 ? "try" : "tries"} left`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type it out"
                maxLength={60}
                autoComplete="off"
              />
              <Button type="submit" variant="primary" isBlock isLoading={pending} disabled={!draft.trim()}>
                Send guess
              </Button>
            </form>
            {guesses.length > 0 && (
              <div className="guess-list">
                {guesses.map((item, index) => (
                  <span key={index} className="guess-chip" data-correct={item.correct ? "true" : undefined}>
                    {item.text}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              isBlock
              data-tip={isMyTurn ? "End your turn early" : "Only whoever is acting can pass"}
              disabled={!isMyTurn}
              onClick={() => { void passTurn({ sessionId }); }}
            >
              {isMyTurn ? "Pass the chance" : `Waiting for ${actingId ? nameOf(actingId) : "the next player"}`}
            </Button>
            <p className="auth-note">{nameOf(state.guesserId)} is guessing. Do not say the word.</p>
          </>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
      </div>
    </main>
  );
}
