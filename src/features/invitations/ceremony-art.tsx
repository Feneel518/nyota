"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Character, Courtyard } from "@/components/illustration";
import {
  type CeremonyKind,
  type InvitationContent,
  type Language,
} from "@/lib/content";
import styles from "./ceremony.module.css";

const descriptions: Record<CeremonyKind, { en: string; gu: string }> = {
  haldi: {
    en: "Haldi: family tosses golden turmeric over the couple, surrounded by marigold garlands and brass bowls.",
    gu: "હલદી: ગલગોટાના ફૂલો વચ્ચે પરિવાર વર-વધૂ પર હલદી ઉડાડે છે.",
  },
  mehendi: {
    en: "Mehendi: an artist applies henna as floral patterns bloom across a decorated hand, beneath a flower swing.",
    gu: "મહેંદી: ફૂલોના હીંચકા નીચે કલાકાર હાથ પર મહેંદીની ભાત દોરે છે.",
  },
  sangeet: {
    en: "Sangeet: the couple and friends dance with raised arms, a beating dhol, and sweeping stage lights.",
    gu: "સંગીત: ઢોલના તાલે વર-વધૂ અને મિત્રો મંચ પર નૃત્ય કરે છે.",
  },
  wedding: {
    en: "Wedding: a dancing baraat accompanies the groom on a decorated horse, then the couple exchanges flower garlands under the mandap.",
    gu: "લગ્ન: ઘોડા પર વરરાજા અને નાચતા જાનૈયાઓનો વરઘોડો, પછી મંડપ નીચે વરમાળાની આપલે.",
  },
  celebration: {
    en: "The newlyweds stand hand in hand beneath the flower mandap, wearing wedding garlands beside the ceremonial lamps.",
    gu: "ફૂલો અને દીવાઓ વચ્ચે વર-વધૂ મહેમાનોનું સ્વાગત કરે છે.",
  },
};

function Flower({
  x,
  y,
  color = "#edae35",
  size = 1,
}: {
  x: number;
  y: number;
  color?: string;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        d="M0-8C8-15 14-5 8 0C15 8 5 14 0 8C-8 15-14 5-8 0C-15-8-5-14 0-8"
        fill={color}
      />
      <circle r="3" fill="#fff0bf" />
    </g>
  );
}

