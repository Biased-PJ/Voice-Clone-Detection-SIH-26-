import React from 'react';

export const SoundWaveBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-screen w-screen overflow-hidden z-0 flex items-center justify-center transition-opacity duration-300 select-none opacity-90"
    >
      <svg
        viewBox="0 0 1600 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-[520px] max-h-screen object-cover min-w-[1200px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.04" />
            <stop offset="25%" stopColor="#14b8a6" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#0d9488" stopOpacity="0.32" />
            <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.04" />
          </linearGradient>

          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.05" />
            <stop offset="30%" stopColor="#2dd4bf" stopOpacity="0.20" />
            <stop offset="55%" stopColor="#0f766e" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#14b8a6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.03" />
            <stop offset="35%" stopColor="#0891b2" stopOpacity="0.16" />
            <stop offset="65%" stopColor="#0e7490" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.03" />
          </linearGradient>

          <linearGradient id="centerGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="30%" stopColor="#14b8a6" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M 0 250
             Q 80 180, 160 250
             T 320 250
             Q 400 120, 480 250
             T 640 250
             Q 720 70, 800 250
             T 960 250
             Q 1040 130, 1120 250
             T 1280 250
             Q 1360 190, 1440 250
             T 1600 250
             L 1600 250
             Q 1440 310, 1360 250
             T 1120 250
             Q 1040 370, 960 250
             T 800 250
             Q 720 430, 640 250
             T 480 250
             Q 400 380, 320 250
             T 160 250
             Q 80 320, 0 250 Z"
          fill="url(#waveGrad3)"
        />

        <path
          d="M 0 250
             C 70 210, 110 130, 160 140
             C 210 150, 240 230, 290 250
             C 330 270, 370 160, 420 120
             C 470 80, 510 200, 560 240
             C 610 280, 650 140, 710 90
             C 770 40, 820 180, 880 240
             C 930 290, 980 150, 1040 110
             C 1100 70, 1150 200, 1200 230
             C 1260 270, 1310 160, 1370 170
             C 1430 180, 1480 240, 1600 250
             C 1480 260, 1430 320, 1370 330
             C 1310 340, 1260 230, 1200 270
             C 1150 300, 1100 430, 1040 390
             C 980 350, 930 210, 880 260
             C 820 320, 770 460, 710 410
             C 650 360, 610 220, 560 260
             C 510 300, 470 420, 420 380
             C 370 340, 330 230, 290 250
             C 240 270, 210 350, 160 360
             C 110 370, 70 290, 0 250 Z"
          fill="url(#waveGrad1)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="0.8"
        />

        <path
          d="M 0 250
             Q 90 220, 150 170
             Q 210 120, 270 230
             Q 330 340, 390 180
             Q 450 60, 520 220
             Q 590 380, 660 140
             Q 730 40, 800 210
             Q 870 380, 940 160
             Q 1010 60, 1080 200
             Q 1150 340, 1220 180
             Q 1290 110, 1360 230
             Q 1430 340, 1500 220
             Q 1550 190, 1600 250
             Q 1550 310, 1500 280
             Q 1430 160, 1360 270
             Q 1290 390, 1220 320
             Q 1150 160, 1080 300
             Q 1010 440, 940 340
             Q 870 120, 800 290
             Q 730 460, 660 360
             Q 590 120, 520 280
             Q 450 440, 390 320
             Q 330 160, 270 270
             Q 210 380, 150 330
             Q 90 280, 0 250 Z"
          fill="url(#waveGrad2)"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1"
        />

        <path
          d="M 0 250 Q 400 244, 800 244 Q 1200 244, 1600 250 Q 1200 256, 800 256 Q 400 256, 0 250 Z"
          fill="url(#centerGlow)"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="0.8"
          className="opacity-90"
        />
      </svg>
    </div>
  );
};
