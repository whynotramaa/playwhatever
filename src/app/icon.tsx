import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The mark on its own, same coral on the same night blue as the header. */
export default async function Icon() {
  const display = await readFile(join(process.cwd(), "public/fonts/zarathustra-v01.otf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#181824",
          color: "#ff6652",
          fontFamily: "Display",
          fontSize: 76,
          // The asterisk sits high in this face, so the box is nudged, not the glyph.
          paddingTop: 34,
        }}
      >
        *
      </div>
    ),
    { ...size, fonts: [{ name: "Display", data: display, weight: 400, style: "normal" }] }
  );
}