function Stage({ kind }: { kind: CeremonyKind }) {
  const green = kind === "mehendi";
  const color = kind === "haldi" ? "#e8a326" : green ? "#74875b" : "#aa5261";
  return (
    <g>
      <path d="M170 380H530L550 414H150Z" fill={color} />
      <path d="M158 403H542M167 392H533" stroke="#edcf9b" strokeWidth="3" />
      <path
        d="M193 374V185M507 374V185M181 185H519"
        stroke="#bc9660"
        strokeWidth="9"
      />
      <path
        d="M184 184Q270 124 350 160Q430 124 517 184L504 207Q426 167 350 190Q276 167 196 207Z"
        fill={color}
      />
      <g className={styles.drape}>
        <path d="M195 195Q230 272 205 368H180Q208 277 184 195Z" fill={color} />
        <path d="M505 195Q470 272 495 368H520Q492 277 516 195Z" fill={color} />
      </g>
      {[0, 1, 2].map((strand) => (
        <g
          key={strand}
          className={styles.garland}
          style={{ animationDelay: `${strand * -0.7}s` }}
        >
          <path
            d={`M${196 + strand * 101} 195q50 55 101 0`}
            stroke="#64764e"
            strokeWidth="2"
          />
          {Array.from({ length: 9 }, (_, i) => (
            <Flower
              key={i}
              x={200 + strand * 101 + i * 12}
              y={199 + Math.sin((i / 8) * Math.PI) * 26}
              color={green ? "#eedbb3" : "#e8a326"}
              size={0.65}
            />
          ))}
        </g>
      ))}
      {[196, 504].map((x) => (
        <g key={x}>
          <path d={`M${x} 190V330`} stroke="#819260" />
          {Array.from({ length: 8 }, (_, i) => (
            <Flower
              key={i}
              x={x}
              y={199 + i * 17}
              color={i % 2 ? "#f2c05a" : "#d98042"}
              size={0.8}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

function Petals({ gold = false }: { gold?: boolean }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${140 + ((i * 79) % 420)} ${100 + (i % 4) * 25})`}
        >
          <g
            className={styles.petal}
            style={{
              animationDelay: `${-i * 0.63}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          >
            <ellipse
              rx="4"
              ry="7"
              fill={gold ? "#f3bd38" : i % 2 ? "#ca7187" : "#fff0bc"}
              transform={`rotate(${i * 31})`}
            />
          </g>
        </g>
      ))}
    </g>
  );
}

function Dhol({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={styles.dhol}>
        <path
          d="M-24-8Q0-18 24-8V17Q0 27-24 17Z"
          fill="#ae533a"
          stroke="#f6d59d"
          strokeWidth="2"
        />
        <ellipse cx="-24" cy="4" rx="7" ry="14" fill="#f9dfb0" />
        <ellipse cx="24" cy="4" rx="7" ry="14" fill="#f9dfb0" />
        <path
          d="M-21-8L0 22L21-8M-21 18L0-12L21 18"
          stroke="#f9dfb0"
          strokeWidth="2"
        />
      </g>
    </g>
  );
}

function Haldi({ content }: { content: InvitationContent }) {
  return (
    <g>
      <path d="M278 370V332H421V370" stroke="#ad7744" strokeWidth="12" />
      <Character
        x={316}
        y={276}
        appearance={content.characters[0]}
        outfit={1}
        scale={0.9}
      />
      <Character
        x={390}
        y={276}
        appearance={content.characters[1]}
        outfit={1}
        scale={0.9}
      />
      <Character x={228} y={286} appearance={2} outfit={0} motion="toss" />
      <g transform="translate(700 0) scale(-1 1)">
        <Character x={228} y={286} appearance={3} outfit={2} motion="toss" />
      </g>
      {[0, 1].map((side) => (
        <g
          key={side}
          transform={side ? "translate(700 0) scale(-1 1)" : undefined}
        >
          <g transform="translate(258 303)">
            <g className={styles.powder}>
              {[
                [-8, 2, 16],
                [12, -7, 23],
                [34, 1, 18],
                [20, 17, 16],
                [50, 10, 12],
              ].map(([x, y, r], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={i % 2 ? "#f8c83f" : "#e7a619"}
                  opacity=".65"
                />
              ))}
            </g>
            {Array.from({ length: 9 }, (_, i) => (
              <circle
                key={i}
                className={styles.turmeric}
                cx={i * 4}
                cy={(i % 3) * 5}
                r={2 + (i % 3)}
                fill="#edb329"
                style={{ animationDelay: `${i * 0.04}s` }}
              />
            ))}
          </g>
          <ellipse cx="255" cy="390" rx="29" ry="8" fill="#f7cd55" />
          <path d="M226 390Q230 416 255 416Q280 416 284 390" fill="#b68842" />
          <ellipse cx="255" cy="390" rx="21" ry="5" fill="#e9ad1f" />
        </g>
      ))}
      <Petals gold />
    </g>
  );
}

function Mehendi({ content }: { content: InvitationContent }) {
  return (
    <g>
      <g className={styles.swing}>
        <path d="M260 195V349M405 195V349" stroke="#aa8955" strokeWidth="3" />
        <path d="M249 351H417" stroke="#537350" strokeWidth="12" />
        <Character
          x={316}
          y={264}
          scale={0.82}
          appearance={content.characters[0]}
          outfit={content.outfits[0]}
          motion="henna"
        />
        {[220, 252, 284, 316].map((y) => (
          <g key={y}>
            <Flower x={260} y={y} color="#d89198" size={0.7} />
            <Flower x={405} y={y} color="#eee0ac" size={0.7} />
          </g>
        ))}
      </g>
      <Character
        x={374}
        y={282}
        scale={0.8}
        appearance={2}
        outfit={2}
        motion="henna"
      />
      <path d="M348 315L332 312L330 327Z" fill="#637343" />
      <g transform="translate(493 303)">
        <circle r="68" fill="#fff2d8" stroke="#b49760" strokeWidth="2" />
        <path
          d="M-22 45L-27 20L-43-1Q-48-12-40-15Q-36-16-26-3L-28-39Q-27-49-21-45L-15-13L-14-48Q-10-56-5-47L-3-14L2-48Q7-56 11-46L10-12L17-36Q24-42 26-31L21 14L12 44Z"
          fill="#d7a37c"
          stroke="#ae7651"
          strokeWidth="1.5"
        />
        <g
          className={styles.hennaBloom}
          stroke="#804629"
          fill="none"
          strokeWidth="1.6"
        >
          <circle cx="-3" cy="7" r="15" />
          <circle cx="-3" cy="7" r="9" />
          <path d="M-3-4Q13 7-3 18Q-19 7-3-4M-18 28Q-3 19 13 28M-19 34Q-3 25 12 34M-21-18L-16-19M-14-26L-6-26M0-28L9-28M15-19L22-17" />
          {Array.from({ length: 8 }, (_, i) => (
            <circle
              key={i}
              cx={-3 + Math.cos((i * Math.PI) / 4) * 20}
              cy={7 + Math.sin((i * Math.PI) / 4) * 20}
              r="2"
            />
          ))}
        </g>
        <g className={styles.hennaCone}>
          <path d="M10 6L44-27L54-12Z" fill="#536c42" />
          <path d="M26-8L42-3M34-17L49-9" stroke="#e7cc90" strokeWidth="2" />
          <circle cx="10" cy="6" r="2" fill="#804629" />
        </g>
      </g>
      <Petals />
    </g>
  );
}

function DiscoStage() {
  return (
    <g data-disco-stage="true">
      <path d="M172 374V184Q350 126 528 184V374Z" fill="#282544" />
      <path
        d="M164 179Q350 110 536 179M177 179V375M523 179V375"
        fill="none"
        stroke="#ad99bc"
        strokeWidth="7"
      />
      <path
        d="M172 191Q350 133 528 191"
        fill="none"
        stroke="#ecd4a3"
        strokeWidth="2"
      />
      <path
        d="M166 374H534L558 413H142Z"
        fill="#37324f"
        stroke="#cbb0cd"
        strokeWidth="2"
      />
      {[0, 1, 2].map((row) => (
        <g
          key={row}
          className={styles.floorLight}
          style={{ animationDelay: `${-row}s` }}
        >
          {Array.from({ length: 8 }, (_, col) => (
            <path
              key={col}
              d={`M${170 + col * 44 - row * 6} ${379 + row * 10}h39l4 7h-44Z`}
              fill={["#b27ade", "#6ebbc8", "#e5adbb"][(col + row) % 3]}
            />
          ))}
        </g>
      ))}
      {[198, 246, 454, 502].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 183v10`} stroke="#eee1c0" strokeWidth="2" />
          <rect
            x={x - 9}
            y="191"
            width="18"
            height="12"
            rx="3"
            fill="#1c1b31"
          />
          <ellipse
            cx={x}
            cy="204"
            rx="8"
            ry="3"
            fill={["#e4b2fa", "#80d4e0", "#edc77a", "#f0a1c3"][i]}
          />
        </g>
      ))}
      {[174, 508].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="320"
            width="25"
            height="52"
            rx="3"
            fill="#201e31"
            stroke="#6c6386"
          />
          <circle
            cx={x + 12.5}
            cy="335"
            r="7"
            stroke="#ad99bc"
            fill="#383249"
          />
          <circle
            cx={x + 12.5}
            cy="356"
            r="9"
            stroke="#ad99bc"
            fill="#383249"
          />
        </g>
      ))}
      <path d="M350 149V186" stroke="#ded4e6" strokeWidth="2" />
      <g className={styles.mirrorBall}>
        <circle cx="350" cy="208" r="24" fill="#b9b7d6" stroke="#ede9ff" />
        {[-2, -1, 0, 1, 2].map((row) => (
          <g key={row}>
            {[-2, -1, 0, 1, 2]
              .filter((col) => row * row + col * col < 7)
              .map((col) => (
                <rect
                  className={col === 0 ? styles.mirrorTile : undefined}
                  key={col}
                  x={346 + col * 8}
                  y={204 + row * 8}
                  width="6"
                  height="6"
                  fill={(row + col) % 2 ? "#f8edff" : "#8a87ac"}
                  style={{ animationDelay: `${-(row + col + 5) * 0.4}s` }}
                />
              ))}
          </g>
        ))}
      </g>
      {Array.from({ length: 14 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${209 + ((i * 41) % 277)} ${229 + ((i * 29) % 110)})`}
        >
          <path
            className={i % 4 === 0 ? styles.discoGlimmer : undefined}
            style={{ animationDelay: `${-i * 0.45}s` }}
            d="M0-3V3M-3 0H3"
            stroke={i % 2 ? "#b7eaf1" : "#e5b5ef"}
            strokeWidth="1.5"
          />
        </g>
      ))}
    </g>
  );
}

