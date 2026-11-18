import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Gift,
  Heart,
  Settings,
  Shield,
  Snowflake,
  Star,
  Wind,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import type { UiAssets } from '../game/uiAssets';

interface GameHudProps {
  hud: HudSnapshot;
  uiAssets: UiAssets;
  onOpenSettings: () => void;
  onOpenBlessingShop: () => void;
  onControlChange: (control: 'left' | 'right' | 'jump' | 'action', active: boolean) => void;
  showTouchControls: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  uiAssets,
  onOpenSettings,
  onOpenBlessingShop,
  onControlChange,
  showTouchControls,
}) => {
  const expPercent = Math.max(
    8,
    Math.min(100, Math.round((hud.exp / Math.max(1, hud.expToNextLevel)) * 100))
  );
  const questComplete = hud.giftsCollected >= hud.giftsTarget;
  const cleanQuestSubtitle = hud.questTitle.replace(/^Main Quest:\s*/i, '');

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{
        containerType: 'size',
        ['--u' as string]: 'min(1cqh, 0.5625cqw)',
      }}
    >
      {/* 1. Top-Left Player Status Cluster (top: 1.8%, left: 1.4%) */}
      <div
        className="pointer-events-auto absolute flex items-center"
        style={{
          top: '1.8%',
          left: '1.4%',
          minHeight: 'calc(11.5 * var(--u))',
        }}
      >
        {/* Hearts Row + EXP Bar anchored beside/overlapping Avatar rim */}
        <div
          className="relative z-10 flex flex-col"
          style={{
            marginLeft: 'calc(9.5 * var(--u))',
            paddingTop: 'calc(0.45 * var(--u))',
            gap: 'calc(0.75 * var(--u))',
          }}
        >
          {/* Hearts Row: 3 plump red Lucide heart icons (#F2545B fill, #4A151B outline, 0.4% gap) */}
          <div
            className="flex items-center"
            style={{
              gap: '0.4cqw',
              paddingLeft: 'calc(2.2 * var(--u))',
            }}
            aria-label={`Health: ${hud.hp} of ${hud.maxHp}`}
          >
            {Array.from({ length: hud.maxHp }).map((_, idx) => {
              const filled = idx < hud.hp;
              return (
                <Heart
                  key={idx}
                  className="transition-transform duration-150"
                  style={{
                    width: 'calc(4.0 * var(--u))',
                    height: 'calc(4.0 * var(--u))',
                    fill: filled ? '#F2545B' : 'rgba(30, 37, 48, 0.55)',
                    color: '#4A151B',
                    strokeWidth: 2.2,
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
                    transform: filled ? 'scale(1)' : 'scale(0.9)',
                  }}
                />
              );
            })}
          </div>

          {/* EXP Bar & Lv. Badge */}
          <div className="relative flex items-center">
            <div
              className="relative z-20 flex items-center justify-center rounded-full font-display font-bold text-white tabular-nums whitespace-nowrap"
              style={{
                backgroundColor: '#2EA44F',
                border: '1.5px solid #1B3B24',
                padding: 'calc(0.28 * var(--u)) calc(1.35 * var(--u))',
                fontSize: 'calc(1.95 * var(--u))',
                lineHeight: 1.1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
              }}
            >
              Lv. {hud.level}
            </div>

            {/* Dark translucent pill track (~14.5% vw, ~2.6% vh) */}
            <div
              className="relative z-10 overflow-hidden rounded-full"
              style={{
                marginLeft: 'calc(-1.8 * var(--u))',
                width: 'calc(25.78 * var(--u))',
                height: 'calc(2.6 * var(--u))',
                backgroundColor: 'rgba(35, 42, 54, 0.72)',
                border: '1.5px solid #1E2530',
                padding: 'calc(0.25 * var(--u))',
                paddingLeft: 'calc(1.9 * var(--u))',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
              title={`EXP: ${hud.exp}/${hud.expToNextLevel}`}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${expPercent}%`,
                  background: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 45%, #16A34A 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Circular Avatar Frame (~11.5% vh diameter) */}
        <div
          className="absolute left-0 top-0 z-20 overflow-hidden rounded-full"
          style={{
            width: 'calc(11.5 * var(--u))',
            height: 'calc(11.5 * var(--u))',
            background: 'radial-gradient(circle at 40% 35%, #E2EFF6 0%, #C8DFEC 100%)',
            border: '2.5px solid #2D3748',
            boxShadow:
              'inset 0 0 0 2px rgba(255,255,255,0.75), 0 4px 10px rgba(0,0,0,0.35)',
          }}
        >
          <img
            src={uiAssets.avatar}
            alt="Brachio portrait"
            referrerPolicy="no-referrer"
            className="h-full w-full scale-[1.15] object-cover object-center"
          />
        </div>
      </div>

      {/* Active Chapter Blessings Indicator (shown only when purchased) */}
      {(hud.activeBlessings.snowstepBoots || hud.activeBlessings.auroraShield) && (
        <div
          className="pointer-events-none absolute flex items-center"
          style={{
            top: 'calc(1.8% + 12.2 * var(--u))',
            left: '1.4%',
            gap: 'calc(0.8 * var(--u))',
          }}
        >
          {hud.activeBlessings.snowstepBoots && (
            <div
              className="flex items-center rounded-full text-white"
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.85)',
                border: '1.5px solid #14532D',
                padding: 'calc(0.35 * var(--u)) calc(1.1 * var(--u))',
                gap: 'calc(0.5 * var(--u))',
                fontSize: 'calc(1.45 * var(--u))',
                boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
              }}
            >
              <Wind style={{ width: 'calc(1.7 * var(--u))', height: 'calc(1.7 * var(--u))' }} />
              <span className="font-display font-bold whitespace-nowrap">Snowstep Boots</span>
            </div>
          )}
          {hud.activeBlessings.auroraShield && (
            <div
              className="flex items-center rounded-full text-white"
              style={{
                backgroundColor: 'rgba(14, 165, 233, 0.85)',
                border: '1.5px solid #0C4A6E',
                padding: 'calc(0.35 * var(--u)) calc(1.1 * var(--u))',
                gap: 'calc(0.5 * var(--u))',
                fontSize: 'calc(1.45 * var(--u))',
                boxShadow: '0 2px 6px rgba(0,0,0,0.28)',
              }}
            >
              <Shield style={{ width: 'calc(1.7 * var(--u))', height: 'calc(1.7 * var(--u))' }} />
              <span className="font-display font-bold whitespace-nowrap">Aurora Shield</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Top-Center Main Quest Parchment Banner (top: 1.8%, left: 50%, -translate-x-1/2) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{
          top: '1.8%',
          gap: 'calc(0.8 * var(--u))',
        }}
      >
        <div
          className="pointer-events-auto relative flex items-center justify-between"
          style={{
            width: 'calc(59.56 * var(--u))',
            height: 'calc(8.4 * var(--u))',
            backgroundColor: '#FFF2D6',
            border: '1.5px solid #5C3A21',
            borderRadius: 'calc(1.1 * var(--u))',
            paddingLeft: 'calc(2.1 * var(--u))',
            paddingRight: 'calc(1.8 * var(--u))',
            boxShadow:
              'inset 0 0 14px rgba(231, 200, 150, 0.9), inset 10px 0 8px -6px rgba(190, 145, 90, 0.48), 0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Subtle curled scroll left edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0"
            style={{
              width: 'calc(1.1 * var(--u))',
              borderRight: '1px solid rgba(92, 58, 33, 0.28)',
              background:
                'linear-gradient(90deg, rgba(220, 178, 120, 0.55) 0%, rgba(255, 242, 214, 0.2) 100%)',
              borderTopLeftRadius: 'calc(0.95 * var(--u))',
              borderBottomLeftRadius: 'calc(0.95 * var(--u))',
            }}
          />

          {/* Left-aligned circular quest emblem (Santa hat badge) + stacked text */}
          <div className="flex items-center" style={{ gap: 'calc(1.35 * var(--u))' }}>
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
              style={{
                width: 'calc(5.6 * var(--u))',
                height: 'calc(5.6 * var(--u))',
                backgroundColor: '#FFF9EC',
                border: '1.5px solid #C89B62',
                boxShadow: 'inset 0 1px 3px rgba(92,58,33,0.18)',
              }}
            >
              <img
                src={uiAssets.santaHat}
                alt="Santa Hat Quest Emblem"
                referrerPolicy="no-referrer"
                className="h-[82%] w-[82%] object-contain"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span
                className="font-display font-bold leading-tight"
                style={{
                  color: '#6D4023',
                  fontSize: 'calc(1.95 * var(--u))',
                }}
              >
                Main Quest
              </span>
              <span
                className="font-display font-bold leading-tight whitespace-nowrap"
                style={{
                  color: '#3B2214',
                  fontSize: 'calc(2.15 * var(--u))',
                }}
              >
                {cleanQuestSubtitle}
              </span>
            </div>
          </div>

          {/* Right-aligned progress cluster: unchecked rounded square (#7A5230), 3/3, green check (#16A34A) */}
          <div
            className="flex shrink-0 items-center"
            style={{ gap: 'calc(0.95 * var(--u))' }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 'calc(2.65 * var(--u))',
                height: 'calc(2.65 * var(--u))',
                borderRadius: 'calc(0.55 * var(--u))',
                border: '1.5px solid #7A5230',
                backgroundColor: '#FFF9EC',
              }}
            />
            <span
              className="font-display font-bold tabular-nums"
              style={{
                color: '#3B2214',
                fontSize: 'calc(2.1 * var(--u))',
              }}
            >
              {hud.giftsCollected}/{hud.giftsTarget}
            </span>
            <div
              className="flex items-center justify-center transition-opacity duration-200"
              style={{
                width: 'calc(2.85 * var(--u))',
                height: 'calc(2.85 * var(--u))',
                borderRadius: 'calc(0.6 * var(--u))',
                backgroundColor: '#16A34A',
                opacity: questComplete ? 1 : 0.48,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <Check
                style={{
                  width: 'calc(2.0 * var(--u))',
                  height: 'calc(2.0 * var(--u))',
                  color: '#FFFFFF',
                  strokeWidth: 3.2,
                }}
              />
            </div>
          </div>
        </div>

        {hud.toastMessage && (
          <div
            className="rounded-full bg-slate-900/80 font-semibold text-[#FFF8E7] shadow-md backdrop-blur-sm"
            style={{
              padding: 'calc(0.45 * var(--u)) calc(1.7 * var(--u))',
              fontSize: 'calc(1.65 * var(--u))',
            }}
          >
            {hud.toastMessage}
          </div>
        )}
      </div>

      {/* 3. Top-Right Resource Counters & Settings (top: 2.4%, right: 1.4%) */}
      <div
        className="pointer-events-auto absolute flex items-center"
        style={{
          top: '2.4%',
          right: '1.4%',
          gap: '1.0cqw',
        }}
      >
        {/* Stars Pill (Interactive button opening Starlight Blessing Shop) */}
        <button
          type="button"
          onClick={onOpenBlessingShop}
          aria-label="Open Starlight Blessing Shop"
          title="Open Starlight Blessing Shop (Spend Stars)"
          className="relative flex items-center rounded-full transition-transform hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
          style={{
            height: 'calc(4.5 * var(--u))',
            backgroundColor: 'rgba(42, 48, 60, 0.72)',
            paddingLeft: 'calc(4.5 * var(--u))',
            paddingRight: 'calc(1.6 * var(--u))',
            boxShadow: '0 3px 8px rgba(0,0,0,0.28)',
          }}
        >
          <Star
            className="absolute"
            style={{
              left: 'calc(-0.8 * var(--u))',
              width: 'calc(5.1 * var(--u))',
              height: 'calc(5.1 * var(--u))',
              fill: '#FACC15',
              color: '#B45309',
              strokeWidth: 1.8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.38))',
            }}
          />
          <span
            className="font-display font-bold text-white tabular-nums whitespace-nowrap"
            style={{ fontSize: 'calc(2.15 * var(--u))' }}
          >
            x {hud.starsCount}
          </span>
        </button>

        {/* Gifts Pill */}
        <div
          className="relative flex items-center rounded-full"
          style={{
            height: 'calc(4.5 * var(--u))',
            backgroundColor: 'rgba(42, 48, 60, 0.72)',
            paddingLeft: 'calc(4.5 * var(--u))',
            paddingRight: 'calc(1.6 * var(--u))',
            boxShadow: '0 3px 8px rgba(0,0,0,0.28)',
          }}
        >
          <Gift
            className="absolute"
            style={{
              left: 'calc(-0.7 * var(--u))',
              width: 'calc(4.9 * var(--u))',
              height: 'calc(4.9 * var(--u))',
              fill: '#EF4444',
              color: '#FACC15',
              strokeWidth: 2.1,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.38))',
            }}
          />
          <span
            className="font-display font-bold text-white tabular-nums whitespace-nowrap"
            style={{ fontSize: 'calc(2.15 * var(--u))' }}
          >
            x {hud.totalGifts}
          </span>
        </div>

        {/* Snowflakes Pill */}
        <div
          className="relative flex items-center rounded-full"
          style={{
            height: 'calc(4.5 * var(--u))',
            backgroundColor: 'rgba(42, 48, 60, 0.72)',
            paddingLeft: 'calc(4.5 * var(--u))',
            paddingRight: 'calc(1.6 * var(--u))',
            boxShadow: '0 3px 8px rgba(0,0,0,0.28)',
          }}
        >
          <Snowflake
            className="absolute"
            style={{
              left: 'calc(-0.7 * var(--u))',
              width: 'calc(4.9 * var(--u))',
              height: 'calc(4.9 * var(--u))',
              color: '#38BDF8',
              strokeWidth: 2.5,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.38))',
            }}
          />
          <span
            className="font-display font-bold text-white tabular-nums whitespace-nowrap"
            style={{ fontSize: 'calc(2.15 * var(--u))' }}
          >
            x {hud.snowflakesCount}
          </span>
        </div>

        {/* Circular Settings Gear Button (~5.8% vh diameter) */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open game settings"
          className="flex items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            width: 'calc(5.8 * var(--u))',
            height: 'calc(5.8 * var(--u))',
            backgroundColor: 'rgba(42, 48, 60, 0.72)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Settings
            style={{
              width: 'calc(3.4 * var(--u))',
              height: 'calc(3.4 * var(--u))',
              color: '#FFFFFF',
              strokeWidth: 2.2,
            }}
          />
        </button>
      </div>

      {/* 4. Bottom-Left Movement Buttons (bottom: 4.5%, left: 2.0%) */}
      {showTouchControls && (
        <div
          className="pointer-events-auto absolute flex items-center"
          style={{
            bottom: '4.5%',
            left: '2.0%',
            gap: '1.2cqw',
          }}
        >
          <button
            type="button"
            aria-label="Move Left"
            onPointerDown={() => onControlChange('left', true)}
            onPointerUp={() => onControlChange('left', false)}
            onPointerLeave={() => onControlChange('left', false)}
            onPointerCancel={() => onControlChange('left', false)}
            className="flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 hover:brightness-110 cursor-pointer touch-none"
            style={{
              width: 'calc(14.93 * var(--u))',
              height: 'calc(14.93 * var(--u))',
              borderRadius: '22%',
              backgroundColor: 'rgba(40, 44, 52, 0.62)',
              border: '2px solid rgba(255, 255, 255, 0.68)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <ArrowLeft
              style={{
                width: 'calc(6.4 * var(--u))',
                height: 'calc(6.4 * var(--u))',
                color: '#FFFFFF',
                strokeWidth: 3.2,
              }}
            />
          </button>

          <button
            type="button"
            aria-label="Move Right"
            onPointerDown={() => onControlChange('right', true)}
            onPointerUp={() => onControlChange('right', false)}
            onPointerLeave={() => onControlChange('right', false)}
            onPointerCancel={() => onControlChange('right', false)}
            className="flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 hover:brightness-110 cursor-pointer touch-none"
            style={{
              width: 'calc(14.93 * var(--u))',
              height: 'calc(14.93 * var(--u))',
              borderRadius: '22%',
              backgroundColor: 'rgba(40, 44, 52, 0.62)',
              border: '2px solid rgba(255, 255, 255, 0.68)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <ArrowRight
              style={{
                width: 'calc(6.4 * var(--u))',
                height: 'calc(6.4 * var(--u))',
                color: '#FFFFFF',
                strokeWidth: 3.2,
              }}
            />
          </button>
        </div>
      )}

      {/* 5. Bottom-Right Jump & Action Buttons (bottom: 4.2%, right: 2.0%) */}
      {showTouchControls && (
        <div
          className="pointer-events-auto absolute flex items-end"
          style={{
            bottom: '4.2%',
            right: '2.0%',
            gap: '1.0cqw',
          }}
        >
          {/* Jump Button (~16.2% vh diameter, bottom: 5.2%) */}
          <button
            type="button"
            aria-label="Jump"
            onPointerDown={() => onControlChange('jump', true)}
            onPointerUp={() => onControlChange('jump', false)}
            onPointerLeave={() => onControlChange('jump', false)}
            onPointerCancel={() => onControlChange('jump', false)}
            className="flex flex-col items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 hover:brightness-110 cursor-pointer touch-none"
            style={{
              marginBottom: 'calc(1.0 * var(--u))',
              width: 'calc(16.2 * var(--u))',
              height: 'calc(16.2 * var(--u))',
              backgroundColor: 'rgba(40, 44, 52, 0.62)',
              border: '2px solid rgba(255, 255, 255, 0.75)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.32)',
              gap: 'calc(0.45 * var(--u))',
            }}
            title="Jump (Up Arrow)"
          >
            <ArrowUp
              style={{
                width: 'calc(5.8 * var(--u))',
                height: 'calc(5.8 * var(--u))',
                color: '#FFFFFF',
                strokeWidth: 3.2,
              }}
            />
            <span
              className="font-display font-bold text-white leading-none"
              style={{ fontSize: 'calc(2.15 * var(--u))' }}
            >
              Jump
            </span>
          </button>

          {/* Action Button (~14.2% vh diameter) */}
          <button
            type="button"
            aria-label="Action / Frost Burst"
            onPointerDown={() => onControlChange('action', true)}
            onPointerUp={() => onControlChange('action', false)}
            onPointerLeave={() => onControlChange('action', false)}
            onPointerCancel={() => onControlChange('action', false)}
            className="flex flex-col items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 hover:brightness-110 cursor-pointer touch-none"
            style={{
              width: 'calc(14.2 * var(--u))',
              height: 'calc(14.2 * var(--u))',
              backgroundColor: 'rgba(40, 44, 52, 0.62)',
              border: '2px solid rgba(255, 255, 255, 0.75)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.32)',
              gap: 'calc(0.45 * var(--u))',
            }}
            title="Action / Frost Burst (Down Arrow)"
          >
            <Star
              style={{
                width: 'calc(5.2 * var(--u))',
                height: 'calc(5.2 * var(--u))',
                fill: '#FFFFFF',
                color: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
            <span
              className="font-display font-bold text-white leading-none"
              style={{ fontSize: 'calc(2.05 * var(--u))' }}
            >
              Action
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
