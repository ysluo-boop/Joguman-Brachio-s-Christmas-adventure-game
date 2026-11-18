import { soundController } from './audio';
import { type GameAssets, type SpriteFrame } from './assets';
import { CHAPTERS, WORLD_LOGICAL_HEIGHT } from './levels';
import { expRequiredForLevel } from './storage';
import type {
  BlessingKind,
  ChapterDef,
  HudSnapshot,
  PlayerProgress,
  StageClearSummary,
} from './types';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  actionPressed: boolean;
}

interface RuntimeCollectible {
  id: string;
  type: 'star' | 'gift' | 'snowflake';
  x: number;
  y: number;
  collected: boolean;
  phase: number;
}

interface RuntimeEnemy {
  id: string;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  speed: number;
  dir: 1 | -1;
  stunTimer: number;
  animTimer: number;
}

interface RuntimeParticle {
  kind: 'dust' | 'snowflake' | 'star';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
}

interface SnowFlakeDrop {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  alpha: number;
  rot: number;
  vRot: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onProgressPersist: (progress: PlayerProgress) => void;
  onStageComplete: (chapter: ChapterDef, summary: StageClearSummary) => void;
  onGameOver: () => void;
}

const GRAVITY = 1480;
const JUMP_VELOCITY = -560;
const MOVE_SPEED = 220;
const PLAYER_HITBOX_W = 36;
const PLAYER_HITBOX_H = 68;

const BLESSING_COSTS: Record<BlessingKind, number> = {
  heal: 3,
  boots: 5,
  shield: 6,
};

export class ChristmasGameEngine {
  private assets: GameAssets;
  private callbacks: EngineCallbacks;
  private committedProgress: PlayerProgress;
  private chapter: ChapterDef;

  // Run-scoped staging state (committed only on stage completion)
  private runHp = 3;
  private runStars = 0;
  private runStarsCollectedInChapter = 0;
  private runStarsTotalInChapter = 0;
  private runGifts = 0;
  private runSnowflakesDelta = 0;
  private runExp = 0;
  private damageTakenInRun = 0;

  // Active chapter blessings
  private bootsActive = false;
  private shieldActive = false;

  // Delivery ceremony state
  private ceremonyActive = false;
  private ceremonyTimer = 0;
  private ceremonyFireworkTimer = 0;
  private goalSparkleTimer = 0;
  private missingGiftCooldown = 0;

  private playerX = 100;
  private playerY = 448;
  private playerVx = 0;
  private playerVy = 0;
  private facing: 1 | -1 = 1;
  private grounded = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private invulnTimer = 0;
  private actionTimer = 0;
  private walkAnimTimer = 0;
  private footstepTimer = 0;
  private globalTime = 0;
  private victoryMode = false;
  private paused = false;

  private cameraX = 0;
  private collectibles: RuntimeCollectible[] = [];
  private enemies: RuntimeEnemy[] = [];
  private particles: RuntimeParticle[] = [];
  private ambientSnow: SnowFlakeDrop[] = [];
  private giftsCollected = 0;
  private giftsTarget = 3;
  private toastMessage: string | null = null;
  private toastTimer = 0;
  private lastSafeX = 110;
  private lastSafeY = 448;

  private prevJumpInput = false;
  private prevActionInput = false;

  constructor(
    assets: GameAssets,
    initialProgress: PlayerProgress,
    callbacks: EngineCallbacks
  ) {
    this.assets = assets;
    this.committedProgress = structuredClone(initialProgress);
    this.callbacks = callbacks;
    this.chapter =
      CHAPTERS[Math.min(this.committedProgress.currentChapterIndex, CHAPTERS.length - 1)];
    this.initAmbientSnow();
    this.loadChapter(this.committedProgress.currentChapterIndex);
  }