function Sangeet({ content }: { content: InvitationContent }) {
  return (
    <g>
      <DiscoStage />
      <g className={styles.spotlight}>
        <path d="M198 204L240 398H465Z" fill="#ca94f3" opacity=".28" />
        <path d="M246 204L330 398H465Z" fill="#8dd9e5" opacity=".18" />
      </g>
      <g className={styles.spotlightRight}>
        <path d="M502 204L235 398H410Z" fill="#f4b9ce" opacity=".28" />
        <path d="M454 204L235 398H335Z" fill="#edd59a" opacity=".18" />
      </g>
      <g>
        <Character
          x={309}
          y={273}
          appearance={content.characters[0]}
          outfit={content.outfits[0]}
          motion="dance"
          occasion="sangeet"
          composited
        />
      </g>
      <g>
        <Character
          x={390}
          y={275}
          appearance={content.characters[1]}
          outfit={content.outfits[1]}
          motion="dance"
          occasion="sangeet"
          composited
        />
      </g>
      <Character
        x={212}
        y={298}
        appearance={2}
        outfit={2}
        scale={0.85}
        motion="dance"
        occasion="sangeet"
        composited
      />
      <Character
        x={485}
        y={298}
        appearance={3}
        outfit={1}
        scale={0.85}
        motion="drum"
        occasion="sangeet"
        composited
      />
      <Dhol x={485} y={350} />
      {[0, 1, 2, 3].map((i) => (
        <g
          key={i}
          transform={`translate(${239 + i * 74} ${226 + (i % 2) * 14})`}
        >
          <path
            className={styles.note}
            style={{ animationDelay: `${i * -0.6}s` }}
            d="M0 12V-9L15-14V7M0-5L15-10M0 12C-3 6-12 10-10 15C-8 20 1 18 0 12M15 7C12 1 3 5 5 10C7 15 16 13 15 7"
            fill="#e6bf72"
          />
        </g>
      ))}
      <Petals />
    </g>
  );
}

