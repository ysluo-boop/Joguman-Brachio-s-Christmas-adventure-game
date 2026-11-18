import React from 'react';
import { Check, Heart, Shield, Sparkles, Star, Wind, X } from 'lucide-react';
import type { ActiveBlessings, BlessingKind } from '../game/types';

interface BlessingModalProps {
  starsCount: number;
  hp: number;
  maxHp: number;
  activeBlessings: ActiveBlessings;
  onPurchase: (kind: BlessingKind) => void;
  onClose: () => void;
}

interface BlessingOption {
  kind: BlessingKind;
  name: string;
  cost: number;
  description: string;
  icon: React.ReactNode;
}

const BLESSING_OPTIONS: BlessingOption[] = [
  {
    kind: 'heal',
    name: 'Warm Cocoa Heal',
    cost: 3,
    description: 'Restore +1 Heart immediately so Brachio stays cozy on the snowy trail.',
    icon: <Heart className="h-5 w-5 fill-[#F2545B] text-[#4A151B]" />,
  },
  {
    kind: 'boots',
    name: 'Snowstep Boots',
    cost: 5,
    description: 'Gain +15% movement speed and +12% jump power for the current chapter.',
    icon: <Wind className="h-5 w-5 text-emerald-700" />,
  },
  {
    kind: 'shield',
    name: 'Aurora Shield',
    cost: 6,
    description: 'Absorb the next snowman bump or pit-fall hit without losing any Hearts.',
    icon: <Shield className="h-5 w-5 text-sky-600" />,
  },
];

export const BlessingModal: React.FC<BlessingModalProps> = ({
  starsCount,
  hp,
  maxHp,
  activeBlessings,
  onPurchase,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border-2 border-[#D7B377] bg-[#FFF9ED] p-6 text-[#3E2A1E] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E7D3B0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 border border-[#D7B377]">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold leading-tight">
                Starlight Blessings
              </h2>
              <p className="text-xs text-[#7A5B43]">
                Spend collected Stars on holiday charms
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Starlight Blessings"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E2C4] text-[#4E3524] hover:bg-[#E7CE9F] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Available Stars & HP Status */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#E7D3B0] bg-[#F8ECD3] px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4E3524]">
            <Star className="h-5 w-5 fill-[#FACC15] text-[#B45309]" />
            <span>Available Stars: {starsCount}</span>
          </div>
          <div className="flex items-center gap-1" aria-label={`HP ${hp} of ${maxHp}`}>
            {Array.from({ length: maxHp }).map((_, idx) => (
              <Heart
                key={idx}
                className="h-4 w-4"
                style={{
                  fill: idx < hp ? '#F2545B' : 'rgba(120, 90, 65, 0.2)',
                  color: '#4A151B',
                }}
              />
            ))}
          </div>
        </div>

        {/* Blessing Cards */}
        <div className="mt-4 space-y-2.5">
          {BLESSING_OPTIONS.map((option) => {
            const alreadyActive =
              (option.kind === 'boots' && activeBlessings.snowstepBoots) ||
              (option.kind === 'shield' && activeBlessings.auroraShield);
            const fullHealth = option.kind === 'heal' && hp >= maxHp;
            const canAfford = starsCount >= option.cost;
            const disabled = alreadyActive || fullHealth || !canAfford;

            let actionLabel = `${option.cost} Stars`;
            if (alreadyActive) actionLabel = 'Active';
            else if (fullHealth) actionLabel = 'Full HP';

            return (
              <div
                key={option.kind}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7D3B0] bg-white/80 p-3.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF2D6] border border-[#E7D3B0]">
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#3E2A1E]">
                      {option.name}
                    </h3>
                    <p className="mt-0.5 text-xs leading-snug text-[#6E4E37]">
                      {option.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPurchase(option.kind)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-transform ${
                    alreadyActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                      : disabled
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 active:scale-95 cursor-pointer'
                  }`}
                >
                  {alreadyActive ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    !fullHealth && (
                      <Star className="h-3.5 w-3.5 fill-[#FACC15] text-[#B45309]" />
                    )
                  )}
                  <span>{actionLabel}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#E7D3B0] pt-4">
          <p className="text-[11px] font-medium text-[#7A5B43]">
            Stage rewards are saved when you clear the chapter.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#3E2A1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#543929] cursor-pointer"
          >
            Back to Trail
          </button>
        </div>
      </div>
    </div>
  );
};
