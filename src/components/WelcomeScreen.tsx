import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Play,
  Settings,
} from 'lucide-react';
import { WELCOME_BG_URL, type UiAssets } from '../game/uiAssets';

interface WelcomeScreenProps {
  uiAssets: UiAssets;
  hasSavedProgress: boolean;
  currentChapterNumber: number;
  onStartAdventure: (startFromBeginning: boolean) => void;
  onOpenSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  uiAssets,
  hasSavedProgress,
  currentChapterNumber,
  onStartAdventure,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden select-none">
      {/* 1. Background & Character Illustration */}
      <img
        src={WELCOME_BG_URL}
        alt="Joguman Brachio and winter friends in Evergreen Village"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Subtle top & bottom contrast gradients leaving center characters clear */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/45"
      />

      {/* Top-Right Quick Settings Button */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open Adventure Settings"
        title="Adventure Settings"
        className="absolute right-[1.8%] top-[2.6%] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-slate-900/55 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* 2. Top-Center Wooden Title Logo */}
      <div className="pointer-events-none absolute inset-x-0 top-[2.5%] z-20 flex justify-center px-4">
        <img
          src={uiAssets.welcomeTitleLogo}
          alt="Brachio's Christmas Adventure"
          draggable={false}
          className="h-auto max-h-[28vh] w-[min(62vw,600px)] object-contain drop-shadow-[0_10px_22px_rgba(15,23,42,0.5)]"
        />
      </div>

      {/* Bottom-Center Start Button(s) & Compact Controls Legend */}
      <div className="absolute inset-x-0 bottom-[2.6%] z-20 flex flex-col items-center gap-2.5 px-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hasSavedProgress && (
            <button
              type="button"
              onClick={() => onStartAdventure(false)}
              className="inline-flex h-[min(9.5vh,64px)] items-center gap-2 rounded-full border-2 border-[#FEF08A] bg-gradient-to-b from-[#22C55E] to-[#15803D] px-6 font-display text-base font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,0.42)] transition-transform hover:scale-105 active:scale-95 cursor-pointer sm:text-lg"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Continue Chapter {currentChapterNumber}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartAdventure(true)}
            aria-label={hasSavedProgress ? 'Start New Adventure' : 'Start Game'}
            title={hasSavedProgress ? 'Start New Adventure' : 'Start Game'}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          >
            <img
              src={uiAssets.welcomeStartButton}
              alt="Start Game"
              draggable={false}
              className="h-[min(10.5vh,72px)] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
            />
          </button>
        </div>

        {/* Compact Controls Legend Pill */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full border border-white/25 bg-slate-900/60 px-4 py-1.5 text-[11px] font-semibold text-white/95 shadow-md backdrop-blur-md sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5">
              <ArrowLeft className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
            </span>
            <span>Move</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center rounded bg-white/20 px-1.5 py-0.5">
              <ArrowUp className="h-3 w-3" />
            </span>
            <span>Jump</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center rounded bg-white/20 px-1.5 py-0.5">
              <ArrowDown className="h-3 w-3" />
            </span>
            <span>Frost Action</span>
          </span>
        </div>
      </div>
    </div>
  );
};
