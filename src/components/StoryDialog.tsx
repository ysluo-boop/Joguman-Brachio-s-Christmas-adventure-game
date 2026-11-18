import React from 'react';
import { Check, Play, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import type { ChapterDef, StageClearSummary } from '../game/types';
import type { UiAssets } from '../game/uiAssets';

interface StoryDialogProps {
  chapter: ChapterDef;
  summary: StageClearSummary | null;
  uiAssets: UiAssets;
  isFinalChapter: boolean;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  onReplaySpeech: () => void;
  onToggleTtsMute: () => void;
  onNextChapter: () => void;
}

export const StoryDialog: React.FC<StoryDialogProps> = ({
  chapter,
  summary,
  uiAssets,
  isFinalChapter,
  isSpeaking,
  ttsEnabled,
  onReplaySpeech,
  onToggleTtsMute,
  onNextChapter,
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{
        containerType: 'size',
        ['--u' as string]: 'min(1cqh, 0.5625cqw)',
      }}
    >
      {/* 6. Bottom-Center Stage Complete Dialog Modal (bottom: 4.5%, left: 50%, -translate-x-1/2) */}
      <div
        className="pointer-events-auto absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: '4.5%',
          width: 'calc(80.89 * var(--u))',
          height: 'calc(21.0 * var(--u))',
        }}
      >
        {/* Top Crimson Ribbon Banner (#E63946, ~27% vw, ~5.4% vh) with notched fishtail ends */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 flex items-center justify-center"
          style={{
            top: 'calc(-2.9 * var(--u))',
            width: 'calc(48.0 * var(--u))',
            height: 'calc(5.4 * var(--u))',
            filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))',
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundColor: '#E63946',
              clipPath:
                'polygon(0 0, 100% 0, 95.5% 50%, 100% 100%, 0 100%, 4.5% 50%)',
              gap: 'calc(1.4 * var(--u))',
              paddingLeft: 'calc(2.5 * var(--u))',
              paddingRight: 'calc(2.5 * var(--u))',
            }}
          >
            <Star
              style={{
                width: 'calc(2.3 * var(--u))',
                height: 'calc(2.3 * var(--u))',
                fill: '#FACC15',
                color: '#B45309',
                strokeWidth: 1.8,
                flexShrink: 0,
              }}
            />
            <span
              className="font-display font-bold uppercase tracking-wide text-white whitespace-nowrap"
              style={{
                fontSize: 'calc(2.65 * var(--u))',
                textShadow: '0 1px 2px rgba(92, 16, 22, 0.45)',
              }}
            >
              {isFinalChapter ? 'ADVENTURE COMPLETE!' : 'STAGE COMPLETE!'}
            </span>
            <Star
              style={{
                width: 'calc(2.3 * var(--u))',
                height: 'calc(2.3 * var(--u))',
                fill: '#FACC15',
                color: '#B45309',
                strokeWidth: 1.8,
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* Capsule-Rounded Cream Panel */}
        <div
          className="relative flex h-full w-full items-center"
          style={{
            borderRadius: '9999px',
            background: 'linear-gradient(180deg, #FFF5DE 0%, #FFF5DE 72%, #F3DFB8 100%)',
            border: '2px solid #5C3A21',
            boxShadow:
              'inset 0 -5px 12px rgba(243, 223, 184, 0.85), 0 8px 20px rgba(0,0,0,0.35)',
            paddingLeft: 'calc(2.2 * var(--u))',
            paddingRight: 'calc(4.4 * var(--u))',
            gap: 'calc(2.2 * var(--u))',
          }}
        >
          {/* Left Circular Warm-Yellow Glow (#FDE68A) + Brachio Santa Hat extending above curve */}
          <div
            className="relative shrink-0"
            style={{
              width: 'calc(17.2 * var(--u))',
              height: 'calc(17.2 * var(--u))',
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 50% 45%, #FEF3C7 0%, #FDE68A 100%)',
                boxShadow: 'inset 0 2px 6px rgba(180, 130, 40, 0.2)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-full flex items-end justify-center"
              style={{
                height: 'calc(22.4 * var(--u))',
              }}
            >
              <img
                src={uiAssets.brachioSantaBust}
                alt="Brachio wearing Santa hat"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-bottom"
              />
            </div>
          </div>

          {/* Middle Story Content */}
          <div
            className="flex min-w-0 flex-1 flex-col justify-center"
            style={{ paddingTop: 'calc(1.0 * var(--u))' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center" style={{ gap: 'calc(1.1 * var(--u))' }}>
                <span
                  className="font-display font-bold leading-tight"
                  style={{
                    color: '#1E6B3A',
                    fontSize: 'calc(2.35 * var(--u))',
                  }}
                >
                  {chapter.storySpeaker}
                </span>

                {summary && (
                  <div
                    className="flex items-center"
                    style={{ gap: 'calc(0.35 * var(--u))' }}
                    aria-label={`Stage rating: ${summary.starsEarned} of 3 stars`}
                  >
                    {[1, 2, 3].map((idx) => {
                      const earned = idx <= summary.starsEarned;
                      return (
                        <Star
                          key={idx}
                          style={{
                            width: 'calc(2.35 * var(--u))',
                            height: 'calc(2.35 * var(--u))',
                            fill: earned ? '#FACC15' : 'rgba(92, 58, 33, 0.16)',
                            color: earned ? '#B45309' : '#9C7A54',
                            strokeWidth: 2,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center" style={{ gap: 'calc(0.55 * var(--u))' }}>
                <button
                  type="button"
                  onClick={onReplaySpeech}
                  title={isSpeaking ? 'Speaking story...' : 'Replay voice narration'}
                  aria-label="Replay voice narration"
                  className="inline-flex items-center justify-center rounded-full border border-[#D7B377] bg-[#F8E7C4] text-[#5C3A21] transition-colors hover:bg-[#EED5A4] cursor-pointer"
                  style={{
                    height: 'calc(2.85 * var(--u))',
                    paddingLeft: 'calc(0.85 * var(--u))',
                    paddingRight: 'calc(0.85 * var(--u))',
                    gap: 'calc(0.4 * var(--u))',
                    fontSize: 'calc(1.25 * var(--u))',
                  }}
                >
                  <RotateCcw
                    style={{
                      width: 'calc(1.35 * var(--u))',
                      height: 'calc(1.35 * var(--u))',
                    }}
                  />
                  <span className="font-semibold">
                    {isSpeaking ? 'Speaking' : 'Replay'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onToggleTtsMute}
                  aria-label={ttsEnabled ? 'Mute voice narration' : 'Unmute voice narration'}
                  title={ttsEnabled ? 'Mute voice narration' : 'Unmute voice narration'}
                  className="inline-flex items-center justify-center rounded-full border border-[#D7B377] bg-[#F8E7C4] transition-colors hover:bg-[#EED5A4] cursor-pointer"
                  style={{
                    width: 'calc(2.85 * var(--u))',
                    height: 'calc(2.85 * var(--u))',
                  }}
                >
                  {ttsEnabled ? (
                    <Volume2
                      style={{
                        width: 'calc(1.45 * var(--u))',
                        height: 'calc(1.45 * var(--u))',
                        color: '#1E6B3A',
                      }}
                    />
                  ) : (
                    <VolumeX
                      style={{
                        width: 'calc(1.45 * var(--u))',
                        height: 'calc(1.45 * var(--u))',
                        color: '#E63946',
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            <p
              className="font-semibold leading-snug"
              style={{
                color: '#2B2118',
                fontSize: 'calc(1.78 * var(--u))',
                marginTop: 'calc(0.3 * var(--u))',
              }}
            >
              {chapter.storyDialogue}
            </p>

            {summary && (
              <div
                className="flex flex-wrap items-center"
                style={{
                  gap: 'calc(0.6 * var(--u))',
                  marginTop: 'calc(0.45 * var(--u))',
                }}
              >
                {[
                  { label: 'Gifts Delivered', ok: summary.allGifts },
                  { label: 'All Stars', ok: summary.allStars },
                  { label: 'No Damage', ok: summary.unscathed },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center rounded-full font-bold"
                    style={{
                      gap: 'calc(0.35 * var(--u))',
                      padding: 'calc(0.18 * var(--u)) calc(0.85 * var(--u))',
                      fontSize: 'calc(1.2 * var(--u))',
                      backgroundColor: item.ok
                        ? 'rgba(22, 163, 74, 0.14)'
                        : 'rgba(92, 58, 33, 0.08)',
                      color: item.ok ? '#166534' : '#8A7158',
                      border: item.ok
                        ? '1px solid rgba(22, 163, 74, 0.45)'
                        : '1px solid rgba(92, 58, 33, 0.2)',
                    }}
                  >
                    <Check
                      style={{
                        width: 'calc(1.2 * var(--u))',
                        height: 'calc(1.2 * var(--u))',
                        opacity: item.ok ? 1 : 0.35,
                        strokeWidth: 3,
                      }}
                    />
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom-Right Emerald-Green (#16A34A) Lucide Play Triangle Button */}
          <button
            type="button"
            onClick={onNextChapter}
            aria-label={isFinalChapter ? 'Play again from Chapter 1' : 'Next Chapter'}
            title={isFinalChapter ? 'Play Again from Chapter 1' : 'Next Chapter'}
            className="self-end transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              marginBottom: 'calc(2.1 * var(--u))',
              flexShrink: 0,
            }}
          >
            <Play
              style={{
                width: 'calc(3.6 * var(--u))',
                height: 'calc(3.6 * var(--u))',
                fill: '#16A34A',
                color: '#14532D',
                strokeWidth: 2.2,
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
