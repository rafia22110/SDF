import React from "react";
import { AvatarConfig, IslandId } from "../types";
import { AVATAR_COLORS } from "../data/content";

export function AvatarSvg({
  config,
  size = 64,
  className = "",
}: {
  config: AvatarConfig;
  size?: number;
  className?: string;
}) {
  const colorObj = AVATAR_COLORS[config.color % AVATAR_COLORS.length] || AVATAR_COLORS[0];
  const primary = colorObj.hex;
  const secondary = colorObj.secondary;
  const shape = config.shape % 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none ${className}`}
      aria-label="דמות תלמיד"
    >
      <defs>
        <radialGradient id={`grad-${shape}-${config.color}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </radialGradient>
      </defs>

      {/* Halo accessory behind head */}
      {config.accessory === "halo" && (
        <ellipse
          cx="50"
          cy="14"
          rx="26"
          ry="6"
          fill="none"
          stroke="#fde047"
          strokeWidth="3.5"
          strokeDasharray="6 3"
        />
      )}

      {/* Shape 0: Astronaut */}
      {shape === 0 && (
        <g>
          <circle
            cx="50"
            cy="54"
            r="34"
            fill={`url(#grad-${shape}-${config.color})`}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.5"
          />
          <rect
            x="26"
            y="38"
            width="48"
            height="28"
            rx="14"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <ellipse cx="38" cy="46" rx="6" ry="3" fill="rgba(255,255,255,0.35)" />
          <circle cx="40" cy="52" r="3.5" fill="#38bdf8" />
          <circle cx="60" cy="52" r="3.5" fill="#38bdf8" />
          <path
            d="M 44 59 Q 50 64 56 59"
            stroke="#38bdf8"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Shape 1: Light Robot */}
      {shape === 1 && (
        <g>
          <line x1="50" y1="15" x2="50" y2="26" stroke={primary} strokeWidth="3.5" />
          <circle cx="50" cy="14" r="5" fill="#fde047" />
          <rect
            x="22"
            y="26"
            width="56"
            height="54"
            rx="14"
            fill={`url(#grad-${shape}-${config.color})`}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.5"
          />
          <rect x="30" y="38" width="40" height="22" rx="6" fill="#0f172a" />
          <circle cx="41" cy="49" r="4.5" fill="#4ade80" />
          <circle cx="59" cy="49" r="4.5" fill="#4ade80" />
          <rect x="38" y="67" width="24" height="5" rx="2.5" fill="#e2e8f0" />
        </g>
      )}

      {/* Shape 2: Star Fox */}
      {shape === 2 && (
        <g>
          <polygon
            points="24,42 30,16 46,34"
            fill={secondary}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <polygon
            points="76,42 70,16 54,34"
            fill={secondary}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="56"
            r="31"
            fill={`url(#grad-${shape}-${config.color})`}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
          <circle cx="39" cy="52" r="4" fill="#0f172a" />
          <circle cx="61" cy="52" r="4" fill="#0f172a" />
          <circle cx="40.5" cy="50.5" r="1.5" fill="#fff" />
          <circle cx="62.5" cy="50.5" r="1.5" fill="#fff" />
          <polygon points="46,61 54,61 50,66" fill="#0f172a" />
          <path
            d="M 43 69 Q 50 74 57 69"
            stroke="#0f172a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Shape 3: Wise Space Owl */}
      {shape === 3 && (
        <g>
          <ellipse
            cx="50"
            cy="55"
            rx="32"
            ry="34"
            fill={`url(#grad-${shape}-${config.color})`}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
          <circle cx="38" cy="48" r="10" fill="#fff" />
          <circle cx="62" cy="48" r="10" fill="#fff" />
          <circle cx="38" cy="48" r="5" fill="#0f172a" />
          <circle cx="62" cy="48" r="5" fill="#0f172a" />
          <polygon points="46,56 54,56 50,65" fill="#fbbf24" />
        </g>
      )}

      {/* Shape 4: Cosmic Crystal */}
      {shape === 4 && (
        <g>
          <polygon
            points="50,16 82,44 70,84 30,84 18,44"
            fill={`url(#grad-${shape}-${config.color})`}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2.5"
          />
          <circle cx="40" cy="52" r="4" fill="#fff" />
          <circle cx="60" cy="52" r="4" fill="#fff" />
          <path
            d="M 43 64 Q 50 70 57 64"
            stroke="#fff"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Accessories */}
      {config.accessory === "crown" && (
        <polygon
          points="32,26 36,10 45,20 50,8 55,20 64,10 68,26"
          fill="#fbbf24"
          stroke="#fef08a"
          strokeWidth="1.5"
        />
      )}
      {config.accessory === "glasses" && (
        <g>
          <rect
            x="26"
            y="43"
            width="20"
            height="12"
            rx="4"
            fill="rgba(34,211,238,0.45)"
            stroke="#fde047"
            strokeWidth="2.5"
          />
          <rect
            x="54"
            y="43"
            width="20"
            height="12"
            rx="4"
            fill="rgba(34,211,238,0.45)"
            stroke="#fde047"
            strokeWidth="2.5"
          />
          <line x1="46" y1="49" x2="54" y2="49" stroke="#fde047" strokeWidth="2.5" />
        </g>
      )}
      {config.accessory === "headphones" && (
        <g>
          <path
            d="M 20 54 A 30 30 0 0 1 80 54"
            fill="none"
            stroke="#f472b6"
            strokeWidth="5"
          />
          <rect x="14" y="45" width="9" height="18" rx="4" fill="#ec4899" />
          <rect x="77" y="45" width="9" height="18" rx="4" fill="#ec4899" />
        </g>
      )}
      {config.accessory === "wand" && (
        <g>
          <line x1="78" y1="78" x2="92" y2="46" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="92" cy="44" r="6" fill="#fef08a" />
        </g>
      )}
    </svg>
  );
}

export function IslandIllustration({
  id,
  size = 110,
}: {
  id: IslandId;
  size?: number;
}) {
  const colorMap: Record<IslandId, { top: string; base: string; glow: string; symbol: string }> = {
    letters: { top: "#22d3ee", base: "#0369a1", glow: "#67e8f9", symbol: "אבג" },
    numbers: { top: "#fbbf24", base: "#b45309", glow: "#fde68a", symbol: "123" },
    words: { top: "#f472b6", base: "#be185d", glow: "#fbcfe8", symbol: "מילה" },
    science: { top: "#4ade80", base: "#047857", glow: "#a7f3d0", symbol: "⚛" },
    logic: { top: "#a78bfa", base: "#5b21b6", glow: "#ddd6fe", symbol: "⚙" },
    create: { top: "#e879f9", base: "#6d28d9", glow: "#f5d0fe", symbol: "✦" },
  };
  const c = colorMap[id];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="select-none overflow-visible"
      aria-hidden="true"
    >
      {/* Floating shadow glow */}
      <ellipse cx="60" cy="104" rx="34" ry="7" fill={c.top} opacity="0.28" />
      {/* Floating rock underside */}
      <polygon
        points="22,66 98,66 82,92 60,102 38,92"
        fill={c.base}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />
      <polygon points="38,66 60,102 52,66" fill="rgba(0,0,0,0.22)" />
      {/* Island top surface */}
      <ellipse
        cx="60"
        cy="64"
        rx="40"
        ry="14"
        fill={c.top}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
      />
      {/* Crystal / dome spire on top */}
      <polygon
        points="60,18 78,58 42,58"
        fill={c.glow}
        opacity="0.92"
        stroke="#fff"
        strokeWidth="2"
      />
      <circle cx="60" cy="44" r="14" fill="rgba(255, 255, 255, 0.9)" />
      <text
        x="60"
        y="49"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="12"
        fontWeight="700"
        fontFamily="Rubik, sans-serif"
      >
        {c.symbol}
      </text>
      {/* Orbiting mini moons */}
      <circle cx="24" cy="36" r="3.5" fill={c.top} />
      <circle cx="95" cy="40" r="2.5" fill={c.base} />
    </svg>
  );
}

export function AnalogClockSvg({
  h,
  m,
  size = 150,
}: {
  h: number;
  m: number;
  size?: number;
}) {
  const minuteAngle = (m % 60) * 6;
  const hourAngle = ((h % 12) + (m % 60) / 60) * 30;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="select-none mx-auto"
      aria-label={`שעון מראה ${h}:${m.toString().padStart(2, "0")}`}
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="#ffffff"
        stroke="#0ea5e9"
        strokeWidth="4"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const rad = ((num * 30 - 90) * Math.PI) / 180;
        const x = 60 + 41 * Math.cos(rad);
        const y = 60 + 41 * Math.sin(rad) + 4;
        return (
          <text
            key={num}
            x={x}
            y={y}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="11"
            fontWeight="700"
          >
            {num}
          </text>
        );
      })}
      {/* Hour hand */}
      <line
        x1="60"
        y1="60"
        x2={60 + 25 * Math.cos(((hourAngle - 90) * Math.PI) / 180)}
        y2={60 + 25 * Math.sin(((hourAngle - 90) * Math.PI) / 180)}
        stroke="#f59e0b"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1="60"
        y1="60"
        x2={60 + 36 * Math.cos(((minuteAngle - 90) * Math.PI) / 180)}
        y2={60 + 36 * Math.sin(((minuteAngle - 90) * Math.PI) / 180)}
        stroke="#0284c7"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="4" fill="#0f172a" />
    </svg>
  );
}

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#22d3ee", "#f472b6", "#fbbf24", "#4ade80", "#a78bfa"];
  return (
    <div aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const left = `${(i * 3.7) % 100}%`;
        const delay = `${(i % 7) * 0.08}s`;
        const dur = `${1.8 + (i % 5) * 0.3}s`;
        const bg = colors[i % colors.length];
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left,
              backgroundColor: bg,
              animationDelay: delay,
              animationDuration: dur,
            }}
          />
        );
      })}
    </div>
  );
}
