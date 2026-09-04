"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * The room clock, ticking on the deployment's time rather than this device's.
 *
 * Every deadline in every game is stamped by the server, so a browser running
 * a minute fast reads every countdown as expired and sits on 0s for the whole
 * round. `heartbeat` hands back the server clock for exactly this, and the
 * same beat is what keeps the player marked present, so both live here.
 */
export function useServerNow(roomId: Id<"rooms">) {
  const heartbeat = useMutation(api.rooms.heartbeat);
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const beat = async () => setSkew((await heartbeat({ roomId })) - Date.now());
    void beat();
    const pulse = window.setInterval(() => void beat(), 20_000);
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => {
      window.clearInterval(pulse);
      window.clearInterval(tick);
    };
  }, [heartbeat, roomId]);

  return now + skew;
}
