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
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";

export function LiarScreen({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  return <GuestSessionGate><Liar roomId={roomId as Id<"rooms">} sessionId={sessionId as Id<"gameSessions">} /></GuestSessionGate>;
}

type Player = { _id: Id<"roomPlayers">; displayName: string; score: number; status: string };

function Liar({ roomId, sessionId }: { roomId: Id<"rooms">; sessionId: Id<"gameSessions"> }) {
  const data = useQuery(api.liar.get, { sessionId });
  const submitAnswer = useMutation(api.liar.submitAnswer);
  const vote = useMutation(api.liar.vote);
  const now = useServerNow(roomId);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondsLeft = useMemo(() => {
    const deadline = data?.session.state.deadline;
    const phase = data?.session.state.phase;
    if (!deadline || (phase !== "answering" && phase !== "voting")) return 0;
    return Math.max(0, Math.ceil((deadline - now) / 1000));
  }, [data, now]);

  if (data === undefined) return <AuthShell title="Thinking of a question"><div className="auth-skeleton" /></AuthShell>;
  if (!data) return <AuthShell title="Game unavailable"><p className="auth-note">This game session is no longer available.</p></AuthShell>;

  const state = data.session.state;
  const round = data.round.state;
  const players: Player[] = data.players.filter((player: Player) => player.status !== "removed");
  const nameOf = (id: string) => players.find((player) => player._id === id)?.displayName ?? "Someone";

  if (state.phase === "finished") {
    return (
      <GameResults
        gameSlug={data.game?.slug}
        players={players}
        winnerIds={state.winnerIds ?? []}
        headline="That is the last question."
        sub="Two for catching the liar, three for getting away with it."
      />
    );
  }

  if (state.phase === "revealing") {
    const reveal = state.reveal;
    return (
      <main className="auth-shell">
        <div className="auth-column">
          <div className="traitor-reveal" aria-hidden="true"><span>●</span><span>●</span><span>●</span><span>●</span><b>✦</b></div>
          <header className="auth-head rise-in" style={{ "--i": 4 } as CSSProperties}>
            <h1 className="page-title">{nameOf(reveal.liarId)} was lying.</h1>
            <p className="auth-sub">
              {reveal.caughtBy.length === 0
                ? "Nobody saw it."
                : `${reveal.caughtBy.map((id: string) => nameOf(id)).join(", ")} saw through it.`}
            </p>
          </header>
          <Card data-tone={reveal.liarSurvived ? "peach" : "mint"}>
            <p className="label">Their answer</p>
            <p className="body mt-2 text-lg">{state.answers[reveal.liarId] ?? "They said nothing at all."}</p>
            <p className="small muted mt-3">{reveal.liarSurvived ? "Most of the room pointed elsewhere. +3" : "The room got there. +2 each."}</p>
          </Card>
        </div>
      </main>
    );
  }

  const answering = state.phase === "answering";
  const answered: string[] = state.answered ?? [];

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setPending(true); setError(null);
    try {
      await submitAnswer({ sessionId, text: draft });
      setDraft("");
    } catch (thrown) {
      setError(errorText(thrown, "Could not send that answer."));
    }
    setPending(false);
  };

  const castVote = async (targetPlayerId: Id<"roomPlayers">) => {
    setPending(true); setError(null);
    try { await vote({ sessionId, targetPlayerId }); } catch (thrown) { setError(errorText(thrown, "Could not record that vote.")); }
    setPending(false);
  };

  return (
    <main className="auth-shell">
      <RoundIntro roundKey={`liar-${data.session.currentRound}`} label="Picking the question" />
      <div className="auth-column traitor-game">
        <header className="auth-head">
          <p className="label">Round {data.session.currentRound} of {data.session.totalRounds}</p>
          <h1 className="page-title">{round.question}</h1>
        </header>

        {answering && (
          <p className="auth-note">{data.me?.isLiar ? "You are the liar." : "Answer honestly."}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="label">
            {answering ? `${answered.length} of ${players.length} answered` : "Who was lying?"}
          </span>
          <span className="code-type" data-tip={answering ? "Time left to answer" : "Time left to vote"}>{secondsLeft}s</span>
        </div>

        {answering ? (
          data.me?.answer ? (
            <p className="auth-note">You said “{data.me.answer}”. Waiting for the rest of the room.</p>
          ) : (
            <form className="auth-stack" onSubmit={send}>
              <Input
                label="Your answer"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="keep it short"
                maxLength={120}
                autoFocus
              />
              <Button type="submit" variant="primary" isBlock isLoading={pending} disabled={!draft.trim()}>Lock it in</Button>
            </form>
          )
        ) : (
          <>
            <div className="auth-stack">
              {players.map((player, index) => (
                <div key={player._id} className="traitor-player rise-in" style={{ "--i": index } as CSSProperties} data-active={data.me?.vote === player._id ? "true" : undefined}>
                  <span>
                    <b>{player.displayName}</b>
                    <span className="muted"> · {state.answers[player._id] ?? "said nothing"}</span>
                  </span>
                  <Button
                    variant={data.me?.vote === player._id ? "yellow" : "outline"}
                    size="sm"
                    disabled={player._id === data.me?._id || pending}
                    onClick={() => void castVote(player._id)}
                  >
                    {player._id === data.me?._id ? "You" : data.me?.vote === player._id ? "Voted" : "Liar"}
                  </Button>
                </div>
              ))}
            </div>
            <p className="auth-note">Talk it out. The round ends when the last vote is in.</p>
          </>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
      </div>
    </main>
  );
}
