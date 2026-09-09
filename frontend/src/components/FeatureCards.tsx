import React from 'react';
import { StepState } from '../types';
import { useTheme } from '../context/ThemeContext';

interface FeatureCardsProps {
  currentStep?: StepState;
  onStepClick?: (step: StepState) => void;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({
  currentStep = 'upload',
  onStepClick,
}) => {
  const { isDark } = useTheme();

  const getCardClasses = (step: StepState) => {
    const isActive = currentStep === step;
    if (isDark) {
      return isActive
        ? 'bg-[#111e26] border border-teal-400/60 ring-2 ring-teal-400/30 shadow-[0_0_25px_rgba(45,212,191,0.22)] translate-y-[-2px]'
        : 'bg-[#0e161c]/95 border border-slate-800/80 shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:border-teal-500/30 hover:bg-[#121c24] hover:translate-y-[-1px]';
    }
    return isActive
      ? 'bg-white shadow-[0_12px_30px_rgba(19,120,130,0.14)] ring-2 ring-[#137882]/20 translate-y-[-2px]'
      : 'bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] hover:shadow-md hover:translate-y-[-1px]';
  };

  const iconColorClass = isDark
    ? 'text-[#2dd4bf] drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]'
    : 'text-[#137882]';

  const labelColorClass = isDark ? 'text-slate-200' : 'text-[#137882]';
  const badgeClass = isDark
    ? 'border-teal-400/50 text-teal-300 bg-teal-950/40'
    : 'border-[#137882]/60 text-[#137882]';

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 mt-8 sm:mt-10">
      {/* 1. Upload Card */}
      <button
        type="button"
        id="step-card-upload"
        onClick={() => onStepClick?.('upload')}
        className={`w-[108px] h-[108px] sm:w-[124px] sm:h-[124px] rounded-2xl flex flex-col items-center justify-between p-3.5 sm:p-4 transition-all duration-300 select-none text-left cursor-pointer ${getCardClasses(
          'upload'
        )}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <svg
            className={`w-10 h-10 sm:w-11 sm:h-11 transition-colors ${iconColorClass}`}
            viewBox="0 0 44 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="8" width="32" height="28" rx="6" />
            <line x1="6" y1="16" x2="38" y2="16" strokeWidth="2" />
            <circle cx="11" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" />
            <path d="M22 28V20" strokeWidth="2.5" />
            <path d="M17 24L22 19L27 24" strokeWidth="2.5" />
          </svg>
        </div>

        <div className={`flex items-center gap-1 font-medium text-xs sm:text-[13px] tracking-tight ${labelColorClass}`}>
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-semibold leading-none ${badgeClass}`}>
            1
          </span>
          <span>Upload</span>
        </div>
      </button>

      {/* 2. Analyze Card */}
      <button
        type="button"
        id="step-card-analyze"
        onClick={() => onStepClick?.('analyze')}
        className={`w-[108px] h-[108px] sm:w-[124px] sm:h-[124px] rounded-2xl flex flex-col items-center justify-between p-3.5 sm:p-4 transition-all duration-300 select-none text-left cursor-pointer ${getCardClasses(
          'analyze'
        )}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <svg
            className={`w-10 h-10 sm:w-11 sm:h-11 transition-colors ${iconColorClass}`}
            viewBox="0 0 44 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 24 C 14 10, 20 12, 22 22 C 24 32, 30 34, 34 20" strokeWidth="2.8" />
            <circle cx="10" cy="24" r="2.5" fill="currentColor" />
            <circle cx="34" cy="20" r="2.5" fill="currentColor" />
          </svg>
        </div>

        <div className={`flex items-center gap-1 font-medium text-xs sm:text-[13px] tracking-tight ${labelColorClass}`}>
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-semibold leading-none ${badgeClass}`}>
            2
          </span>
          <span>Analyze</span>
        </div>
      </button>

      {/* 3. Download Card */}
      <button
        type="button"
        id="step-card-download"
        onClick={() => onStepClick?.('complete')}
        className={`w-[108px] h-[108px] sm:w-[124px] sm:h-[124px] rounded-2xl flex flex-col items-center justify-between p-3.5 sm:p-4 transition-all duration-300 select-none text-left cursor-pointer ${getCardClasses(
          'complete'
        )}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <svg
            className={`w-10 h-10 sm:w-11 sm:h-11 transition-colors ${iconColorClass}`}
            viewBox="0 0 44 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 12H8C6.89543 12 6 12.8954 6 14V34C6 35.1046 6.89543 36 8 36H18" />
            <path d="M30 36H36C37.1046 36 38 35.1046 38 34V14C38 12.8954 37.1046 12 36 12H32" />
            <text
              x="13"
              y="22"
              fill="currentColor"
              stroke="none"
              fontSize="10"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.5"
            >
              PDF
            </text>
            <path d="M25 24V34" strokeWidth="2.5" />
            <path d="M20 29L25 34L30 29" strokeWidth="2.5" />
          </svg>
        </div>

        <div className={`flex items-center gap-1 font-medium text-xs sm:text-[13px] tracking-tight ${labelColorClass}`}>
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-semibold leading-none ${badgeClass}`}>
            3
          </span>
          <span>Download</span>
        </div>
      </button>
    </div>
  );
};
