import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const font = await readFile(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff",
    ),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#4b2033",
        color: "#fbf1e4",
        padding: 36,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid #b99772",
          padding: "36px 52px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "Cormorant", fontSize: 48 }}>nyota.</span>
          <span style={{ fontSize: 22, color: "#dec8cc" }}>
            ENGLISH + GUJARATI
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Cormorant",
            fontSize: 88,
            lineHeight: 1.04,
          }}
        >
          <span>Your Gujarati wedding,</span>
          <span>beautifully invited.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 26, color: "#dec8cc" }}>
            Every function, directions, and family RSVPs. One link.
          </span>
          <span style={{ fontSize: 24 }}>
            Preview free. Pay once to publish. · nyotaa.app
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Cormorant", data: font, weight: 500 }],
    },
  );
}
