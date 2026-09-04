"use client";

import { useEffect, useState } from "react";
import { blip } from "@/lib/sound";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*?";
const STEP_MS = 700;
const COUNT_FROM = 3;

/**
 * The beat before a round. The server has already picked the word, the name or
 * the player by the time this shows, so the reel is not a progress bar: it is
 * the three seconds everybody needs to look up from their phone before the
 * clock starts.
 *
 * ponytail: the countdown runs on each client and eats into a round that the
 * server has already started. Every player loses the same two seconds because
 * they all get the phase change together. Move it into a "starting" phase with
 * its own deadline if a round ever gets tight enough for it to matter.
 */
export function RoundIntro({ roundKey, label }: { roundKey: string; label: string }) {
  const [count, setCount] = useState(COUNT_FROM);
  const [text, setText] = useState(label);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = Date.now();
    let clear = 0;
    setCount(COUNT_FROM);
    setText(label);
    setGone(false);
    blip(560);

    const step = window.setInterval(() => {
      const left = COUNT_FROM - Math.floor((Date.now() - started) / STEP_MS);
      setCount(left);
      if (left > 0) {
        blip(560 + (COUNT_FROM - left) * 120);
        return;
      }
      window.clearInterval(step);
      window.clearInterval(reel);
      blip(1040, 160);
      // Cut to the round only after the overlay has faded, so nothing pops.
      clear = window.setTimeout(() => setGone(true), 240);
    }, STEP_MS);

    // The reel: letters settle left to right while the count runs down.
    const reel = quiet ? 0 : window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / (COUNT_FROM * STEP_MS));
      const settled = Math.round(label.length * progress);
      setText(
        label.slice(0, settled) +
          [...label.slice(settled)]
            .map((char) => (char === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("")
      );
      if (progress < 0.4) blip(200 + Math.random() * 90, 22, 0.02);
    }, 55);

    return () => {
      window.clearInterval(step);
      window.clearInterval(reel);
      window.clearTimeout(clear);
    };
  }, [roundKey, label]);

  if (gone) return null;
  return (
    <div className="round-intro" role="status" aria-label={label} data-done={count <= 0 ? "true" : undefined}>
      <span className="round-intro-count" key={count} aria-hidden="true">
        {Math.max(count, 1)}
      </span>
      <span className="round-intro-text" aria-hidden="true">{text}</span>
    </div>
  );
}
