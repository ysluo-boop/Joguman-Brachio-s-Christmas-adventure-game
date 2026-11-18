import type { ChapterDef, PlatformDef } from './types';

export const WORLD_LOGICAL_HEIGHT = 540;
export const SCENE_WORLD_WIDTH = 968;
export const GROUND_TOP_Y = 320;

const SCENE_PLATFORMS: PlatformDef[] = [
  { id: 'scene-ground', x: 0, y: 320, width: 474, height: 220, isGround: true },
  { id: 'scene-plat-1', x: 522, y: 300, width: 142, height: 48 },
  { id: 'scene-plat-2', x: 692, y: 273, width: 172, height: 48 },
  { id: 'scene-plat-3', x: 886, y: 232, width: 82, height: 120 },
];

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'chapter-1',
    chapterNumber: 1,
    title: 'Snowy Viaduct Trail',
    questTitle: 'Main Quest: Deliver the Christmas Gifts!',
    worldWidth: SCENE_WORLD_WIDTH,
    spawnX: 96,
    spawnY: GROUND_TOP_Y,
    platforms: SCENE_PLATFORMS,
    collectibles: [
      { id: 'c1-s1', type: 'star', x: 185, y: 280 },
      { id: 'c1-g1', type: 'gift', x: 350, y: 278 },
      { id: 'c1-f1', type: 'snowflake', x: 440, y: 265 },
      { id: 'c1-g2', type: 'gift', x: 593, y: 258 },
      { id: 'c1-s2', type: 'star', x: 745, y: 230 },
      { id: 'c1-g3', type: 'gift', x: 815, y: 230 },
      { id: 'c1-s3', type: 'star', x: 920, y: 190 },
    ],
    enemies: [
      { id: 'c1-e1', x: 310, y: GROUND_TOP_Y, patrolMinX: 215, patrolMaxX: 435, speed: 62 },
      { id: 'c1-e2', x: 770, y: 273, patrolMinX: 706, patrolMaxX: 846, speed: 52 },
    ],
    signposts: [{ id: 'c1-goal', x: 928, y: 232, kind: 'delivery' }],
    storySpeaker: 'Brachio',
    storyDialogue:
      'We delivered all the gifts! The world feels a little warmer today!',
  },
  {
    id: 'chapter-2',
    chapterNumber: 2,
    title: 'Pinewood Castle Courtyard',
    questTitle: 'Main Quest: Rescue the Courtyard Presents!',
    worldWidth: SCENE_WORLD_WIDTH,
    spawnX: 90,
    spawnY: GROUND_TOP_Y,
    platforms: SCENE_PLATFORMS,
    collectibles: [
      { id: 'c2-s1', type: 'star', x: 165, y: 280 },
      { id: 'c2-g1', type: 'gift', x: 265, y: 278 },
      { id: 'c2-g2', type: 'gift', x: 420, y: 278 },
      { id: 'c2-f1', type: 'snowflake', x: 545, y: 256 },
      { id: 'c2-g3', type: 'gift', x: 615, y: 256 },
      { id: 'c2-s2', type: 'star', x: 730, y: 230 },
      { id: 'c2-g4', type: 'gift', x: 825, y: 230 },
      { id: 'c2-f2', type: 'snowflake', x: 912, y: 190 },
    ],
    enemies: [
      { id: 'c2-e1', x: 280, y: GROUND_TOP_Y, patrolMinX: 185, patrolMaxX: 445, speed: 78 },
      { id: 'c2-e2', x: 585, y: 300, patrolMinX: 536, patrolMaxX: 648, speed: 56 },
      { id: 'c2-e3', x: 780, y: 273, patrolMinX: 706, patrolMaxX: 848, speed: 68 },
    ],
    signposts: [{ id: 'c2-goal', x: 928, y: 232, kind: 'delivery' }],
    storySpeaker: 'Brachio',
    storyDialogue:
      'What a snowy leap across Pinewood Castle Courtyard! Every cozy cottage now has its holiday parcel!',
  },
  {
    id: 'chapter-3',
    chapterNumber: 3,
    title: 'Starlight Tree Summit',
    questTitle: 'Main Quest: Light Up the Grand Christmas Tree!',
    worldWidth: SCENE_WORLD_WIDTH,
    spawnX: 85,
    spawnY: GROUND_TOP_Y,
    platforms: SCENE_PLATFORMS,
    collectibles: [
      { id: 'c3-g1', type: 'gift', x: 175, y: 278 },
      { id: 'c3-s1', type: 'star', x: 275, y: 278 },
      { id: 'c3-g2', type: 'gift', x: 385, y: 278 },
      { id: 'c3-f1', type: 'snowflake', x: 452, y: 262 },
      { id: 'c3-g3', type: 'gift', x: 592, y: 256 },
      { id: 'c3-g4', type: 'gift', x: 735, y: 230 },
      { id: 'c3-s2', type: 'star', x: 790, y: 228 },
      { id: 'c3-g5', type: 'gift', x: 842, y: 230 },
      { id: 'c3-f2', type: 'snowflake', x: 912, y: 190 },
    ],
    enemies: [
      { id: 'c3-e1', x: 240, y: GROUND_TOP_Y, patrolMinX: 160, patrolMaxX: 330, speed: 84 },
      { id: 'c3-e2', x: 410, y: GROUND_TOP_Y, patrolMinX: 335, patrolMaxX: 455, speed: 88 },
      { id: 'c3-e3', x: 585, y: 300, patrolMinX: 536, patrolMaxX: 648, speed: 66 },
      { id: 'c3-e4', x: 780, y: 273, patrolMinX: 706, patrolMaxX: 848, speed: 78 },
    ],
    signposts: [{ id: 'c3-goal', x: 928, y: 232, kind: 'delivery' }],
    storySpeaker: 'Brachio',
    storyDialogue:
      'Merry Christmas! The Grand Starlight Tree is glowing brighter than ever, and every gift has been delivered!',
  },
];