  private initAmbientSnow(): void {
    this.ambientSnow = [];
    for (let i = 0; i < 42; i++) {
      this.ambientSnow.push({
        x: Math.random() * 1400,
        y: Math.random() * WORLD_LOGICAL_HEIGHT,
        vy: 28 + Math.random() * 44,
        vx: -14 + Math.random() * 28,
        size: 10 + Math.random() * 14,
        alpha: 0.35 + Math.random() * 0.45,
        rot: Math.random() * Math.PI * 2,
        vRot: -0.8 + Math.random() * 1.6,
      });
    }
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public syncProgress(next: PlayerProgress): void {
    this.committedProgress = structuredClone(next);
    this.emitHud();
  }

  public loadChapter(chapterIndex: number): void {
    const safeIndex = Math.max(0, Math.min(chapterIndex, CHAPTERS.length - 1));
    this.chapter = CHAPTERS[safeIndex];
    this.committedProgress.currentChapterIndex = safeIndex;

    // Reset run-scoped staging state so death/retry cannot farm rewards
    this.runHp = Math.max(1, Math.min(this.committedProgress.maxHp, this.committedProgress.hp));
    this.runStars = 0;
    this.runStarsCollectedInChapter = 0;
    this.runGifts = 0;
    this.runSnowflakesDelta = 0;
    this.runExp = 0;
    this.damageTakenInRun = 0;
    this.bootsActive = false;
    this.shieldActive = false;
    this.ceremonyActive = false;
    this.ceremonyTimer = 0;
    this.ceremonyFireworkTimer = 0;
    this.goalSparkleTimer = 0;
    this.missingGiftCooldown = 0;

    this.playerX = this.chapter.spawnX;
    this.playerY = this.chapter.spawnY;
    this.lastSafeX = this.chapter.spawnX;
    this.lastSafeY = this.chapter.spawnY;
    this.playerVx = 0;
    this.playerVy = 0;
    this.facing = 1;
    this.grounded = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invulnTimer = 0;
    this.actionTimer = 0;
    this.victoryMode = false;
    this.cameraX = 0;
    this.particles = [];

    this.collectibles = this.chapter.collectibles.map((c, idx) => ({
      ...c,
      collected: false,
      phase: idx * 0.8,
    }));
    this.giftsTarget = this.collectibles.filter((c) => c.type === 'gift').length;
    this.giftsCollected = 0;
    this.runStarsTotalInChapter = this.collectibles.filter((c) => c.type === 'star').length;

    this.enemies = this.chapter.enemies.map((e) => ({
      ...e,
      dir: 1,
      stunTimer: 0,
      animTimer: Math.random() * 2,
    }));

    this.showToast(`Chapter ${this.chapter.chapterNumber}: ${this.chapter.title}`, 3.0);
    this.emitHud();
    this.callbacks.onProgressPersist(structuredClone(this.committedProgress));
  }

  public purchaseBlessing(kind: BlessingKind): boolean {
    if (this.victoryMode || this.ceremonyActive) return false;
    const cost = BLESSING_COSTS[kind];
    const availableStars = this.committedProgress.totalStars + this.runStars;
    if (availableStars < cost) return false;

    if (kind === 'heal' && this.runHp >= this.committedProgress.maxHp) return false;
    if (kind === 'boots' && this.bootsActive) return false;
    if (kind === 'shield' && this.shieldActive) return false;

    let remainingCost = cost;
    const fromRun = Math.min(this.runStars, remainingCost);
    this.runStars -= fromRun;
    remainingCost -= fromRun;
    if (remainingCost > 0) {
      this.committedProgress.totalStars = Math.max(
        0,
        this.committedProgress.totalStars - remainingCost
      );
    }

    if (kind === 'heal') {
      this.runHp = Math.min(this.committedProgress.maxHp, this.runHp + 1);
      soundController.playStar();
      this.spawnBurst(this.playerX, this.playerY - 38, 'star', 8);
      this.showToast('Warm Cocoa Heal restored +1 Heart!', 2.2);
    } else if (kind === 'boots') {
      this.bootsActive = true;
      soundController.playLevelUp();
      this.spawnBurst(this.playerX, this.playerY - 22, 'star', 8);
      this.showToast('Snowstep Boots equipped (+15% Speed & +12% Jump)!', 2.4);
    } else if (kind === 'shield') {
      this.shieldActive = true;
      soundController.playSnowflake();
      this.spawnBurst(this.playerX, this.playerY - 36, 'snowflake', 10);
      this.showToast('Aurora Shield surrounds Brachio!', 2.4);
    }

    this.emitHud();
    this.callbacks.onProgressPersist(structuredClone(this.committedProgress));
    return true;
  }

  private computeLevelAndExp(
    baseLevel: number,
    baseExp: number,
    addedExp: number
  ): { level: number; exp: number } {
    let level = baseLevel;
    let exp = baseExp + addedExp;
    while (exp >= expRequiredForLevel(level)) {
      exp -= expRequiredForLevel(level);
      level += 1;
    }
    return { level, exp };
  }

  private getEffectiveSnowflakes(): number {
    return Math.max(0, this.committedProgress.totalSnowflakes + this.runSnowflakesDelta);
  }

  private showToast(msg: string, duration = 2.4): void {
    this.toastMessage = msg;
    this.toastTimer = duration;
    this.emitHud();
  }

  private emitHud(): void {
    const { level, exp } = this.computeLevelAndExp(
      this.committedProgress.level,
      this.committedProgress.exp,
      this.runExp
    );

    this.callbacks.onHudUpdate({
      chapterIndex: this.committedProgress.currentChapterIndex,
      chapterTitle: this.chapter.title,
      questTitle: this.chapter.questTitle,
      giftsCollected: this.giftsCollected,
      giftsTarget: this.giftsTarget,
      starsCount: this.committedProgress.totalStars + this.runStars,
      totalGifts: this.committedProgress.totalGifts + this.runGifts,
      snowflakesCount: this.getEffectiveSnowflakes(),
      hp: this.runHp,
      maxHp: this.committedProgress.maxHp,
      level,
      exp,
      expToNextLevel: expRequiredForLevel(level),
      toastMessage: this.toastMessage,
      activeBlessings: {
        snowstepBoots: this.bootsActive,
        auroraShield: this.shieldActive,
      },
    });
  }

  private grantExp(amount: number): void {
    const before = this.computeLevelAndExp(
      this.committedProgress.level,
      this.committedProgress.exp,
      this.runExp
    );
    this.runExp += amount;
    const after = this.computeLevelAndExp(
      this.committedProgress.level,
      this.committedProgress.exp,
      this.runExp
    );
    if (after.level > before.level) {
      this.runHp = Math.min(this.committedProgress.maxHp, this.runHp + 1);
      soundController.playLevelUp();
      this.showToast(`Level Up! Brachio reached Lv. ${after.level}!`, 2.8);
      this.spawnBurst(this.playerX, this.playerY - 40, 'star', 10);
    }
  }

  private spawnBurst(
    x: number,
    y: number,
    kind: 'dust' | 'snowflake' | 'star',
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = kind === 'dust' ? 40 + Math.random() * 70 : 85 + Math.random() * 145;
      this.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (kind === 'dust' ? 25 : 55),
        size: kind === 'dust' ? 22 + Math.random() * 12 : 20 + Math.random() * 14,
        alpha: 0.95,
        life: 0,
        maxLife: kind === 'dust' ? 0.42 : 0.65,
        rotation: Math.random() * Math.PI * 2,
        vRot: -3 + Math.random() * 6,
      });
    }
  }

  private spawnCeremonyFirework(): void {
    const originX = this.playerX;
    const originY = this.playerY - 46;
    const castleTreeX = 800;
    const castleTreeY = 120;
    const dx = castleTreeX - originX;
    const dy = castleTreeY - originY;

    for (let i = 0; i < 6; i++) {
      const kind: 'star' | 'snowflake' = i % 2 === 0 ? 'star' : 'snowflake';
      const spreadX = -55 + Math.random() * 110;
      const spreadY = -50 + Math.random() * 60;
      this.particles.push({
        kind,
        x: originX + (-10 + Math.random() * 20),
        y: originY,
        vx: dx * (0.95 + Math.random() * 0.35) + spreadX,
        vy: dy * (1.25 + Math.random() * 0.3) - 95 + spreadY,
        size: 18 + Math.random() * 14,
        alpha: 1,
        life: 0,
        maxLife: 0.78 + Math.random() * 0.25,
        rotation: Math.random() * Math.PI * 2,
        vRot: -4 + Math.random() * 8,
      });
    }
  }

  private triggerAction(): void {
    if (this.victoryMode || this.ceremonyActive || this.paused) return;
    this.actionTimer = 0.44;

    const deliveryGoal = this.chapter.signposts.find((s) => s.kind === 'delivery');
    if (
      deliveryGoal &&
      this.giftsCollected >= this.giftsTarget &&
      Math.abs(this.playerX - deliveryGoal.x) < 110
    ) {
      this.startDeliveryCeremony();
      return;
    }

    if (this.getEffectiveSnowflakes() > 0) {
      this.runSnowflakesDelta -= 1;
      soundController.playFrostBurst();
      this.spawnBurst(this.playerX, this.playerY - 36, 'snowflake', 12);

      let stunnedAny = false;
      for (const enemy of this.enemies) {
        if (Math.hypot(enemy.x - this.playerX, enemy.y - this.playerY) < 220) {
          enemy.stunTimer = 4.0;
          stunnedAny = true;
        }
      }
      this.grantExp(15);
      this.showToast(
        stunnedAny ? 'Frost Burst chilled nearby snowmen!' : 'Sparkling Frost Burst!',
        1.8
      );
      this.emitHud();
    } else {
      soundController.playFootstep();
      this.spawnBurst(this.playerX + this.facing * 24, this.playerY - 12, 'dust', 5);
      if (this.giftsCollected >= this.giftsTarget) {
        this.showToast('Bring the gifts to the Christmas Star on the right ledge!', 2.2);
      } else {
        this.showToast('Collect Snowflakes to unleash Frost Burst!', 1.8);
      }
    }
  }

  private startDeliveryCeremony(): void {
    if (this.victoryMode || this.ceremonyActive) return;
    this.victoryMode = true;
    this.ceremonyActive = true;
    this.ceremonyTimer = 1.25;
    this.ceremonyFireworkTimer = 0.16;
    this.playerVx = 0;
    this.playerVy = 0;
    soundController.playStageComplete();
    this.spawnBurst(this.playerX, this.playerY - 48, 'star', 14);
    this.spawnCeremonyFirework();
    this.showToast('Delivering Christmas Gifts to Evergreen Castle!', 1.6);
  }

  private finalizeStageComplete(): void {
    const allGifts = this.giftsCollected >= this.giftsTarget;
    const allStars =
      this.runStarsTotalInChapter === 0 ||
      this.runStarsCollectedInChapter >= this.runStarsTotalInChapter;
    const unscathed = this.damageTakenInRun === 0;
    const starsEarned = (allGifts ? 1 : 0) + (allStars ? 1 : 0) + (unscathed ? 1 : 0);

    const summary: StageClearSummary = {
      starsEarned,
      allGifts,
      allStars,
      unscathed,
    };

    const { level, exp } = this.computeLevelAndExp(
      this.committedProgress.level,
      this.committedProgress.exp,
      this.runExp
    );

    this.committedProgress.level = level;
    this.committedProgress.exp = exp;
    this.committedProgress.hp = Math.max(1, this.runHp);
    this.committedProgress.totalStars += this.runStars;
    this.committedProgress.totalGifts += this.runGifts;
    this.committedProgress.totalSnowflakes = Math.max(
      0,
      this.committedProgress.totalSnowflakes + this.runSnowflakesDelta
    );
    this.committedProgress.highestUnlockedChapter = Math.max(
      this.committedProgress.highestUnlockedChapter,
      Math.min(this.committedProgress.currentChapterIndex + 1, CHAPTERS.length - 1)
    );
    const prevRating = this.committedProgress.chapterRatings[this.chapter.id] ?? 0;
    this.committedProgress.chapterRatings[this.chapter.id] = Math.max(prevRating, starsEarned);

    this.runStars = 0;
    this.runGifts = 0;
    this.runSnowflakesDelta = 0;
    this.runExp = 0;

    this.emitHud();
    this.callbacks.onProgressPersist(structuredClone(this.committedProgress));
    this.callbacks.onStageComplete(this.chapter, summary);
  }

  private handleDamage(knockDir: number): void {
    if (this.invulnTimer > 0 || this.victoryMode || this.ceremonyActive) return;

    if (this.shieldActive) {
      this.shieldActive = false;
      this.invulnTimer = 1.6;
      this.playerVy = -340;
      this.playerVx = knockDir * 180;
      soundController.playSnowflake();
      this.spawnBurst(this.playerX, this.playerY - 36, 'snowflake', 12);
      this.showToast('Aurora Shield absorbed the hit!', 2.2);
      this.emitHud();
      return;
    }

    this.runHp = Math.max(0, this.runHp - 1);
    this.damageTakenInRun += 1;
    this.invulnTimer = 1.5;
    this.playerVy = -380;
    this.playerVx = knockDir * 210;
    soundController.playBump();
    this.spawnBurst(this.playerX, this.playerY - 30, 'dust', 6);
    this.emitHud();

    if (this.runHp <= 0) {
      this.paused = true;
      this.callbacks.onGameOver();
    }
  }

  public update(dtRaw: number, input: InputState, viewportLogicalW: number): void {
    const dt = Math.min(dtRaw, 0.045);
    this.globalTime += dt;

    // Update gentle ambient snowfall even on title/dialogs
    for (const drop of this.ambientSnow) {
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.rot += drop.vRot * dt;
      if (drop.y > WORLD_LOGICAL_HEIGHT + 20) {
        drop.y = -20;
        drop.x = Math.random() * (viewportLogicalW + 200);
      }
      if (drop.x < -30) drop.x = viewportLogicalW + 20;
      if (drop.x > viewportLogicalW + 40) drop.x = -20;
    }

    // Update transient particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.rotation += p.vRot * dt;
      p.alpha = 1 - p.life / p.maxLife;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastMessage = null;
        this.emitHud();
      }
    }

    // Subtle sparkle emitted from the golden goal star once all gifts are collected
    const deliveryGoal = this.chapter.signposts.find((s) => s.kind === 'delivery');
    if (deliveryGoal && this.giftsCollected >= this.giftsTarget && !this.ceremonyActive && !this.victoryMode) {
      this.goalSparkleTimer -= dt;
      if (this.goalSparkleTimer <= 0) {
        this.goalSparkleTimer = 0.55;
        this.particles.push({
          kind: 'star',
          x: deliveryGoal.x + (-12 + Math.random() * 24),
          y: deliveryGoal.y - 38,
          vx: -18 + Math.random() * 36,
          vy: -135 - Math.random() * 45,
          size: 13 + Math.random() * 7,
          alpha: 0.9,
          life: 0,
          maxLife: 0.55,
          rotation: Math.random() * Math.PI * 2,
          vRot: -3 + Math.random() * 6,
        });
      }
    }

    // Delivery Ceremony sequence (~1.25s) before opening StoryDialog
    if (this.ceremonyActive) {
      this.ceremonyTimer -= dt;
      this.ceremonyFireworkTimer -= dt;
      if (this.ceremonyFireworkTimer <= 0 && this.ceremonyTimer > 0.15) {
        this.ceremonyFireworkTimer = 0.2;
        this.spawnCeremonyFirework();
      }
      if (this.ceremonyTimer <= 0) {
        this.ceremonyActive = false;
        this.finalizeStageComplete();
      }
      this.prevJumpInput = input.jumpPressed;
      this.prevActionInput = input.actionPressed;
      return;
    }

    if (this.paused || this.victoryMode) {
      this.prevJumpInput = input.jumpPressed;
      this.prevActionInput = input.actionPressed;
      return;
    }

    if (this.missingGiftCooldown > 0) {
      this.missingGiftCooldown -= dt;
    }

    // Edge-triggered jump & action
    const jumpJustPressed = input.jumpPressed && !this.prevJumpInput;
    const actionJustPressed = input.actionPressed && !this.prevActionInput;
    this.prevJumpInput = input.jumpPressed;
    this.prevActionInput = input.actionPressed;

    if (jumpJustPressed) {
      this.jumpBufferTimer = 0.12;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    if (actionJustPressed) {
      this.triggerAction();
    }

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.actionTimer > 0) this.actionTimer -= dt;

    // Horizontal movement (enhanced by Snowstep Boots blessing)
    const effectiveMoveSpeed = MOVE_SPEED * (this.bootsActive ? 1.15 : 1);
    const effectiveJumpVelocity = JUMP_VELOCITY * (this.bootsActive ? 1.12 : 1);

    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (moveDir !== 0) {
      this.facing = moveDir > 0 ? 1 : -1;
      const targetVx = moveDir * effectiveMoveSpeed;
      this.playerVx += (targetVx - this.playerVx) * Math.min(1, dt * 14);
      this.walkAnimTimer += dt;
      if (this.grounded) {
        this.footstepTimer -= dt;
        if (this.footstepTimer <= 0) {
          this.footstepTimer = this.bootsActive ? 0.24 : 0.28;
          soundController.playFootstep();
          this.spawnBurst(this.playerX - this.facing * 14, this.playerY - 4, 'dust', 2);
        }
      }
    } else {
      this.playerVx *= Math.pow(0.001, dt);
      if (Math.abs(this.playerVx) < 4) this.playerVx = 0;
    }

    // Coyote time & jump execution
    if (this.grounded) {
      this.coyoteTimer = 0.1;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVy = effectiveJumpVelocity;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      soundController.playJump();
      this.spawnBurst(this.playerX, this.playerY - 4, 'dust', 4);
    }

    // Gravity
    this.playerVy = Math.min(920, this.playerVy + GRAVITY * dt);

    // Move X
    this.playerX += this.playerVx * dt;
    this.playerX = Math.max(30, Math.min(this.chapter.worldWidth - 30, this.playerX));

    // Move Y & Platform Top-Collision (one-way floating platforms, solid ground)
    const prevY = this.playerY;
    this.playerY += this.playerVy * dt;
    this.grounded = false;

    const halfW = PLAYER_HITBOX_W * 0.42;
    for (const plat of this.chapter.platforms) {
      const overlapX =
        this.playerX + halfW > plat.x + 8 && this.playerX - halfW < plat.x + plat.width - 8;
      if (!overlapX) continue;

      if (this.playerVy >= 0 && prevY <= plat.y + 12 && this.playerY >= plat.y) {
        this.playerY = plat.y;
        this.playerVy = 0;
        this.grounded = true;
        if (plat.isGround) {
          this.lastSafeX = Math.max(plat.x + 48, Math.min(plat.x + plat.width - 48, this.playerX));
          this.lastSafeY = plat.y;
        }
        break;
      }
    }

    // Pit fall recovery
    if (this.playerY > WORLD_LOGICAL_HEIGHT + 90) {
      this.playerX = this.lastSafeX;
      this.playerY = this.lastSafeY - 10;
      this.playerVx = 0;
      this.playerVy = 0;
      this.handleDamage(1);
    }

    // Collectibles pickup (staged in run state until stage completion)
    const playerCenterY = this.playerY - PLAYER_HITBOX_H * 0.48;
    let hudDirty = false;
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const dist = Math.hypot(this.playerX - item.x, playerCenterY - item.y);
      if (dist < 46) {
        item.collected = true;
        hudDirty = true;
        if (item.type === 'star') {
          this.runStars += 1;
          this.runStarsCollectedInChapter += 1;
          soundController.playStar();
          this.spawnBurst(item.x, item.y, 'star', 6);
          this.grantExp(25);
        } else if (item.type === 'gift') {
          this.giftsCollected += 1;
          this.runGifts += 1;
          soundController.playGift();
          this.spawnBurst(item.x, item.y, 'star', 8);
          this.grantExp(40);
          if (this.giftsCollected >= this.giftsTarget) {
            this.showToast(
              'All Gifts collected! Reach the Christmas Star on the right ledge!',
              3.2
            );
          } else {
            this.showToast(
              `Gift collected (${this.giftsCollected}/${this.giftsTarget})!`,
              1.6
            );
          }
        } else if (item.type === 'snowflake') {
          this.runSnowflakesDelta += 1;
          soundController.playSnowflake();
          this.spawnBurst(item.x, item.y, 'snowflake', 6);
          this.grantExp(15);
        }
      }
    }

    if (hudDirty) {
      this.emitHud();
    }

    // Enemies update & collision
    for (const enemy of this.enemies) {
      enemy.animTimer += dt;
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        continue;
      }
      enemy.x += enemy.dir * enemy.speed * dt;
      if (enemy.x >= enemy.patrolMaxX) {
        enemy.x = enemy.patrolMaxX;
        enemy.dir = -1;
      } else if (enemy.x <= enemy.patrolMinX) {
        enemy.x = enemy.patrolMinX;
        enemy.dir = 1;
      }

      const dx = Math.abs(this.playerX - enemy.x);
      const dy = this.playerY - enemy.y;
      if (dx < 36 && Math.abs(dy) < 52) {
        if (this.playerVy > 40 && prevY <= enemy.y - 24) {
          enemy.stunTimer = 3.2;
          this.playerVy = -450;
          soundController.playJump();
          this.spawnBurst(enemy.x, enemy.y - 36, 'snowflake', 7);
          this.grantExp(15);
          this.emitHud();
        } else {
          const knockDir = this.playerX < enemy.x ? -1 : 1;
          this.handleDamage(knockDir);
        }
      }
    }

    // Check delivery goal landmark or notify if gifts are missing
    if (deliveryGoal) {
      if (
        this.giftsCollected >= this.giftsTarget &&
        Math.abs(this.playerX - deliveryGoal.x) < 55 &&
        Math.abs(this.playerY - deliveryGoal.y) < 60
      ) {
        this.startDeliveryCeremony();
      } else if (
        this.giftsCollected < this.giftsTarget &&
        this.playerX > 870 &&
        this.playerY <= 245 &&
        this.missingGiftCooldown <= 0
      ) {
        const remaining = this.giftsTarget - this.giftsCollected;
        this.showToast(
          `${remaining} Gift${remaining === 1 ? '' : 's'} remaining on the platforms to the left!`,
          2.4
        );
        this.missingGiftCooldown = 3.5;
      }
    }

    // Smooth camera follow
    const targetCamX = Math.max(
      0,
      Math.min(this.chapter.worldWidth - viewportLogicalW, this.playerX - viewportLogicalW * 0.36)
    );
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 7);
  }

  private drawSpriteCentered(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    cx: number,
    cy: number,
    targetH: number,
    options?: { flipX?: boolean; scaleX?: number; scaleY?: number; rotation?: number; alpha?: number }
  ): void {
    const scale = targetH / frame.height;
    const w = frame.width * scale;
    const h = targetH;
    ctx.save();
    if (options?.alpha !== undefined) ctx.globalAlpha = options.alpha;
    ctx.translate(cx, cy);
    if (options?.rotation) ctx.rotate(options.rotation);
    const sx = (options?.flipX ? -1 : 1) * (options?.scaleX ?? 1);
    const sy = options?.scaleY ?? 1;
    ctx.scale(sx, sy);
    ctx.drawImage(frame.canvas, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawSpriteBottomCenter(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    bx: number,
    by: number,
    targetH: number,
    options?: { flipX?: boolean; scaleX?: number; scaleY?: number; alpha?: number }
  ): void {
    const scale = targetH / frame.height;
    const w = frame.width * scale;
    const h = targetH;
    ctx.save();
    if (options?.alpha !== undefined) ctx.globalAlpha = options.alpha;
    ctx.translate(bx, by);
    const sx = (options?.flipX ? -1 : 1) * (options?.scaleX ?? 1);
    const sy = options?.scaleY ?? 1;
    ctx.scale(sx, sy);
    ctx.drawImage(frame.canvas, -w / 2, -h, w, h);
    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const bg = this.assets.backgroundScene;
    const bgNaturalW = bg.naturalWidth || 1664;
    const bgNaturalH = bg.naturalHeight || 928;
    const bgWorldWidth = (bgNaturalW / bgNaturalH) * WORLD_LOGICAL_HEIGHT;
    const scale = Math.max(canvasHeight / WORLD_LOGICAL_HEIGHT, canvasWidth / bgWorldWidth);
    const viewportLogicalW = canvasWidth / scale;

    ctx.save();
    ctx.scale(scale, scale);

    // Clamp camera across full background width
    const maxCamX = Math.max(0, bgWorldWidth - viewportLogicalW);
    const renderCamX = Math.max(0, Math.min(maxCamX, this.cameraX));

    // World space transform
    ctx.save();
    ctx.translate(-renderCamX, 0);

    // 1. Single full-height scene background
    ctx.drawImage(bg, 0, 0, bgWorldWidth, WORLD_LOGICAL_HEIGHT);

    // 2. Goal Beacon on right ledge: translucent snowflake before gifts complete, glowing golden star when ready
    const deliveryGoal = this.chapter.signposts.find((s) => s.kind === 'delivery');
    if (deliveryGoal && !this.victoryMode) {
      const ready = this.giftsCollected >= this.giftsTarget;
      const bob = Math.sin(this.globalTime * 4) * 5;
      if (ready) {
        const pulse = 1 + Math.sin(this.globalTime * 5) * 0.08;
        this.drawSpriteCentered(
          ctx,
          this.assets.props.star,
          deliveryGoal.x,
          deliveryGoal.y - 38 + bob,
          38 * pulse,
          {
            alpha: 1,
            rotation: Math.sin(this.globalTime * 2.5) * 0.15,
          }
        );
      } else {
        const pulseAlpha = 0.46 + Math.sin(this.globalTime * 3) * 0.16;
        this.drawSpriteCentered(
          ctx,
          this.assets.props.snowflake,
          deliveryGoal.x,
          deliveryGoal.y - 36 + bob,
          28,
          {
            alpha: pulseAlpha,
            rotation: this.globalTime * 0.8,
          }
        );
      }
    }

    // 3. Collectibles (Star, Gift, Snowflake)
    for (const item of this.collectibles) {
      if (item.collected) continue;
      if (item.x < renderCamX - 80 || item.x > renderCamX + viewportLogicalW + 80) continue;

      const bob = Math.sin(this.globalTime * 3.4 + item.phase) * 5;
      if (item.type === 'star') {
        const spinScaleX = 0.72 + Math.abs(Math.cos(this.globalTime * 3.2 + item.phase)) * 0.28;
        this.drawSpriteCentered(ctx, this.assets.props.star, item.x, item.y + bob, 34, {
          scaleX: spinScaleX,
        });
      } else if (item.type === 'gift') {
        const pulse = 1 + Math.sin(this.globalTime * 4.5 + item.phase) * 0.06;
        this.drawSpriteCentered(ctx, this.assets.props.gift, item.x, item.y + bob, 38 * pulse);
      } else {
        this.drawSpriteCentered(ctx, this.assets.props.snowflake, item.x, item.y + bob, 32, {
          rotation: this.globalTime * 1.1 + item.phase,
        });
      }
    }

    // 4. Enemies (Patrolling grumpy Snowmen)
    for (const enemy of this.enemies) {
      if (enemy.x < renderCamX - 100 || enemy.x > renderCamX + viewportLogicalW + 100) continue;
      const frame =
        Math.floor(enemy.animTimer * 4) % 2 === 0
          ? this.assets.props.snowman1
          : this.assets.props.snowman2;
      const stunned = enemy.stunTimer > 0;
      const wobble = stunned ? Math.sin(this.globalTime * 24) * 0.08 : 0;
      this.drawSpriteBottomCenter(ctx, frame, enemy.x, enemy.y + 3, 56, {
        flipX: enemy.dir < 0,
        alpha: stunned ? 0.65 : 1,
        scaleX: 1 + wobble,
        scaleY: stunned ? 0.9 : 1,
      });
      if (stunned) {
        this.drawSpriteCentered(
          ctx,
          this.assets.props.snowflake,
          enemy.x,
          enemy.y - 62,
          20,
          { rotation: this.globalTime * 4 }
        );
      }
    }

    // 5. Player (Joguman Brachio)
    let playerFrame: SpriteFrame = this.assets.brachio.idle1;
    let breathScaleY = 1;
    if (this.victoryMode) {
      playerFrame = this.assets.brachio.victory;
      breathScaleY = 1 + Math.abs(Math.sin(this.globalTime * 6)) * 0.04;
    } else if (this.actionTimer > 0) {
      playerFrame = this.assets.brachio.action;
    } else if (!this.grounded) {
      playerFrame = this.playerVy < -30 ? this.assets.brachio.jump : this.assets.brachio.fall;
    } else if (Math.abs(this.playerVx) > 22) {
      const cycle = this.assets.brachio.walkCycle;
      const frameIdx = Math.floor(this.walkAnimTimer * (this.bootsActive ? 11 : 9)) % cycle.length;
      playerFrame = cycle[frameIdx];
    } else {
      playerFrame = this.assets.brachio.idle1;
      breathScaleY = 1 + Math.sin(this.globalTime * 3.5) * 0.025;
    }

    const blinkHide = this.invulnTimer > 0 && Math.floor(this.invulnTimer * 14) % 2 === 0;
    if (!blinkHide) {
      this.drawSpriteBottomCenter(ctx, playerFrame, this.playerX, this.playerY + 3, 76, {
        flipX: this.facing < 0,
        scaleY: breathScaleY,
      });
    }

    // Orbiting snowflake sprite indicator when Aurora Shield blessing is active
    if (this.shieldActive && !this.victoryMode) {
      for (let i = 0; i < 2; i++) {
        const orbitAngle = this.globalTime * 3.2 + i * Math.PI;
        const ox = this.playerX + Math.cos(orbitAngle) * 32;
        const oy = this.playerY - 38 + Math.sin(orbitAngle) * 14;
        this.drawSpriteCentered(ctx, this.assets.props.snowflake, ox, oy, 16, {
          alpha: 0.88,
          rotation: this.globalTime * 2.4,
        });
      }
    }

    // 6. World-space particles (dust puffs, stars, frost burst snowflakes)
    for (const p of this.particles) {
      const sprite =
        p.kind === 'dust'
          ? this.assets.props.dustPuff
          : p.kind === 'snowflake'
          ? this.assets.props.snowflake
          : this.assets.props.star;
      this.drawSpriteCentered(ctx, sprite, p.x, p.y, p.size, {
        alpha: p.alpha,
        rotation: p.rotation,
      });
    }

    ctx.restore();

    // 7. Foreground ambient snowfall
    for (const drop of this.ambientSnow) {
      this.drawSpriteCentered(ctx, this.assets.props.snowflake, drop.x, drop.y, drop.size, {
        alpha: drop.alpha,
        rotation: drop.rot,
      });
    }

    ctx.restore();
  }
}
