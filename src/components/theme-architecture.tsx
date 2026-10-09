import type { InvitationContent } from "@/lib/content";

type Palette = {
  wall: string;
  roof: string;
  trim: string;
  shadow: string;
  ink: string;
  sky: string;
  leaf: string;
  flower: string;
};

export const architectureNames = {
  royal: "a domed royal palace",
  marigold: "a sunlit haveli with carved balconies",
  garden: "an open garden pavilion with a vine-covered pergola",
  rose: "a rose conservatory with a glass roof",
  midnight: "a moonlit palace terrace with slender towers",
  lotus: "a lakeside pavilion with sweeping tiered roofs",
};

/** Each theme has its own silhouette, with a clear central area for the ceremony. */
export function ThemeArchitecture({
  theme,
  palette: p,
}: {
  theme: Exclude<InvitationContent["theme"], "royal">;
  palette: Palette;
}) {
  return (
    <g data-architecture={theme}>
      {theme === "marigold" && (
        <>
          <path d="M114 352V157H254V119H446V157H586V352Z" fill={p.wall} />
          <path
            d="M106 149H263V164H106ZM437 149H594V164H437ZM244 110H456V126H244Z"
            fill={p.roof}
          />
          {[126, 166, 206, 260, 300, 340, 380, 420, 478, 518, 558].map((x) => (
            <path
              key={x}
              d={`M${x} ${x > 245 && x < 450 ? 108 : 147}v-17h18v17`}
              fill={p.wall}
              stroke={p.trim}
              strokeWidth="2"
            />
          ))}
          <path
            d="M269 353V246Q269 180 350 171Q431 180 431 246V353Z"
            fill={p.ink}
          />
          <path
            d="M279 352V246Q279 193 350 183Q421 193 421 246V352"
            stroke={p.trim}
            strokeWidth="4"
          />
          {[154, 224, 476, 546].map((x) => (
            <g key={x}>
              <path
                d={`M${x - 21} 256v-51q21-35 42 0v51Z`}
                fill={p.shadow}
                stroke={p.trim}
                strokeWidth="3"
              />
              <path
                d={`M${x - 28} 252h56v17h-56Zm4-57 24-24 24 24Z`}
                fill={p.roof}
                stroke={p.trim}
                strokeWidth="2"
              />
              <path
                d={`M${x - 16} 259h32m-24-5v13m8-13v13m8-13v13M${x} 204v38`}
                stroke={p.trim}
                strokeWidth="2"
              />
              <path d={`M${x - 18} 332v-36q18-23 36 0v36Z`} fill={p.shadow} />
            </g>
          ))}
          <path
            d="M113 280H255M445 280H587M250 143H450"
            stroke={p.trim}
            strokeWidth="4"
          />
        </>
      )}
      {theme === "garden" && (
        <>
          <path
            d="M128 349V229Q178 183 228 229V349M472 349V229Q522 183 572 229V349"
            stroke={p.leaf}
            strokeWidth="8"
          />
          {[147, 176, 205, 495, 524, 553].map((x) => (
            <path
              key={x}
              d={`M${x} 235v114`}
              stroke={p.leaf}
              strokeWidth="2"
              opacity=".5"
            />
          ))}
          <path d="M170 175L350 86L530 175Z" fill={p.roof} />
          <path d="M197 162L350 101L503 162Z" fill={p.wall} />
          <path
            d="M155 176H545M183 188H517M227 159H473"
            stroke={p.trim}
            strokeWidth="10"
          />
          {[204, 249, 451, 496].map((x) => (
            <g key={x}>
              <path d={`M${x} 188V353`} stroke={p.roof} strokeWidth="13" />
              <path
                d={`M${x - 12} 196h24M${x - 12} 348h24`}
                stroke={p.trim}
                strokeWidth="7"
              />
            </g>
          ))}
          <path
            d="M208 239Q245 235 258 190M492 239Q455 235 442 190"
            stroke={p.roof}
            strokeWidth="7"
          />
          <path
            d="M185 184Q239 213 290 177T402 178T519 183"
            stroke={p.leaf}
            strokeWidth="9"
          />
          {[212, 258, 302, 347, 392, 441, 482].map((x, i) => (
            <g key={x}>
              <ellipse
                cx={x}
                cy={182 + (i % 2) * 7}
                rx="17"
                ry="7"
                fill={p.leaf}
                transform={`rotate(-25 ${x} 184)`}
              />
              <circle cx={x + 7} cy="192" r="5" fill={p.flower} />
            </g>
          ))}
        </>
      )}
      {theme === "rose" && (
        <>
          <path d="M145 352V205L229 144H471L555 205V352Z" fill={p.wall} />
          <path
            d="M229 352V161L350 72L471 161V352Z"
            fill={p.sky}
            stroke={p.roof}
            strokeWidth="6"
          />
          <path
            d="M229 161L350 72L471 161ZM145 205L229 144V205ZM471 144L555 205H471Z"
            fill={p.trim}
            fillOpacity=".45"
            stroke={p.roof}
            strokeWidth="5"
          />
          <path
            d="M350 72V352M289 117V352M411 117V352M229 161H471M145 205H555M145 268H555M175 185V350M525 185V350"
            stroke={p.roof}
            strokeWidth="3"
          />
          <path
            d="M257 352V238Q257 167 350 160Q443 167 443 238V352"
            stroke={p.trim}
            strokeWidth="8"
          />
          <path
            d="M137 352Q167 298 140 243M563 352Q533 298 560 243"
            stroke={p.leaf}
            strokeWidth="6"
          />
          {[0, 1].map((side) => (
            <g
              key={side}
              transform={side ? "translate(700 0) scale(-1 1)" : undefined}
            >
              {[244, 272, 303, 332].map((y, i) => (
                <g key={y}>
                  <ellipse
                    cx={149}
                    cy={y + 6}
                    rx="19"
                    ry="8"
                    fill={p.leaf}
                    transform={`rotate(${i % 2 ? 25 : -25} 149 ${y + 6})`}
                  />
                  <circle
                    cx={i % 2 ? 139 : 158}
                    cy={y}
                    r="10"
                    fill={p.flower}
                  />
                  <path
                    d={`M${i % 2 ? 134 : 153} ${y}q0-8 8-4t-4 10`}
                    stroke={p.trim}
                    strokeWidth="2"
                  />
                </g>
              ))}
            </g>
          ))}
        </>
      )}
      {theme === "midnight" && (
        <>
          <path d="M112 350V293H588V350Z" fill={p.wall} />
          <path d="M107 289H593M108 350H592" stroke={p.trim} strokeWidth="7" />
          {Array.from({ length: 15 }, (_, i) => (
            <path
              key={i}
              d={`M${125 + i * 32} 305v32`}
              stroke={p.ink}
              strokeWidth="8"
            />
          ))}
          {[166, 534].map((x) => (
            <g key={x}>
              <path d={`M${x - 27} 289V163h54v126Z`} fill={p.wall} />
              <path
                d={`M${x - 38} 165q0-39 38-65 38 26 38 65Z`}
                fill={p.roof}
                stroke={p.trim}
                strokeWidth="2"
              />
              <path
                d={`M${x} 100V81M${x - 36} 172h72M${x - 33} 278h66`}
                stroke={p.trim}
                strokeWidth="4"
              />
              <path
                d={`M${x - 12} 254v-49q12-25 24 0v49Z`}
                fill={p.ink}
                stroke={p.trim}
                strokeWidth="2"
              />
            </g>
          ))}
          <path
            d="M231 345V177Q231 159 252 159H448Q469 159 469 177V345"
            stroke={p.wall}
            strokeWidth="13"
          />
          <path
            d="M214 162Q274 135 350 105Q426 135 486 162Z"
            fill={p.roof}
            stroke={p.trim}
            strokeWidth="3"
          />
          <path
            d="M243 202Q350 116 457 202M350 106V86"
            stroke={p.trim}
            strokeWidth="3"
          />
          <path d="M177 175Q350 259 523 175" stroke={p.trim} strokeWidth="2" />
          {[219, 263, 307, 350, 393, 437, 481].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={191 + Math.sin((i / 6) * Math.PI) * 26}
              r="4"
              fill={p.trim}
            />
          ))}
        </>
      )}
      {theme === "lotus" && (
        <>
          <path
            d="M91 354Q350 330 609 354L627 371H73Z"
            fill={p.shadow}
            opacity=".65"
          />
          <path
            d="M152 199Q241 183 350 121Q459 183 548 199Q524 219 495 210H205Q176 219 152 199Z"
            fill={p.roof}
            stroke={p.trim}
            strokeWidth="4"
          />
          <path
            d="M215 139Q303 116 350 68Q397 116 485 139Q452 155 423 148H277Q248 155 215 139Z"
            fill={p.roof}
            stroke={p.trim}
            strokeWidth="3"
          />
          <path
            d="M288 174V148H412V174M350 68V48"
            stroke={p.trim}
            strokeWidth="5"
          />
          {[211, 260, 440, 489].map((x) => (
            <g key={x}>
              <path d={`M${x} 210V353`} stroke={p.wall} strokeWidth="15" />
              <path
                d={`M${x - 12} 220h24M${x - 12} 344h24`}
                stroke={p.trim}
                strokeWidth="6"
              />
            </g>
          ))}
          <path
            d="M219 260Q261 254 273 211M481 260Q439 254 427 211"
            stroke={p.trim}
            strokeWidth="5"
          />
          <path
            d="M144 348H274M426 348H556M157 320H266M434 320H543"
            stroke={p.roof}
            strokeWidth="5"
          />
          {[164, 197, 230, 470, 503, 536].map((x) => (
            <path key={x} d={`M${x} 320v28`} stroke={p.roof} strokeWidth="4" />
          ))}
          <path
            d="M94 367q70 10 130 0m252 0q70 10 130 0"
            stroke={p.trim}
            strokeWidth="3"
          />
        </>
      )}
    </g>
  );
}
