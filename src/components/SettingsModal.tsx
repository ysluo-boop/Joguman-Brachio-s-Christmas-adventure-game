import React, { useState } from 'react';
import {
  Check,
  MessageSquareText,
  Music,
  RotateCcw,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { CHAPTERS } from '../game/levels';
import type { AudioSettings, TtsEnginePreference } from '../game/types';

interface SettingsModalProps {
  settings: AudioSettings;
  currentChapterIndex: number;
  highestUnlockedChapter: number;
  chapterRatings: Record<string, number>;
  onUpdateSettings: (next: AudioSettings) => void;
  onSelectChapter: (index: number) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  currentChapterIndex,
  highestUnlockedChapter,
  chapterRatings,
  onUpdateSettings,
  onSelectChapter,
  onResetSave,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const toggle = (key: 'sfxEnabled' | 'bgmEnabled' | 'ttsEnabled') => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const setEngine = (ttsEngine: TtsEnginePreference) => {
    onUpdateSettings({
      ...settings,
      ttsEngine,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border-2 border-[#D7B377] bg-[#FFF9ED] p-6 text-[#3E2A1E] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7D3B0]">
          <h2 className="font-display text-xl font-bold">Adventure Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E2C4] text-[#4E3524] hover:bg-[#E7CE9F] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Audio Toggles */}
          <button
            type="button"
            onClick={() => toggle('sfxEnabled')}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7D3B0] bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <Volume2 className="h-4 w-4 text-[#B85D3B]" />
              Sound Effects
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                settings.sfxEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.sfxEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggle('bgmEnabled')}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7D3B0] bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <Music className="h-4 w-4 text-[#B85D3B]" />
              Festive Background Music
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                settings.bgmEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.bgmEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggle('ttsEnabled')}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7D3B0] bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <MessageSquareText className="h-4 w-4 text-[#B85D3B]" />
              Stage Complete Voice Narration
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                settings.ttsEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.ttsEnabled ? 'On' : 'Off'}
            </span>
          </button>

          {/* Voice Engine Selector */}
          <div className="rounded-2xl border border-[#E7D3B0] bg-white/70 p-3">
            <p className="text-xs font-semibold text-[#7A5B43]">Narration Voice Engine</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEngine('gemini')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  settings.ttsEngine === 'gemini'
                    ? 'bg-[#B85D3B] text-white'
                    : 'bg-[#F4E3C1] text-[#4E3524] hover:bg-[#EAD1A4]'
                }`}
              >
                Gemini 3.8 TTS
              </button>
              <button
                type="button"
                onClick={() => setEngine('browser')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  settings.ttsEngine === 'browser'
                    ? 'bg-[#B85D3B] text-white'
                    : 'bg-[#F4E3C1] text-[#4E3524] hover:bg-[#EAD1A4]'
                }`}
              >
                Browser Speech
              </button>
            </div>
          </div>

          {/* Chapter Select */}
          <div className="rounded-2xl border border-[#E7D3B0] bg-white/70 p-3">
            <p className="text-xs font-semibold text-[#7A5B43]">Chapters</p>
            <div className="mt-2 space-y-1.5">
              {CHAPTERS.map((chap, idx) => {
                const unlocked = idx <= highestUnlockedChapter;
                const active = idx === currentChapterIndex;
                const rating = chapterRatings[chap.id] ?? 0;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      onSelectChapter(idx);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white cursor-pointer'
                        : unlocked
                        ? 'bg-[#F4E3C1] text-[#4E3524] hover:bg-[#EAD1A4] cursor-pointer'
                        : 'bg-slate-200/60 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="truncate">
                      Chapter {chap.chapterNumber}: {chap.title}
                    </span>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      <div
                        className="flex items-center gap-0.5"
                        aria-label={`Best rating: ${rating} of 3 stars`}
                      >
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className="h-3.5 w-3.5"
                            style={{
                              fill:
                                s <= rating
                                  ? '#FACC15'
                                  : active
                                  ? 'rgba(255,255,255,0.22)'
                                  : 'rgba(120, 90, 65, 0.18)',
                              color:
                                s <= rating
                                  ? '#B45309'
                                  : active
                                  ? 'rgba(255,255,255,0.45)'
                                  : 'rgba(120, 90, 65, 0.45)',
                            }}
                          />
                        ))}
                      </div>
                      {active && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reset Progress */}
        <div className="mt-5 flex items-center justify-between border-t border-[#E7D3B0] pt-4">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Saved Progress
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetSave();
                  setConfirmReset(false);
                  onClose();
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg bg-[#F2E2C4] px-3 py-1.5 text-xs font-semibold text-[#4E3524] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#3E2A1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#543929] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