function Wedding({ content }: { content: InvitationContent }) {
  return (
    <g>
      <g className={styles.baraat}>
        <g className={styles.procession}>
          <Character x={208} y={283} appearance={2} outfit={2} motion="dance" />
          <Character
            x={151}
            y={302}
            appearance={3}
            outfit={1}
            scale={0.8}
            motion="drum"
          />
          <Dhol x={151} y={345} />
          <g transform="translate(350 329)">
            <g className={styles.horse}>
              <path
                d="M-64 14L-59 61H-49L-40 19M15 17L25 61H36L32 9"
                fill="#e0cbae"
                stroke="#ac886b"
                strokeWidth="2"
              />
              <path d="M-63-17Q-92-9-91 29Q-79 9-64 4" fill="#735545" />
              <path
                d="M-65-13Q-31-31 16-12L30-56L49-67L67-44L63-27L42-27L37 12Q-15 38-65 15Z"
                fill="#fff0d5"
                stroke="#bf9c7f"
                strokeWidth="2"
              />
              <path
                d="M34-55L36-78L45-65M49-65L54-78L59-54"
                fill="#fff0d5"
                stroke="#bf9c7f"
                strokeWidth="2"
              />
              <path
                d="M-49-13Q-26-25 6-11L3 25Q-24 34-49 22Z"
                fill="#a03e53"
                stroke="#dfb769"
                strokeWidth="3"
              />
              <path
                d="M30-51L60-35M37-26L4-2"
                stroke="#a03e53"
                strokeWidth="3"
              />
              <circle cx="51" cy="-47" r="2.5" fill="#47372d" />
              <Flower x={37} y={-59} color="#dc9b37" />
            </g>
            <Character
              x={-20}
              y={-74}
              scale={0.75}
              appearance={content.characters[1]}
              outfit={1}
              motion="ride"
              occasion="baraat"
            />
          </g>
          <g className={styles.umbrella}>
            <path d="M425 237V374" stroke="#a8814d" strokeWidth="4" />
            <path
              d="M375 239Q425 171 475 239Z"
              fill="#a03e53"
              stroke="#efcf8f"
              strokeWidth="3"
            />
            {[384, 404, 425, 446, 466].map((x) => (
              <path
                key={x}
                d={`M${x} 240v13`}
                stroke="#efcf8f"
                strokeWidth="3"
              />
            ))}
          </g>
        </g>
      </g>
      <g className={styles.varmala}>
        <Character
          x={308}
          y={274}
          appearance={content.characters[0]}
          outfit={content.outfits[0]}
          motion="garland"
        />
        <g transform="translate(700 0) scale(-1 1)">
          <Character
            x={308}
            y={274}
            appearance={content.characters[1]}
            outfit={content.outfits[1]}
            motion="garland"
          />
        </g>
        {[0, 1].map((side) => (
          <g
            key={side}
            transform={side ? "translate(700 0) scale(-1 1)" : undefined}
          >
            <g
              className={styles.exchange}
              style={{ animationDelay: side ? "1.6s" : "0s" }}
            >
              <path
                d="M326 294Q322 348 350 348Q377 348 374 294"
                stroke="#68824d"
                strokeWidth="4"
              />
              {Array.from({ length: 11 }, (_, i) => (
                <Flower
                  key={i}
                  x={350 - Math.cos((i / 10) * Math.PI) * 24}
                  y={296 + Math.sin((i / 10) * Math.PI) * 47}
                  color={i % 3 ? "#f4dcb0" : "#b2455d"}
                  size={0.52}
                />
              ))}
            </g>
          </g>
        ))}
        <path d="M334 391H368L361 409H341Z" fill="#aa7147" />
        <g className={styles.flame}>
          <path
            d="M350 399Q327 385 347 367Q343 383 358 378Q371 393 350 399"
            fill="#e8a036"
          />
          <path d="M350 398Q341 386 352 381Q351 390 357 391Z" fill="#ffe5a0" />
        </g>
      </g>
      <Petals />
    </g>
  );
}

