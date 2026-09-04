"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useRoomVoice, type VoicePlayer } from "@/lib/voice";
import { Button } from "@/components/Button";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * The room's voice bar. It belongs to the room, not to any game, so it is
 * mounted by the room layout and survives the walk from lobby into a game
 * without dropping a call (PLAN.md phase 13).
 *
 * Quiet by default: one line and one button until somebody is actually
 * talking. The mic button carries the only accent on the bar.
 */
export function VoiceDock({ roomId }: { roomId: string }) {
  const voice = useRoomVoice(roomId as Id<"rooms">);
  const { status, me, isHost, muted, inCall, speaking } = voice;

  // Not a seat in this room, nothing to be in the call with.
  if (!me) return null;

  const initials = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="voice-dock" role="region" aria-label="Room voice">
      {status === "live" && inCall.length > 0 && (
        <div className="voice-people">
          {inCall.map((player: VoicePlayer) => {
            const isMe = player._id === me._id;
            const talking = speaking.includes(isMe ? "me" : player._id) && player.micMuted !== true;
            return (
              <span
                key={player._id}
                className="voice-person"
                data-speaking={talking ? "true" : undefined}
                data-muted={player.micMuted === true ? "true" : undefined}
              >
                <span className="voice-avatar" aria-hidden="true">{initials(player.displayName)}</span>
                <span className="voice-name">{isMe ? "You" : player.displayName}</span>
                {player.micMuted === true && <MicOff className="voice-glyph" aria-label="muted" />}
              </span>
            );
          })}
        </div>
      )}

      <div className="voice-bar">
        {status === "off" && (
          <>
            <span className="voice-hint">
              {inCall.length > 0
                ? `${inCall.length} ${inCall.length === 1 ? "person is" : "people are"} on voice`
                : "Voice is off"}
            </span>
            <Button variant="primary" size="sm" onClick={() => void voice.join()}>
              <Mic className="w-4 h-4" aria-hidden="true" />
              Join voice
            </Button>
          </>
        )}

        {status === "asking" && <span className="voice-hint">Waiting for your microphone…</span>}

        {status === "denied" && (
          <>
            <span className="voice-hint is-error">
              Your browser blocked the mic. Allow it, then try again.
            </span>
            <Button variant="outline" size="sm" onClick={() => void voice.join()}>Try again</Button>
          </>
        )}

        {status === "error" && (
          <>
            <span className="voice-hint is-error">{voice.error ?? "Voice did not start."}</span>
            <Button variant="outline" size="sm" onClick={() => void voice.join()}>Try again</Button>
          </>
        )}

        {status === "live" && (
          <>
            <Button
              variant={muted ? "primary" : "outline"}
              size="sm"
              aria-pressed={muted}
              onClick={() => void voice.toggleMute()}
            >
              {muted ? <MicOff className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
              {muted ? "Unmute" : "Mute"}
            </Button>

            {/* The host quiets the room. Every mic comes back on by its owner. */}
            {isHost && (
              <Button variant="tertiary" size="sm" onClick={() => void voice.muteRoom()}>
                Mute everyone
              </Button>
            )}

            <button
              type="button"
              className="voice-leave"
              aria-label="Leave voice"
              onClick={() => void voice.leave()}
            >
              <PhoneOff className="w-4 h-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {status === "live" && (
        <p className="voice-status" role="status">
          {muted ? "Your mic is off. Only you can turn it back on." : "Your mic is live."}
        </p>
      )}
    </div>
  );
}
