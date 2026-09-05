"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { TIER_COLOR, TIER_ORDER, tierFor, type Tier } from "../../convex/teamRules";

export type Squad = {
  id: string;
  name: string;
  score: number;
  spent: number;
  squad: { title: string; tag: string; price: number; rating?: number }[];
};

/**
 * The end of an auction, cut into tiers. This is the artefact people take out
 * of the game, so it exists twice: once as a DOM board that reads well on a
 * phone, and once as a 1080x1920 PNG drawn from the same numbers, because a
 * story wants a picture and a screenshot of a scrolling page is not one.
 *
 * The canvas is drawn rather than rasterised from the DOM: html-to-image and
 * friends are a dependency and a pile of CSS edge cases, and this card is six
 * rows of text on a rectangle.
 */
export function TierBoard({ category, players }: { category: string; players: Squad[] }) {
  const [saving, setSaving] = useState(false);
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  const rows = ranked.map((player) => ({ ...player, tier: tierFor(player.score, best) }));
  const tiers = TIER_ORDER.map((tier) => ({ tier, entries: rows.filter((row) => row.tier === tier) })).filter(
    (group) => group.entries.length > 0
  );

  const save = async () => {
    setSaving(true);
    try {
      await shareTierCard({ category, tiers });
    } catch {
      // A refused share sheet is not an error worth a red banner.
    }
    setSaving(false);
  };

  return (
    <section className="tier-board">
      <div className="tier-board-head">
        <span className="label">Tier list · {category}</span>
        <button type="button" className="btn btn-yellow btn-small" disabled={saving} onClick={() => void save()}>
          <span className="btn-label inline-flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden="true" />
            {saving ? "Drawing" : "Save image"}
          </span>
        </button>
      </div>

      {tiers.map(({ tier, entries }) => (
        <div key={tier} className="tier-row" style={{ "--tier": TIER_COLOR[tier] } as React.CSSProperties}>
          <span className="tier-badge">{tier}</span>
          <div className="tier-entries">
            {entries.map((entry) => (
              <div key={entry.id} className="tier-entry">
                <div className="tier-entry-head">
                  <b>{entry.name}</b>
                  <span className="code-type">{entry.score}</span>
                </div>
                <p className="small muted">
                  {entry.squad.length} {entry.squad.length === 1 ? "lot" : "lots"} · spent ₹{entry.spent}
                </p>
                <div className="squad-list">
                  {entry.squad.map((lot) => (
                    <span key={lot.title} className="squad-chip">
                      {lot.title}
                      <b>₹{lot.price}</b>
                    </span>
                  ))}
                  {entry.squad.length === 0 && <span className="squad-chip is-empty">Bought nothing</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

type Group = { tier: Tier; entries: (Squad & { tier: Tier })[] };

/** 1080x1920, which is a story. Everything is laid out top down in one pass. */
async function shareTierCard({ category, tiers }: { category: string; tiers: Group[] }) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) return;

  const root = getComputedStyle(document.documentElement);
  const display = root.getPropertyValue("--font-display").trim() || "serif";
  const ui = root.getPropertyValue("--font-ui").trim() || "sans-serif";
  await document.fonts?.ready;

  g.fillStyle = "#181824";
  g.fillRect(0, 0, W, H);

  // The one tinted block, top left, the way the game cards carry theirs.
  const glow = g.createRadialGradient(150, 150, 0, 150, 150, 900);
  glow.addColorStop(0, "rgba(255, 102, 82, 0.20)");
  glow.addColorStop(1, "rgba(255, 102, 82, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  g.fillStyle = "#ff6652";
  g.font = `400 96px ${display}`;
  g.fillText("*", 80, 190);

  g.fillStyle = "#8c8b99";
  g.font = `600 26px ${ui}`;
  g.letterSpacing = "3px";
  g.fillText(`MAKE YOUR TEAM · ${category.toUpperCase()}`, 150, 168);
  g.letterSpacing = "0px";

  g.fillStyle = "#f7f7ff";
  g.font = `400 104px ${display}`;
  g.fillText("Final tiers", 80, 320);

  let y = 420;
  for (const { tier, entries } of tiers) {
    const height = 116 + entries.length * 92;
    g.fillStyle = "#232334";
    roundRect(g, 80, y, W - 160, height, 24);
    g.fill();

    g.fillStyle = TIER_COLOR[tier];
    roundRect(g, 80, y, 14, height, 7);
    g.fill();

    // The tier letter is a score badge, so it follows the same Poppins rule the
    // numbers do rather than borrowing the heading face.
    g.font = `700 68px ${ui}`;
    g.fillText(tier, 130, y + 84);

    g.font = `600 26px ${ui}`;
    g.fillStyle = "#8c8b99";
    g.letterSpacing = "3px";
    g.fillText(entries.length === 1 ? "1 SQUAD" : `${entries.length} SQUADS`, 230, y + 62);
    g.letterSpacing = "0px";

    let row = y + 132;
    for (const entry of entries) {
      g.fillStyle = "#f7f7ff";
      g.font = `600 40px ${ui}`;
      g.fillText(clip(g, entry.name, 520), 130, row);

      g.fillStyle = TIER_COLOR[tier];
      g.font = `700 40px ${ui}`;
      g.textAlign = "right";
      g.fillText(String(entry.score), W - 130, row);
      g.textAlign = "left";

      g.fillStyle = "#8c8b99";
      g.font = `400 28px ${ui}`;
      const picks = entry.squad.map((lot) => lot.title).join(", ") || "Bought nothing";
      g.fillText(clip(g, picks, W - 300), 130, row + 42);

      row += 92;
    }
    y += height + 28;
    if (y > H - 300) break;
  }

  g.fillStyle = "#8c8b99";
  g.font = `600 30px ${ui}`;
  g.textAlign = "center";
  g.fillText("playwhatever.ramaa.tech", W / 2, H - 110);
  g.textAlign = "left";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const file = new File([blob], "make-your-team.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Make Your Team" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "make-your-team.png";
  link.click();
  URL.revokeObjectURL(url);
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Long Indian names and six-name squads both have to stop at the card edge. */
function clip(g: CanvasRenderingContext2D, text: string, max: number) {
  if (g.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && g.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut}…`;
}