export function CeremonyArt({
  content,
  kind,
  language = "en",
  paused = false,
  immersive = false,
}: {
  content: InvitationContent;
  kind: CeremonyKind;
  language?: Language;
  paused?: boolean;
  immersive?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = true;
    const update = () => {
      element.dataset.offscreen = String(!visible || document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      ref={root}
      className={styles.art}
      data-ceremony={kind}
      data-paused={paused}
      data-immersive={immersive}
      style={
        {
          "--ceremony-ease": "cubic-bezier(0.77, 0, 0.175, 1)",
        } as CSSProperties
      }
    >
      <Courtyard
        theme={content.theme}
        label={descriptions[kind][language]}
        immersive={immersive}
        className={styles.backdrop}
      >
        {false}
      </Courtyard>
      <svg
        className={`${styles.performers} animated-courtyard`}
        viewBox="0 0 700 480"
        preserveAspectRatio={immersive ? "xMidYMax slice" : "xMidYMid meet"}
        fill="none"
        aria-hidden="true"
      >
        <g className="ceremony-cast">
          {kind !== "sangeet" && <Stage kind={kind} />}
          {kind === "haldi" ? (
            <Haldi content={content} />
          ) : kind === "mehendi" ? (
            <Mehendi content={content} />
          ) : kind === "sangeet" ? (
            <Sangeet content={content} />
          ) : kind === "wedding" ? (
            <Wedding content={content} />
          ) : (
            <g>
              <path
                d="M258 402Q350 421 442 402"
                stroke="#b88a4f"
                strokeWidth="4"
              />
              <path
                d="M277 426Q350 449 423 426"
                stroke="#e7bd78"
                strokeWidth="2"
              />
              {[284, 416].map((x) => (
                <g key={x}>
                  <path d={`M${x - 12} 392h24l-5 14h-14Z`} fill="#ad7441" />
                  <path
                    d={`M${x} 394q-12-11 0-28q12 17 0 28Z`}
                    fill="#e8a036"
                  />
                  <path d={`M${x} 390q-5-7 1-13q5 9-1 13Z`} fill="#ffe5a0" />
                </g>
              ))}
              <Character
                x={322}
                y={278}
                appearance={content.characters[0]}
                outfit={content.outfits[0]}
              />
              <Character
                x={378}
                y={278}
                appearance={content.characters[1]}
                outfit={content.outfits[1]}
              />
              {/* Flower malas and joined hands carry the wedding into the final portrait. */}
              {[322, 378].map((x) => (
                <g key={x}>
                  <path
                    d={`M${x - 13} 296q-8 35 13 43q21-8 13-43`}
                    fill="none"
                    stroke="#5f7848"
                    strokeWidth="4"
                  />
                  {Array.from({ length: 9 }, (_, i) => (
                    <Flower
                      key={i}
                      x={x - 12 + i * 3}
                      y={302 + Math.sin((i / 8) * Math.PI) * 32}
                      color={i % 2 ? "#f5e1b8" : "#bb4860"}
                      size={0.55}
                    />
                  ))}
                </g>
              ))}
              <path
                d="M346 330q4 7 8 0"
                fill="none"
                stroke="#ad7456"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M320 289l2-7 2 7"
                fill="#ae263d"
                stroke="#ae263d"
                strokeWidth="2"
              />
              <path
                d="M313 299q9 18 18 0"
                fill="none"
                stroke="#d9af62"
                strokeWidth="2.5"
              />
              <circle cx="322" cy="318" r="3" fill="#d9af62" />
              <path
                d="M367 277q11-8 21 0"
                fill="none"
                stroke="#dfc588"
                strokeWidth="3"
              />
              <Petals />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
