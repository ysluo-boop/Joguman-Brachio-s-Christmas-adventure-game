import type { AudioSettings, PlayerProgress } from './types';

const STORAGE_KEY = 'joguman_brachio_christmas_v1';

export const DEFAULT_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  bgmEnabled: true,
  ttsEnabled: true,
  ttsEngine: 'gemini',
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  currentChapterIndex: 0,
  highestUnlockedChapter: 0,
  level: 1,
  exp: 0,
  hp: 3,
  maxHp: 3,
  totalStars: 0,
  totalGifts: 0,
  totalSnowflakes: 2,
  chapterRatings: {},
  settings: { ...DEFAULT_SETTINGS },
};

export function expRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

function sanitizeChapterRatings(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = Math.max(0, Math.min(3, Math.round(value)));
    }
  }
  return result;
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PROGRESS,
        chapterRatings: {},
        settings: { ...DEFAULT_SETTINGS },
      };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      currentChapterIndex:
        typeof parsed.currentChapterIndex === 'number'
          ? Math.max(0, parsed.currentChapterIndex)
          : 0,
      highestUnlockedChapter:
        typeof parsed.highestUnlockedChapter === 'number'
          ? Math.max(0, parsed.highestUnlockedChapter)
          : 0,
      level: typeof parsed.level === 'number' ? Math.max(1, parsed.level) : 1,
      exp: typeof parsed.exp === 'number' ? Math.max(0, parsed.exp) : 0,
      hp: typeof parsed.hp === 'number' ? Math.max(1, Math.min(3, parsed.hp)) : 3,
      maxHp: 3,
      totalStars: typeof parsed.totalStars === 'number' ? Math.max(0, parsed.totalStars) : 0,
      totalGifts: typeof parsed.totalGifts === 'number' ? Math.max(0, parsed.totalGifts) : 0,
      totalSnowflakes:
        typeof parsed.totalSnowflakes === 'number' ? Math.max(0, parsed.totalSnowflakes) : 2,
      chapterRatings: sanitizeChapterRatings(parsed.chapterRatings),
      settings: {
        sfxEnabled: parsed.settings?.sfxEnabled ?? true,
        bgmEnabled: parsed.settings?.bgmEnabled ?? true,
        ttsEnabled: parsed.settings?.ttsEnabled ?? true,
        ttsEngine:
          parsed.settings?.ttsEngine === 'browser' || parsed.settings?.ttsEngine === 'gemini'
            ? parsed.settings.ttsEngine
            : 'gemini',
      },
    };
  } catch {
    return {
      ...DEFAULT_PROGRESS,
      chapterRatings: {},
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function resetProgressStorage(): PlayerProgress {
  const fresh: PlayerProgress = {
    ...DEFAULT_PROGRESS,
    chapterRatings: {},
    settings: { ...DEFAULT_SETTINGS },
  };
  saveProgress(fresh);
  return fresh;
}
