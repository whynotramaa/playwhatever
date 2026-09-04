"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Room voice, client half. A full mesh: every participant holds one peer
 * connection per other participant, and Convex carries the handshake.
 *
 * ponytail: mesh with public STUN. It is the right shape up to about eight
 * people on decent networks, and it needs no server of ours. Two things will
 * eventually push past it, and neither has happened yet: a symmetric NAT on
 * both ends of a pair (wants TURN), and rooms large enough that n² uploads
 * hurt a phone (wants an SFU). Add each when a real room hits it.
 */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

// Loud enough to be a voice rather than a room fan, measured on a 0-127 scale.
const SPEAKING_FLOOR = 9;
const METER_MS = 150;

export type VoiceStatus = "off" | "asking" | "live" | "denied" | "error";

export type VoicePlayer = {
  _id: Id<"roomPlayers">;
  displayName: string;
  isHost: boolean;
  status: string;
  inVoice?: boolean;
  micMuted?: boolean;
};

type Peer = {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  /** Candidates that arrived before the answer did. */
  pending: RTCIceCandidateInit[];
};

export function useRoomVoice(roomId: Id<"rooms">) {
  const room = useQuery(api.rooms.get, { roomId });
  const [status, setStatus] = useState<VoiceStatus>("off");
  const signals = useQuery(api.voice.signals, status === "live" ? { roomId } : "skip");

  const joinCall = useMutation(api.voice.join);
  const leaveCall = useMutation(api.voice.leave);
  const sendSignal = useMutation(api.voice.sendSignal);
  const ackSignals = useMutation(api.voice.ackSignals);
  const setMyMute = useMutation(api.voice.setMyMute);
  const muteEveryone = useMutation(api.voice.muteEveryone);

  const [speaking, setSpeaking] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, Peer>());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metersRef = useRef(new Map<string, { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }>());

  const me: VoicePlayer | null = room?.currentPlayer ?? null;
  const myId = me?._id ?? null;
  const isHost = me?.isHost === true;
  const muted = me?.micMuted === true;

  const participants: VoicePlayer[] = useMemo(
    () => (room?.players ?? []).filter((player: VoicePlayer) => player.status !== "removed"),
    [room]
  );
  const inCall = useMemo(
    () => participants.filter((player) => player.inVoice === true),
    [participants]
  );

  // --- metering -------------------------------------------------------------

  const attachMeter = useCallback((id: string, stream: MediaStream) => {
    try {
      const context = (audioCtxRef.current ??= new AudioContext());
      void context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      metersRef.current.set(id, { analyser, data: new Uint8Array(analyser.frequencyBinCount) });
    } catch {
      // No meter is a missing ring, not a broken call.
    }
  }, []);

  useEffect(() => {
    if (status !== "live") return;
    const timer = window.setInterval(() => {
      const loud: string[] = [];
      for (const [id, meter] of metersRef.current) {
        meter.analyser.getByteTimeDomainData(meter.data);
        let peak = 0;
        for (const sample of meter.data) peak = Math.max(peak, Math.abs(sample - 128));
        if (peak > SPEAKING_FLOOR) loud.push(id);
      }
      // Only re-render when the set actually changes.
      setSpeaking((previous) =>
        previous.length === loud.length && previous.every((id) => loud.includes(id)) ? previous : loud
      );
    }, METER_MS);
    return () => window.clearInterval(timer);
  }, [status]);

  // --- peers ----------------------------------------------------------------

  const send = useCallback(
    (to: string, kind: "offer" | "answer" | "ice", payload: unknown) =>
      sendSignal({
        roomId,
        toPlayerId: to as Id<"roomPlayers">,
        kind,
        payload: JSON.stringify(payload),
      }).catch(() => {
        // A dropped handshake message is retried by the next negotiation.
      }),
    [roomId, sendSignal]
  );

  const ensurePeer = useCallback(
    (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const audio = new Audio();
      audio.autoplay = true;
      const peer: Peer = { pc, audio, pending: [] };

      const stream = streamRef.current;
      if (stream) for (const track of stream.getTracks()) pc.addTrack(track, stream);

      pc.ontrack = (event) => {
        const [remote] = event.streams;
        if (!remote) return;
        audio.srcObject = remote;
        void audio.play().catch(() => {
          // Autoplay refused until the page has a gesture. Joining was one.
        });
        attachMeter(peerId, remote);
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) void send(peerId, "ice", event.candidate.toJSON());
      };

      peersRef.current.set(peerId, peer);
      return peer;
    },
    [attachMeter, send]
  );

  const dropPeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (!peer) return;
    peer.pc.close();
    peer.audio.srcObject = null;
    peersRef.current.delete(peerId);
    metersRef.current.delete(peerId);
  }, []);

  /** Reconcile the mesh against who is actually in the call. */
  useEffect(() => {
    if (status !== "live" || !myId) return;
    const wanted = new Set(inCall.map((player) => player._id).filter((id) => id !== myId));

    for (const peerId of [...peersRef.current.keys()]) {
      if (!wanted.has(peerId as Id<"roomPlayers">)) dropPeer(peerId);
    }

    for (const peerId of wanted) {
      if (peersRef.current.has(peerId)) continue;
      const { pc } = ensurePeer(peerId);
      // One side offers. Comparing ids picks the same side on both machines,
      // so two peers never offer each other at once.
      if (myId < peerId) {
        void (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await send(peerId, "offer", offer);
          } catch {
            dropPeer(peerId);
          }
        })();
      }
    }
  }, [inCall, myId, status, ensurePeer, dropPeer, send]);

  /** Apply inbound handshake messages, then delete them. */
  useEffect(() => {
    if (status !== "live" || !signals || signals.length === 0) return;
    let cancelled = false;

    void (async () => {
      const handled: Id<"voiceSignals">[] = [];
      for (const signal of signals) {
        handled.push(signal._id);
        // The sender's seat is checked server-side, so this is always a room
        // member. If they have since left the call, the reconcile pass below
        // closes the peer; dropping the message here would strand the offer.
        const peerId = signal.fromPlayerId as string;
        const peer = ensurePeer(peerId);
        try {
          if (signal.kind === "offer") {
            await peer.pc.setRemoteDescription(JSON.parse(signal.payload));
            const answer = await peer.pc.createAnswer();
            await peer.pc.setLocalDescription(answer);
            await send(peerId, "answer", answer);
            for (const candidate of peer.pending.splice(0)) {
              await peer.pc.addIceCandidate(candidate);
            }
          } else if (signal.kind === "answer") {
            if (peer.pc.signalingState !== "have-local-offer") continue;
            await peer.pc.setRemoteDescription(JSON.parse(signal.payload));
            for (const candidate of peer.pending.splice(0)) {
              await peer.pc.addIceCandidate(candidate);
            }
          } else {
            const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;
            // A candidate that beats the description it belongs to has to wait.
            if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(candidate);
            else peer.pending.push(candidate);
          }
        } catch {
          // One bad message must not stall the queue behind it.
        }
      }
      if (!cancelled && handled.length > 0) {
        await ackSignals({ roomId, ids: handled }).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signals, status, roomId, ensurePeer, send, ackSignals]);

  /**
   * The mute lands here, and it lands the same way whoever asked for it. Your
   * own toggle and the host's mute-everyone both write `micMuted` on your row;
   * this effect is what turns the microphone off.
   */
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    for (const track of stream.getAudioTracks()) track.enabled = !muted;
  }, [muted]);

  // --- controls -------------------------------------------------------------

  const teardown = useCallback(() => {
    for (const peerId of [...peersRef.current.keys()]) dropPeer(peerId);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    metersRef.current.clear();
    setSpeaking([]);
  }, [dropPeer]);

  const join = useCallback(async () => {
    if (status === "asking" || status === "live") return;
    setStatus("asking");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      attachMeter("me", stream);
      await joinCall({ roomId });
      setStatus("live");
    } catch (thrown) {
      teardown();
      const name = (thrown as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
      } else if (name === "NotFoundError") {
        setStatus("error");
        setError("No microphone found on this device.");
      } else {
        setStatus("error");
        setError("Could not start voice. Try again.");
      }
    }
  }, [status, roomId, joinCall, attachMeter, teardown]);

  const leave = useCallback(async () => {
    teardown();
    setStatus("off");
    await leaveCall({ roomId }).catch(() => {});
  }, [roomId, leaveCall, teardown]);

  const toggleMute = useCallback(
    () => setMyMute({ roomId, muted: !muted }).catch(() => setError("Could not change your mic.")),
    [roomId, muted, setMyMute]
  );

  const muteRoom = useCallback(
    () => muteEveryone({ roomId }).catch(() => setError("Could not mute the room.")),
    [roomId, muteEveryone]
  );

  // Closing the tab should not leave a ghost in the mesh.
  useEffect(() => {
    const bail = () => {
      if (streamRef.current) void leaveCall({ roomId }).catch(() => {});
    };
    window.addEventListener("pagehide", bail);
    return () => {
      window.removeEventListener("pagehide", bail);
      bail();
      teardown();
    };
  }, [roomId, leaveCall, teardown]);

  return {
    status,
    error,
    isHost,
    muted,
    me,
    inCall,
    speaking,
    join,
    leave,
    toggleMute,
    muteRoom,
  };
}
