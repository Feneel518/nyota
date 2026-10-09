import type { InvitationContent } from "@/lib/content";
import { characterOptions, outfitOptions } from "@/lib/appearance";
import type { ReactNode } from "react";
import { architectureNames, ThemeArchitecture } from "./theme-architecture";
const palettes = {
  royal: {
    sky: "#ead6cd",
    wall: "#c78f85",
    shadow: "#a96964",
    roof: "#722d42",
    trim: "#e7c39a",
    leaf: "#475c49",
    flower: "#d99491",
    floor: "#dbc2a5",
    ink: "#57283a",
  },
  marigold: {
    sky: "#f7e5b9",
    wall: "#e5b97b",
    shadow: "#c88850",
    roof: "#a04c32",
    trim: "#ffdc8a",
    leaf: "#5b693d",
    flower: "#e6a225",
    floor: "#edcf9b",
    ink: "#793d2b",
  },
  garden: {
    sky: "#eff0dc",
    wall: "#dadac0",
    shadow: "#aeb99e",
    roof: "#466957",
    trim: "#e8dfbf",
    leaf: "#44694f",
    flower: "#d49b9d",
    floor: "#e0ddc9",
    ink: "#355244",
  },
  rose: {
    sky: "#f5e0e4",
    wall: "#dcb0b9",
    shadow: "#b77f92",
    roof: "#843f59",
    trim: "#f2d4ba",
    leaf: "#61765c",
    flower: "#cf7393",
    floor: "#ebd3cb",
    ink: "#69354c",
  },
  midnight: {
    sky: "#273752",
    wall: "#647594",
    shadow: "#455674",
    roof: "#263653",
    trim: "#e0c68d",
    leaf: "#506b6b",
    flower: "#c4aecf",
    floor: "#9c9caa",
    ink: "#202c48",
  },
  lotus: {
    sky: "#dceeee",
    wall: "#a7ced0",
    shadow: "#73a5ad",
    roof: "#326c79",
    trim: "#efe0b9",
    leaf: "#427a68",
    flower: "#e0a1b7",
    floor: "#c8ded6",
    ink: "#245d67",
  },
};
export function Character({
  appearance = 0,
  outfit = 0,
  x = 0,
  y = 0,
  scale = 1,
  motion = "idle",
  occasion = "everyday",
  composited = false,
}: {
  appearance?: number;
  outfit?: number;
  x?: number;
  y?: number;
  scale?: number;
  motion?: "idle" | "dance" | "toss" | "henna" | "garland" | "drum" | "ride";
  occasion?: "everyday" | "sangeet" | "baraat";
  composited?: boolean;
}) {
  if (composited)
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <foreignObject
          x="-48"
          y="-48"
          width="96"
          height="160"
          overflow="visible"
        >
          <div
            className={`character-sprite sprite-${motion}`}
            style={{ animationDelay: x > 350 ? "-.9s" : "0s" }}
          >
            <svg
              viewBox="-48 -48 96 160"
              width="96"
              height="160"
              overflow="visible"
              fill="none"
            >
              <Character
                appearance={appearance}
                outfit={outfit}
                occasion={occasion}
                motion={motion}
              />
            </svg>
          </div>
        </foreignObject>
      </g>
    );
  const look = characterOptions[appearance] ?? characterOptions[0];
  const attire = outfitOptions[outfit] ?? outfitOptions[0];
  const { skin, hair, style } = look;
  const beard = "beard" in look ? look.beard : undefined;
  const flared = attire.shape === "flared";
  const clothes = attire.color;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      data-attire={occasion}
      data-outfit={outfit}
      data-appearance={appearance}
      data-cut={flared ? "draped" : "tailored"}
    >
      <ellipse cx="0" cy="105" rx="30" ry="6" fill="#442934" opacity=".12" />
      <g className={`character-body character-${motion}`}>
        <path
          d="M-14 56L-12 98H-3L0 63L5 98H14L17 56"
          fill={flared ? clothes : outfit === 1 ? "#dfc397" : "#e9dbc4"}
        />
        <path d="M-16 95L-20 104H-3V97M5 97V104H24L15 96" fill="#593928" />
        <path
          d={
            flared
              ? "M-15 14Q0 7 15 14L30 91Q0 102-30 91Z"
              : attire.detail === "waistcoat"
                ? "M-8 12L-19 17L-17 54L-3 56L0 51L3 56L17 54L19 17L8 12Z"
                : attire.detail === "sash"
                  ? "M-8 12L-19 17L-17 78L-3 80L0 71L3 80L17 78L19 17L8 12Z"
                  : "M-8 12L-19 17L-16 68L-3 70L0 63L3 70L16 68L19 17L8 12Z"
          }
          fill={clothes}
        />
        <g className="character-arm character-arm-left">
          <path
            d={
              flared
                ? "M-16 18L-24 53L-18 58L-9 30"
                : "M-19 17L-27 53L-18 56L-11 22Z"
            }
            fill={clothes}
            stroke="#b59365"
          />
          <circle cx="-20" cy="58" r="4" fill={skin} />
        </g>
        <g className="character-arm character-arm-right">
          <path
            d={
              flared ? "M16 18L26 51L20 57L10 29" : "M19 17L28 52L19 56L11 22Z"
            }
            fill={clothes}
            stroke="#b59365"
          />
          <circle cx="23" cy="57" r="4" fill={skin} />
        </g>
        <path d="M-4 5V16Q0 20 5 15V5" fill={skin} />
        {style === "waves" && (
          <path d="M-12-14Q-22 5-14 34L-5 31L10 4Z" fill={hair} />
        )}
        {style === "bun" && <circle cx="10" cy="-22" r="9" fill={hair} />}
        {style === "braid" && (
          <g fill={hair}>
            <path d="M-12-14Q-21 1-14 20L-7 18L9-7Z" />
            {[14, 21, 28, 35].map((y) => (
              <ellipse key={y} cx="-13" cy={y} rx="5" ry="6" />
            ))}
            <path d="M-16 40L-13 48L-10 40Z" />
          </g>
        )}
        {style === "bob" && (
          <path d="M-16 12L-17-10Q-17-27 0-26Q18-26 17-9L16 12Z" fill={hair} />
        )}
        <ellipse cx="0" cy="-5" rx="12" ry="17" fill={skin} />
        <path
          d={
            style === "waves" || style === "braid" || style === "bob"
              ? "M-12-4Q-14-26 1-23Q17-23 13-2L7-15Q-1-8-12-4"
              : style === "quiff"
                ? "M-12-5L-14-18Q-20-32-6-27Q10-35 15-20L12-4L6-16L-7-12Z"
                : style === "bun"
                  ? "M-12-5Q-18-27 0-24Q18-25 13-4L8-15Q-1-12-12-5Z"
                  : "M-12-7L-13-19Q0-29 12-18L13-5L6-14L-7-12Z"
          }
          fill={hair}
        />
        {style === "curls" && (
          <g fill={hair}>
            {[
              [-12, -15],
              [-9, -22],
              [-2, -25],
              [6, -24],
              [12, -18],
            ].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="6" />
            ))}
          </g>
        )}
        {beard && (
          <g className="character-beard" data-beard={beard} fill={hair}>
            <path
              d={
                beard === "short"
                  ? "M-11-2L-8 7Q0 14 8 7L11-2L10 8Q0 20-10 8Z"
                  : beard === "full"
                    ? "M-11-2L-8 5Q0 2 8 5L11-2L11 10Q8 20 0 22Q-8 20-11 10Z"
                    : beard === "rounded"
                      ? "M-11-2L-7 5Q0 2 7 5L11-2L11 9Q10 20 0 20Q-10 20-11 9Z"
                      : beard === "tapered"
                        ? "M-11-2L-7 5Q0 2 7 5L11-2L9 10L0 20L-9 10Z"
                        : "M-11-1L-8 11Q0 20 9 10L12-1L6 5Q0 2-6 5Z"
              }
            />
            <path d="M0 2Q-4 0-8 5Q-4 7 0 4Q4 7 8 5Q4 0 0 2Z" />
          </g>
        )}
        <path
          d="M-6-3H-4M5-3H7"
          stroke="#33272b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M-2 6Q1 8 4 5"
          fill="none"
          stroke={beard ? skin : "#874e43"}
          strokeWidth="1"
        />
        <path
          d={flared ? "M-9 14Q0 31 10 14M0 25V66" : "M0 18V64"}
          fill="none"
          stroke={attire.trim}
          strokeWidth="1.5"
        />
        {!flared && (
          <g
            className="tailored-details"
            stroke={attire.trim}
            strokeWidth="1.2"
          >
            <path d="M-7 11V18L0 22L7 18V11L0 14Z" fill={clothes} />
            <path
              d="M-25 48L-18 50M20 49L27 47M7 29H14M-10 80V95M10 80V95"
              fill="none"
            />
            <path d="M8 29L10 24L12 29" fill={attire.trim} />
          </g>
        )}
        {attire.detail === "drape" && (
          <>
            <path
              d="M-9 15L21 80L13 91L-16 20Z"
              fill={attire.trim}
              opacity=".7"
            />
            <path
              d="M-27 86Q0 94 27 86"
              fill="none"
              stroke={attire.trim}
              strokeWidth="3"
            />
          </>
        )}
        {attire.detail === "panels" && (
          <path
            d="M-9 17V64M9 17V64"
            fill="none"
            stroke="#bcaa79"
            strokeWidth="2"
          />
        )}
        {attire.detail === "buttons" && (
          <g fill={attire.trim}>
            {[32, 42, 52, 62].map((y) => (
              <circle key={y} cy={y} r="1.8" />
            ))}
          </g>
        )}
        {attire.detail === "sash" && (
          <path
            d="M-12 15L17 62L13 71L-16 24Z"
            fill={attire.trim}
            opacity=".85"
          />
        )}
        {attire.detail === "waistcoat" && (
          <path
            d="M-7 18L0 22L7 18L12 22L14 51L3 54L0 49L-3 54L-14 51L-12 22Z"
            fill="#552b3d"
            stroke={attire.trim}
          />
        )}
        {attire.detail === "pleats" && (
          <path
            d="M-7 35L-19 90M0 35V95M7 35L19 90M-12 34H12"
            stroke={attire.trim}
            strokeWidth="2"
          />
        )}
        {attire.detail === "tiers" && (
          <path
            d="M-18 47Q0 58 18 47M-23 66Q0 79 23 66M-28 85Q0 98 28 85"
            stroke={attire.trim}
            strokeWidth="3"
          />
        )}
        {attire.detail === "floral" && (
          <g fill={attire.trim}>
            {[
              [-9, 40],
              [7, 52],
              [-14, 66],
              [16, 78],
              [-4, 84],
            ].map(([x, y]) => (
              <path
                key={y}
                d={`M${x} ${y - 4}q6-2 4 4q2 6-4 4q-6 2-4-4q-2-6 4-4Z`}
              />
            ))}
            <path d="M-27 88Q0 98 27 88" stroke={attire.trim} strokeWidth="2" />
          </g>
        )}
        {occasion === "sangeet" && (
          <g className="sequin-work">
            <path
              d={
                flared
                  ? "M-25 82Q0 94 25 82M-21 74Q0 85 21 74"
                  : "M-14 48H14M-14 52H14"
              }
              fill="none"
              stroke="#e6d4f7"
              strokeWidth="2"
            />
            {Array.from({ length: flared ? 20 : 12 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${-10 + (i % 4) * 7} ${28 + Math.floor(i / 4) * 10})`}
              >
                <path
                  className={i % 7 === 0 ? "dress-sparkle" : undefined}
                  style={{ animationDelay: `${-(i % 7) * 0.6}s` }}
                  d="M0-2.5L.8-.8L2.5 0L.8.8L0 2.5L-.8.8L-2.5 0L-.8-.8Z"
                  fill={i % 3 ? "#fff4ce" : "#cce9ff"}
                />
              </g>
            ))}
            <path
              d={flared ? "M-9 15Q0 36 10 15" : "M-7 12V18L0 22L7 18V12"}
              stroke="#eee5ff"
              strokeWidth="2.5"
              fill="none"
            />
          </g>
        )}
        {occasion === "baraat" && (
          <g>
            <path
              d="M-11 15L-15 72L-7 80L-3 17M8 15L18 69L25 73L16 17"
              fill="#8e3048"
              stroke="#d5a34e"
              strokeWidth="1.5"
            />
            {[31, 43, 55, 67].map((y) => (
              <g key={y}>
                <path d={`M0 ${y - 3}l3 3-3 3-3-3Z`} fill="#b58333" />
                <circle cx="7" cy={y} r="1.2" fill="#ffebbb" />
              </g>
            ))}
            <path
              d="M-15-12V-24Q-3-37 14-23L16-11Z"
              fill="#8e3048"
              stroke="#d5a34e"
              strokeWidth="1.5"
            />
            <path
              d="M-13-22L13-14M-12-16L8-28"
              stroke="#e9bb63"
              strokeWidth="2"
            />
            <path d="M3-28Q-7-52 6-46Q15-42 3-28" fill="#fff0c6" />
            <circle cx="3" cy="-21" r="3" fill="#e8c06d" />
            <path
              d="M-7 12Q0 34 8 12M-7 15Q0 42 8 15"
              stroke="#fff0cf"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        )}
      </g>
    </g>
  );
}
export function Courtyard({
  theme = "royal",
  scene = 0,
  characters = [0, 1],
  outfits = [0, 1],
  className = "",
  children,
  label,
  immersive = false,
}: {
  theme?: InvitationContent["theme"];
  scene?: number;
  characters?: [number, number];
  outfits?: [number, number];
  className?: string;
  children?: ReactNode;
  label?: string;
  immersive?: boolean;
}) {
  const p = palettes[theme];
  return (
    <svg
      className={`animated-courtyard ${className}`}
      viewBox="0 0 700 480"
      preserveAspectRatio={immersive ? "xMidYMax slice" : "xMidYMid meet"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={
        label ??
        `An illustrated couple at ${architectureNames[theme]}, with flowering trees`
      }
    >
      <rect width="700" height="480" fill={p.sky} />
      <circle cx="350" cy="99" r="51" fill="#fff4d6" opacity=".7" />
      {theme === "midnight" && (
        <g fill={p.trim}>
          {[
            [78, 50],
            [168, 79],
            [252, 35],
            [463, 47],
            [559, 74],
            [629, 39],
          ].map(([x, y]) => (
            <path key={x} d={`M${x} ${y - 4}l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z`} />
          ))}
        </g>
      )}
      <path
        d="M0 275Q90 230 180 265Q250 215 350 256Q450 220 540 265Q620 233 700 275V480H0Z"
        fill={p.shadow}
        opacity=".2"
      />
      <path d="M0 361H700V480H0Z" fill={p.floor} />
      <path d="M270 480L327 345H375L437 480" fill={p.trim} opacity=".6" />
      <path
        d="M0 405H700M0 444H700M90 480L170 360M610 480L530 360"
        stroke={p.shadow}
        opacity=".25"
      />
      {theme === "royal" ? (
        <g data-architecture="royal">
          <path d="M113 362V169H242V132H458V169H587V362" fill={p.wall} />
          <path
            d="M103 166H253V180H103ZM447 166H597V180H447ZM229 128H471V140H229Z"
            fill={p.roof}
          />
          <path
            d="M250 127Q261 111 281 114Q303 66 350 53Q398 66 419 114Q438 111 450 127Z"
            fill={p.roof}
          />
          <path
            d="M270 120Q311 117 350 70Q390 117 429 120M350 53V39M341 44H359"
            stroke={p.trim}
            strokeWidth="2"
          />
          <path
            d="M144 165V128Q178 85 211 128V165M489 165V128Q522 85 556 128V165"
            fill={p.roof}
          />
          <path d="M140 128H215M485 128H560" stroke={p.trim} strokeWidth="3" />
          <path
            d="M253 355V242Q253 179 350 149Q447 179 447 242V355"
            fill={p.shadow}
          />
          <path
            d="M279 359V242Q279 200 350 172Q421 200 421 242V359Z"
            fill={p.ink}
          />
          <path
            d="M268 359V242Q268 190 350 161Q432 190 432 242V359"
            stroke={p.trim}
            strokeWidth="3"
          />
          <path
            d="M298 358V246Q298 216 350 194Q402 216 402 246V358"
            fill={p.sky}
            opacity=".35"
          />
          {[155, 207, 493, 545].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x - 15} 268V218Q${x} 190 ${x + 15} 218V268Z`}
                fill={p.ink}
              />
              <path
                d={`M${x - 11} 265V218Q${x} 198 ${x + 11} 218V265`}
                stroke={p.trim}
                opacity=".8"
              />
              <path
                d={`M${x - 15} 310V290Q${x} 270 ${x + 15} 290V310Z`}
                fill={p.shadow}
              />
              {i % 2 === 0 && (
                <path
                  d={`M${x} 218V263M${x - 10} 238H${x + 10}`}
                  stroke={p.trim}
                />
              )}
            </g>
          ))}
        </g>
      ) : (
        <ThemeArchitecture theme={theme} palette={p} />
      )}
      <path d="M102 344H599V360H102Z" fill={p.shadow} />
      <path d="M99 358H603V367H99Z" fill={p.trim} />
      <path d="M254 367H447L468 393H232Z" fill={p.wall} />
      <path d="M243 379H458M231 393H469" stroke={p.shadow} strokeWidth="2" />
      {[0, 1].map((side) => (
        <g
          key={side}
          transform={side ? "translate(700 0) scale(-1 1)" : undefined}
        >
          <g className="courtyard-foliage">
            <path
              d="M45 390Q90 267 58 151M62 275L15 218M69 252L121 204M54 195L29 157"
              stroke={p.ink}
              strokeWidth="5"
            />
            {[
              [18, 186, -30],
              [42, 163, 20],
              [81, 187, 50],
              [103, 213, 55],
              [31, 231, -40],
              [80, 255, 30],
              [18, 271, -20],
              [67, 126, 10],
              [113, 174, 20],
              [27, 130, -10],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                <ellipse
                  rx="26"
                  ry="12"
                  fill={p.leaf}
                  opacity={i % 2 ? ".85" : "1"}
                />
                <path d="M-21 0H21" stroke={p.trim} opacity=".5" />
              </g>
            ))}
            {[
              [36, 193],
              [81, 156],
              [22, 265],
              [100, 238],
              [43, 116],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle cx="-5" r="8" fill={p.flower} />
                <circle cx="5" r="8" fill={p.flower} />
                <circle cy="-5" r="8" fill={p.flower} />
                <circle cy="5" r="8" fill={p.flower} />
                <circle r="3" fill={p.trim} />
              </g>
            ))}
          </g>
          <path d="M27 384H69L60 419H36Z" fill={p.roof} />
          <path d="M24 382H72V390H24Z" fill={p.trim} />
          <path d="M135 362H176L170 387H141Z" fill={p.roof} />
          <path
            d="M154 361V321M154 345Q130 337 133 319Q155 323 154 345M154 343Q178 333 175 319Q152 320 154 343"
            fill={p.leaf}
            stroke={p.leaf}
          />
        </g>
      ))}
      {theme === "marigold" && (
        <g>
          {[0, 1, 2].map((j) => (
            <g key={j}>
              <path
                d={`M${120 + j * 150} 175Q${195 + j * 150} 263 ${270 + j * 150} 175`}
                stroke={p.leaf}
                strokeWidth="3"
              />
              {Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={125 + j * 150 + i * 17}
                  cy={184 + Math.sin((i / 8) * Math.PI) * 40}
                  r="6"
                  fill={p.flower}
                />
              ))}
            </g>
          ))}
        </g>
      )}
      {(theme === "garden" || theme === "rose") && (
        <path
          d="M225 358V200Q225 137 350 133Q475 137 475 200V358M236 223Q222 185 250 170Q248 194 236 223M463 223Q480 188 450 170Q450 195 463 223"
          stroke={p.leaf}
          strokeWidth="8"
        />
      )}
      {theme === "rose" && (
        <g>
          {[
            [-95, 195],
            [-67, 153],
            [-32, 138],
            [32, 138],
            [67, 153],
            [95, 195],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${350 + x} ${y})`}>
              <circle r="10" fill={p.flower} />
              <circle r="5" fill={p.trim} />
              <circle r="2" fill={p.roof} />
            </g>
          ))}
        </g>
      )}
      {theme === "lotus" && (
        <g>
          <ellipse
            cx="350"
            cy="450"
            rx="125"
            ry="19"
            fill={p.shadow}
            opacity=".6"
          />
          {[270, 350, 430].map((x) => (
            <g key={x} transform={`translate(${x} 447)`}>
              <ellipse cy="5" rx="22" ry="5" fill={p.leaf} />
              <path
                d="M0 3Q-27-2-16-17Q-4-15 0 3Q27-2 16-17Q4-15 0 3M0 3Q-14-13 0-25Q14-13 0 3"
                fill={p.flower}
                stroke={p.trim}
              />
            </g>
          ))}
        </g>
      )}
      {scene === 2 && (
        <>
          <path
            d="M185 433Q270 414 340 446Q420 478 524 409"
            stroke={p.roof}
            strokeWidth="2"
            strokeDasharray="4 9"
          />
          <path d="M507 411L524 409L520 426" stroke={p.roof} strokeWidth="2" />
        </>
      )}
      {children ?? (
        <>
          <Character
            x={scene === 2 ? 305 : 326}
            y={scene === 1 ? 281 : 298}
            appearance={characters[0]}
            outfit={outfits[0]}
            scale={scene === 1 ? 1.32 : 1}
          />
          <Character
            x={scene === 2 ? 370 : 379}
            y={scene === 1 ? 281 : 298}
            appearance={characters[1]}
            outfit={outfits[1]}
            scale={scene === 1 ? 1.32 : 1}
          />
        </>
      )}
      <path
        d="M143 445Q173 423 192 442Q171 453 143 445M526 457Q550 431 571 445Q552 459 526 457"
        fill={p.leaf}
        opacity=".7"
      />
      <path
        d="M0 465Q90 439 182 469M521 475Q606 445 700 469"
        stroke={p.leaf}
        strokeWidth="1.5"
        opacity=".7"
      />
      {scene === 4 &&
        [110, 196, 270, 448, 516, 590].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${70 + (i % 3) * 35}v10m-5-5h10`}
            stroke={p.roof}
            opacity=".5"
          />
        ))}
    </svg>
  );
}
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 12H44M96 12H140M60 12L70 2L80 12L70 22ZM49 12L54 7L59 12L54 17ZM81 12L86 7L91 12L86 17Z"
        stroke="currentColor"
      />
      <circle cx="70" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
