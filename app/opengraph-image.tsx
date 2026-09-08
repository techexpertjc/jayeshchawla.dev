import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mainQuests, profile, yearsOfExperience } from "@/content/save-file";

/**
 * The card every share renders — LinkedIn, WhatsApp, Slack, a DM to a recruiter.
 *
 * Generated at build time from `save-file.ts` rather than exported from a
 * design tool, for the same reason everything else here is: the year count is
 * computed, and a hand-made PNG would be wrong the moment it changed.
 *
 * Sitting at the root of `app/` covers every route, so `/`, `/resume` and
 * `/play` all share it.
 */
export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1119";
const INK_600 = "#2b3145";
const INK_400 = "#545c78";
const PAPER = "#f6f1e4";
const PAPER_300 = "#d9ccb0";
const SAKURA = "#ff9ec4";
/*
  Brighter than the site's own ink-400 body text. This card is read at
  thumbnail size in a feed, not full width on a monitor, and the site value
  disappears at that scale.
*/
const MUTED = "#7d86a1";

export default async function OpengraphImage() {
  /*
    Satori cannot read woff2, which is all the site itself ships. This ttf is
    the same face, decompressed once and committed alongside them — see the
    note in ATTRIBUTIONS.md.
  */
  const display = await readFile(
    join(process.cwd(), "app/fonts/ZenMaruGothic-700.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          backgroundImage: `radial-gradient(110% 80% at 50% 115%, #1d2130 0%, ${INK} 60%)`,
          padding: "72px 80px",
          fontFamily: "Zen Maru Gothic",
        }}
      >
        {/* Petals, using the same silhouette the boot screen draws in CSS. */}
        {[
          { top: 70, left: 980, size: 58, rotate: -18, opacity: 0.95 },
          { top: 180, left: 1080, size: 34, rotate: 24, opacity: 0.8 },
          { top: 290, left: 1010, size: 22, rotate: -8, opacity: 0.62 },
        ].map((petal, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: petal.top,
              left: petal.left,
              width: petal.size,
              height: petal.size,
              background: SAKURA,
              opacity: petal.opacity,
              borderRadius: "100% 0 100% 0",
              transform: `rotate(${petal.rotate}deg)`,
            }}
          />
        ))}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: SAKURA,
            }}
          >
            Save File
          </div>

          <div
            style={{
              fontSize: 104,
              lineHeight: 1.05,
              color: PAPER,
              marginTop: 22,
            }}
          >
            {profile.name}
          </div>

          <div style={{ fontSize: 36, color: PAPER_300, marginTop: 20 }}>
            {`${profile.title} · ${yearsOfExperience()}+ years`}
          </div>

          <div
            style={{
              fontSize: 27,
              color: MUTED,
              marginTop: 14,
              maxWidth: 800,
            }}
          >
            {profile.tagline}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 1, background: INK_600, marginBottom: 22 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 26 }}>
            {mainQuests.map((quest) => (
              <div
                key={quest.id}
                style={{
                  fontSize: 17,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: INK_400,
                }}
              >
                {quest.worldTitle}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Zen Maru Gothic", data: display, weight: 700, style: "normal" },
      ],
    },
  );
}
