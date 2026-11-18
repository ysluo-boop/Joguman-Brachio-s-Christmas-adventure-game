export type GameScreenState =
  | 'TITLE'
  | 'PLAYING'
  | 'STAGE_COMPLETE'
  | 'GAME_OVER'
  | 'ADVENTURE_COMPLETE';

export type TtsEnginePreference = 'gemini' | 'browser';

export interface AudioSettings {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  ttsEnabled: boolean;
  ttsEngine: TtsEnginePreference;
}

export type BlessingKind = 'heal' | 'boots' | 'shield';

export interface ActiveBlessings {
  snowstepBoots: boolean;
  auroraShield: boolean;
}

export interface StageClearSummary {
  starsEarned: number;
  allGifts: boolean;
  allStars: boolean;
  unscathed: boolean;
}

export interface PlayerProgress {
  currentChapterIndex: number;
  highestUnlockedChapter: number;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  totalStars: number;
  totalGifts: number;
  totalSnowflakes: number;
  chapterRatings: Record<string, number>;
  settings: AudioSettings;
}

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isGround?: boolean;
}

export interface CollectibleDef {
  id: string;
  type: 'star' | 'gift' | 'snowflake';
  x: number;
  y: number;
}

export interface EnemyDef {
  id: string;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  speed: number;
}

export interface SignpostDef {
  id: string;
  x: number;
  y: number;
  kind: 'direction' | 'delivery';
}

export interface ChapterDef {
  id: string;
  chapterNumber: number;
  title: string;
  questTitle: string;
  worldWidth: number;
  spawnX: number;
  spawnY: number;
  platforms: PlatformDef[];
  collectibles: CollectibleDef[];
  enemies: EnemyDef[];
  signposts: SignpostDef[];
  storySpeaker: string;
  storyDialogue: string;
}

export interface HudSnapshot {
  chapterIndex: number;
  chapterTitle: string;
  questTitle: string;
  giftsCollected: number;
  giftsTarget: number;
  starsCount: number;
  totalGifts: number;
  snowflakesCount: number;
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  toastMessage: string | null;
  activeBlessings: ActiveBlessings;
}
