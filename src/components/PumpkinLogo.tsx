import React from "react";

interface PumpkinLogoProps {
  className?: string;
  glow?: boolean;
}

export const PumpkinLogo: React.FC<PumpkinLogoProps> = ({ className = "w-12 h-12", glow = true }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${className} select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Neon Purple Gradient */}
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3cff" />
          <stop offset="50%" stopColor="#b76cff" />
          <stop offset="100%" stopColor="#ff4fd8" />
        </linearGradient>

        {/* Eyes & Smile Inner Glow */}
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0ecff" />
        </linearGradient>

        {/* Outer Ring Gradient */}
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3cff" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ff4fd8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#b76cff" stopOpacity="0.9" />
        </linearGradient>

        {/* Blur filters for majestic neon glows */}
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glowing background halo if requested */}
      {glow && (
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="#7c3cff"
          fillOpacity="0.08"
          filter="url(#neonGlow)"
        />
      )}

      {/* Triple neon concentric outer circles */}
      <circle
        cx="100"
        cy="100"
        r="80"
        stroke="url(#ringGrad)"
        strokeWidth="3"
        filter={glow ? "url(#neonGlow)" : undefined}
      />
      
      <circle
        cx="100"
        cy="100"
        r="75"
        stroke="#ffffff"
        strokeOpacity="0.1"
        strokeWidth="1.2"
        strokeDasharray="6 4"
      />

      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="url(#purpleGrad)"
        strokeOpacity="0.15"
        strokeWidth="1"
      />

      {/* Pumpkin headphones arc (above the stem) */}
      <path
        d="M 52 105 A 58 58 0 0 1 148 105"
        stroke="url(#purpleGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        filter="url(#subtleGlow)"
      />

      {/* MAIN PUMPKIN SHAPE GROUP */}
      <g>
        {/* Pumpkin Stem */}
        <path
          d="M 100 62 C 100 50, 107 46, 113 44 C 111 49, 105 54, 103 62 Z"
          fill="url(#purpleGrad)"
        />

        {/* Slices Overlay for 3D pumpkin curves */}
        {/* Left slice outer */}
        <ellipse cx="74" cy="103" rx="28" ry="38" fill="url(#purpleGrad)" />
        {/* Right slice outer */}
        <ellipse cx="126" cy="103" rx="28" ry="38" fill="url(#purpleGrad)" />
        
        {/* Left inner slice */}
        <ellipse cx="86" cy="103" rx="24" ry="40" fill="url(#purpleGrad)" stroke="#131022" strokeWidth="0.8" />
        {/* Right inner slice */}
        <ellipse cx="114" cy="103" rx="24" ry="40" fill="url(#purpleGrad)" stroke="#131022" strokeWidth="0.8" />

        {/* Center Main Slice */}
        <ellipse cx="100" cy="103" rx="24" ry="41" fill="url(#purpleGrad)" stroke="#131022" strokeWidth="1" />
      </g>

      {/* Headphone Earcups on the side */}
      {/* Left cup */}
      <rect
        x="36"
        y="90"
        width="14"
        height="32"
        rx="7"
        fill="url(#purpleGrad)"
        stroke="#110e20"
        strokeWidth="1.5"
        filter="url(#subtleGlow)"
      />
      {/* Left connection handle */}
      <path
        d="M 45 92 Q 45 80 50 82"
        stroke="url(#purpleGrad)"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Right cup */}
      <rect
        x="150"
        y="90"
        width="14"
        height="32"
        rx="7"
        fill="url(#purpleGrad)"
        stroke="#110e20"
        strokeWidth="1.5"
        filter="url(#subtleGlow)"
      />
      {/* Right connection handle */}
      <path
        d="M 155 92 Q 155 80 150 82"
        stroke="url(#purpleGrad)"
        strokeWidth="3.5"
        fill="none"
      />

      {/* JACK-O'-LANTERN GLOWING FACE CELLS */}
      <g filter="url(#subtleGlow)">
        {/* Left Eye: Angry slanted triangle */}
        <path
          d="M 66 94 L 88 98 L 72 108 Z"
          fill="url(#glowGrad)"
        />
        {/* Right Eye: Angry slanted triangle */}
        <path
          d="M 134 94 L 112 98 L 128 108 Z"
          fill="url(#glowGrad)"
        />

        {/* Jagged Smile Mouth */}
        <path
          d="M 72 118 
             Q 100 138 128 118
             L 118 118
             L 112 124 L 106 118 
             L 100 126
             L 94 118 L 88 124
             L 82 118
             Z"
          fill="url(#glowGrad)"
          stroke="#551bbb"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );
};
