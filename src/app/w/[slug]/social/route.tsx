import { ImageResponse } from "next/og";
import { publicWedding } from "@/server/weddings";
import { eventDate } from "@/lib/content";
import { themeAccents } from "@/lib/appearance";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const w = await publicWedding((await ctx.params).slug);
  if (!w)
    return new Response("Invitation unavailable", {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    });
  const c = w.content,
    language = c.defaultLanguage;
  const font = await readFile(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff",
    ),
  );
  const gu = await readFile(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/noto-serif-gujarati/files/noto-serif-gujarati-gujarati-500-normal.woff",
    ),
  );
  const names = c.names.map((n) => n[language]).join(" & ");
  const date = c.events.find((e) => e.id === c.mainEventId)?.start;
  const color = themeAccents[c.theme];
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: color,
        padding: 34,
      }}
    >
      <div
        style={{
          display: "flex",
          border: "1px solid #ae8b51",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fbf6ef",
          fontFamily: "Cormorant, Gujarati",
          padding: 55,
        }}
      >
        <div style={{ fontSize: 30, marginBottom: 35 }}>
          {language === "gu"
            ? "આપને હાર્દિક આમંત્રણ"
            : "Together with our families"}
        </div>
        <div
          style={{
            fontSize: names.length > 40 ? 55 : 86,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {names}
        </div>
        <div style={{ fontSize: 32, marginTop: 36 }}>
          {date ? eventDate(date, language, false) : ""}
        </div>
        <div style={{ fontSize: 20, marginTop: 40 }}>Nyota</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Cormorant", data: font, weight: 500 },
        { name: "Gujarati", data: gu, weight: 500 },
      ],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
