import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "PlayWhatever — fast party games for your crew";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card. Same ink as the app: the coral mark, the display face for
 * the name, one line about what it is, and where the code lives. Nothing else
 * belongs on it, least of all a screenshot that ages in a week.
 */
export default async function OpengraphImage() {
  const display = await readFile(join(process.cwd(), "public/fonts/zarathustra-v01.otf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#181824",
          backgroundImage: "radial-gradient(circle at 22% -10%, rgba(255, 102, 82, 0.30), transparent 55%)",
          color: "#f7f7ff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontFamily: "Display", fontSize: 104, lineHeight: 1, color: "#ff6652" }}>*</span>
          <span style={{ fontFamily: "Display", fontSize: 76, lineHeight: 1 }}>PlayWhatever</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1.25, color: "#f7f7ff", maxWidth: 900 }}>
            Fast party games for your crew. Host a room, share the code, everybody plays on their own phone.
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#c5c4d1" }}>
            Traitors · Guess the Liar · Dumb Charadess · IPL Guessr
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#c5c4d1" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#c5c4d1">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
            </svg>
            github.com/whynotramaa/playwhatever
          </div>
          <div style={{ display: "flex", width: 120, height: 6, background: "#f4e900" }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Display", data: display, weight: 400, style: "normal" }],
    }
  );
}
