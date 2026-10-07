"use client";
import { useEffect, useRef, type CSSProperties } from "react";

const position = (value: number) => Math.round(value * 100) / 100;

/** Foreground layers belong to the viewport, rather than the ceremony's stage. */
export function Atmosphere() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = true;
    const update = () => {
      element.dataset.sleeping = String(!visible || document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div ref={root} className="invitation-atmosphere" aria-hidden="true">
      <div className="canopy canopy-left">
        <svg viewBox="0 0 300 600" fill="none">
          <path
            d="M-30-20Q270 110 44 550M0 50Q160 100 217 254"
            stroke="#56694d"
            strokeWidth="5"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g
              key={i}
              transform={`translate(${position(58 + Math.sin(i * 0.8) * 61)} ${50 + i * 77}) rotate(${i * 25 - 30})`}
            >
              <path
                d="M0 0Q-60-62-83-28Q-51 14 0 0M0 0Q43-72 73-48Q65-3 0 0"
                fill={i % 2 ? "#607751" : "#405b45"}
              />
              <path d="M-65-24L0 0L59-43" stroke="#b9b784" />
              <g className="canopy-blossom">
                <path
                  d="M0-15C20-38 39-15 19 0C40 22 14 38 0 18C-20 38-39 14-19 0C-38-20-12-37 0-15Z"
                  fill={i % 2 ? "#d99198" : "#e9bb91"}
                />
                <circle r="7" fill="#f9e3ad" />
              </g>
            </g>
          ))}
        </svg>
      </div>
      <div className="canopy canopy-right">
        <svg viewBox="0 0 300 600" fill="none">
          <path
            d="M-30-20Q270 110 44 550M0 50Q160 100 217 254"
            stroke="#56694d"
            strokeWidth="5"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g
              key={i}
              transform={`translate(${position(58 + Math.sin(i * 0.8) * 61)} ${50 + i * 77}) rotate(${i * 25 - 30})`}
            >
              <path
                d="M0 0Q-60-62-83-28Q-51 14 0 0M0 0Q43-72 73-48Q65-3 0 0"
                fill={i % 2 ? "#607751" : "#405b45"}
              />
              <path d="M-65-24L0 0L59-43" stroke="#b9b784" />
              <g className="canopy-blossom">
                <path
                  d="M0-15C20-38 39-15 19 0C40 22 14 38 0 18C-20 38-39 14-19 0C-38-20-12-37 0-15Z"
                  fill={i % 2 ? "#d99198" : "#e9bb91"}
                />
                <circle r="7" fill="#f9e3ad" />
              </g>
            </g>
          ))}
        </svg>
      </div>
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="ambient-petal"
          style={
            {
              left: `${(i * 37) % 100}%`,
              animationDelay: `${-i * 1.3}s`,
              animationDuration: `${9 + (i % 5)}s`,
              "--petal-drift": `${i % 2 ? 90 : -70}px`,
            } as CSSProperties
          }
        />
      ))}
      <div className="hanging-lights">
        <svg viewBox="0 0 1400 160" preserveAspectRatio="none">
          <path
            d="M0 0Q350 140 700 20Q1050 140 1400 0"
            fill="none"
            stroke="#99794e"
            strokeWidth="2"
          />
          {Array.from({ length: 19 }, (_, i) => (
            <g
              key={i}
              className="hanging-lamp"
              style={{ animationDelay: `${-i * 0.4}s` }}
            >
              <path
                d={`M${i * 77} ${position(20 + Math.sin((i / 18) * Math.PI * 2) ** 2 * 44)}v17`}
                stroke="#99794e"
              />
              <ellipse
                cx={i * 77}
                cy={position(44 + Math.sin((i / 18) * Math.PI * 2) ** 2 * 44)}
                rx="5"
                ry="8"
                fill="#fff0ba"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
