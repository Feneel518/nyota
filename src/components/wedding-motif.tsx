import type { CeremonyKind } from "@/lib/content";

/** Lightweight, static foil-style artwork for the printed invitation surfaces. */
export function WeddingMotif({
  className,
  kind = "celebration",
}: {
  className?: string;
  kind?: CeremonyKind;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 140h192M36 145h168" opacity=".45" />
      <path
        d="M30 125V65q0-24 24-24Q70 18 92 28Q120-5 148 28q22-10 38 13 24 0 24 24v60"
        opacity=".4"
      />
      <path
        d="M38 122V66q0-17 20-18 16-23 35-13 27-29 54 0 19-10 35 13 20 1 20 18v56"
        opacity=".3"
      />
      {kind === "sangeet" ? (
        <g>
          <path
            d="m79 76 70-16 14 54-70 16Z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <ellipse
            cx="86"
            cy="103"
            rx="11"
            ry="28"
            transform="rotate(-14 86 103)"
          />
          <ellipse
            cx="156"
            cy="87"
            rx="11"
            ry="28"
            transform="rotate(-14 156 87)"
          />
          <path d="m84 76 22 47 5-53 24 47 5-53 21 47M78 61l-15-17m97 3 14-18M58 85V63l15-4v16" />
          <circle cx="54" cy="87" r="4" />
          <circle cx="69" cy="77" r="4" />
        </g>
      ) : kind === "wedding" ? (
        <g>
          <path d="M70 131V65h100v66M63 65h114l-10-14H73ZM83 51q37-42 74 0M65 131h110M80 65q0 36 40 36t40-36M76 71v53m88-53v53" />
          <path
            d="M102 129q18-8 36 0m-28-8q-8-10 7-20-1 9 6 13 1-9 6-12 12 15 1 21"
            fill="currentColor"
            fillOpacity=".1"
          />
          {[82, 101, 120, 139, 158].map((x) => (
            <circle key={x} cx={x} cy={71} r="3" />
          ))}
        </g>
      ) : kind === "haldi" ? (
        <g>
          <path d="M73 103q47 60 94 0ZM69 101h102M105 129h30M113 90q-9-13 3-20m10 20q13-15 1-27" />
          {[76, 120, 164].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i === 1 ? 44 : 66})`}>
              {[0, 60, 120].map((r) => (
                <ellipse
                  key={r}
                  rx="6"
                  ry="15"
                  transform={`rotate(${r})`}
                  fill="currentColor"
                  fillOpacity=".08"
                />
              ))}
              <circle r="4" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          <path
            d="M120 127q-34-20 0-66 34 46 0 66Z"
            fill="currentColor"
            fillOpacity=".08"
          />
          <path
            d="M120 127Q70 132 66 84q37 0 54 43Zm0 0q50 5 54-43-37 0-54 43Z"
            fill="currentColor"
            fillOpacity=".06"
          />
          <path d="M120 127Q79 107 89 67q22 10 31 33 9-23 31-33 10 40-31 60ZM88 134q32 8 64 0" />
          <path d="M120 44v-9m-28 16-5-8m61 8 5-8" />
        </g>
      )}
      <path d="M46 133q-12-27 7-43m-6 34q-15-3-12-13 12-2 12 13m2-14q-4-13 8-14 3 11-8 14M194 133q12-27-7-43m6 34q15-3 12-13-12-2-12 13m-2-14q4-13-8-14-3 11 8 14" />
    </svg>
  );
}
