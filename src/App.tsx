import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { BlessingModal } from './components/BlessingModal';
import { GameHud } from './components/GameHud';
import { SettingsModal } from './components/SettingsModal';
import { StoryDialog } from './components/StoryDialog';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ASSET_URLS, loadGameAssets } from './game/assets';
import { soundController } from './game/audio';
import { ChristmasGameEngine, type InputState } from './game/engine';
import { CHAPTERS } from './game/levels';
import { loadUiAssets, type UiAssets } from './game/uiAssets';
import {
  expRequiredForLevel,
  loadProgress,
  resetProgressStorage,
  saveProgress,
} from './game/storage';
import type {
  AudioSettings,
  BlessingKind,
  ChapterDef,
  GameScreenState,
  HudSnapshot,
  PlayerProgress,
  StageClearSummary,
} from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ChristmasGameEngine | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpPressed: false,
    actionPressed: false,
  });

  const [assetsReady, setAssetsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uiAssets, setUiAssets] = useState<UiAssets | null>(null);
  const [screenState, setScreenState] = useState<GameScreenState>('TITLE');
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blessingOpen, setBlessingOpen] = useState(false);
  const [completedChapter, setCompletedChapter] = useState<ChapterDef | null>(null);
  const [stageSummary, setStageSummary] = useState<StageClearSummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const initial = loadProgress();
    const chap = CHAPTERS[Math.min(initial.currentChapterIndex, CHAPTERS.length - 1)];
    return {
      chapterIndex: initial.currentChapterIndex,
      chapterTitle: chap.title,
      questTitle: chap.questTitle,
      giftsCollected: 0,
      giftsTarget: chap.collectibles.filter((c) => c.type === 'gift').length,
      starsCount: initial.totalStars,
      totalGifts: initial.totalGifts,
      snowflakesCount: initial.totalSnowflakes,
      hp: initial.hp,
      maxHp: initial.maxHp,
      level: initial.level,
      exp: initial.exp,
      expToNextLevel: expRequiredForLevel(initial.level),
      toastMessage: null,
      activeBlessings: {
        snowstepBoots: false,
        auroraShield: false,
      },
    };
  });

  useEffect(() => {
    soundController.updateSettings(progress.settings);
  }, [progress.settings]);

  const handleStageComplete = useCallback(
    (chapter: ChapterDef, summary: StageClearSummary) => {
      setBlessingOpen(false);
      setCompletedChapter(chapter);
      setStageSummary(summary);
      const isFinal = chapter.chapterNumber >= CHAPTERS.length;
      setScreenState(isFinal ? 'ADVENTURE_COMPLETE' : 'STAGE_COMPLETE');
      void soundController.speakStory(
        chapter.storyDialogue,
        chapter.storySpeaker,
        setIsSpeaking
      );
    },
    []
  );

  // Load spritesheets, UI sheets & parallax layers, initialize Canvas 2D engine
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGameAssets(), loadUiAssets()])
      .then(([assets, loadedUiAssets]) => {
        if (cancelled) return;
        setUiAssets(loadedUiAssets);
        const saved = loadProgress();
        const engine = new ChristmasGameEngine(assets, saved, {
          onHudUpdate: (nextHud) => {
            setHud((prev) => ({
              ...nextHud,
              totalGifts: nextHud.totalGifts ?? prev.totalGifts,
            }));
          },
          onProgressPersist: (nextProg) => {
            setProgress(nextProg);
            saveProgress(nextProg);
            setHud((prev) => ({ ...prev, totalGifts: nextProg.totalGifts }));
          },
          onStageComplete: handleStageComplete,
          onGameOver: () => {
            setScreenState('GAME_OVER');
          },
        });
        engine.setPaused(true);
        engineRef.current = engine;
        setAssetsReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load game textures.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handleStageComplete]);

  // Main animation loop & responsive canvas resize
  useEffect(() => {
    if (!assetsReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const engine = engineRef.current;
      if (engine) {
        const logicalViewportW = (canvas.width / Math.max(1, canvas.height)) * 540;
        engine.update(dt, inputRef.current, logicalViewportW);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        engine.render(ctx, canvas.width, canvas.height);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [assetsReady]);

  // Strictly Arrow Keys for game movement & skills
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') inputRef.current.left = true;
      if (e.key === 'ArrowRight') inputRef.current.right = true;
      if (e.key === 'ArrowUp') inputRef.current.jumpPressed = true;
      if (e.key === 'ArrowDown') inputRef.current.actionPressed = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') inputRef.current.left = false;
      if (e.key === 'ArrowRight') inputRef.current.right = false;
      if (e.key === 'ArrowUp') inputRef.current.jumpPressed = false;
      if (e.key === 'ArrowDown') inputRef.current.actionPressed = false;
    };

    const clearInputs = () => {
      inputRef.current = {
        left: false,
        right: false,
        jumpPressed: false,
        actionPressed: false,
      };
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
    };
  }, []);

  const handleControlChange = useCallback(
    (control: 'left' | 'right' | 'jump' | 'action', active: boolean) => {
      soundController.unlock();
      if (control === 'left') inputRef.current.left = active;
      if (control === 'right') inputRef.current.right = active;
      if (control === 'jump') inputRef.current.jumpPressed = active;
      if (control === 'action') inputRef.current.actionPressed = active;
    },
    []
  );

  const startAdventure = (startFromBeginning: boolean) => {
    soundController.unlock();
    soundController.stopSpeech();
    if (startFromBeginning) {
      const fresh = resetProgressStorage();
      setProgress(fresh);
      engineRef.current?.syncProgress(fresh);
      engineRef.current?.loadChapter(0);
    } else {
      const restored = { ...progress, hp: Math.max(1, progress.hp) };
      setProgress(restored);
      saveProgress(restored);
      engineRef.current?.syncProgress(restored);
      engineRef.current?.loadChapter(restored.currentChapterIndex);
    }
    engineRef.current?.setPaused(false);
    setScreenState('PLAYING');
  };

  const handleNextChapter = () => {
    soundController.stopSpeech();
    const isFinal =
      completedChapter && completedChapter.chapterNumber >= CHAPTERS.length;
    const nextIdx = isFinal ? 0 : Math.min(CHAPTERS.length - 1, progress.currentChapterIndex + 1);
    const updated: PlayerProgress = {
      ...progress,
      currentChapterIndex: nextIdx,
      hp: progress.maxHp,
    };
    setProgress(updated);
    saveProgress(updated);
    engineRef.current?.syncProgress(updated);
    engineRef.current?.loadChapter(nextIdx);
    engineRef.current?.setPaused(false);
    setCompletedChapter(null);
    setStageSummary(null);
    setScreenState('PLAYING');
  };

  const handleRetryChapter = () => {
    soundController.unlock();
    const restored: PlayerProgress = {
      ...progress,
      hp: progress.maxHp,
    };
    setProgress(restored);
    saveProgress(restored);
    engineRef.current?.syncProgress(restored);
    engineRef.current?.loadChapter(restored.currentChapterIndex);
    engineRef.current?.setPaused(false);
    setStageSummary(null);
    setScreenState('PLAYING');
  };

  const handleUpdateSettings = (nextSettings: AudioSettings) => {
    const updated: PlayerProgress = {
      ...progress,
      settings: nextSettings,
    };
    setProgress(updated);
    saveProgress(updated);
    soundController.updateSettings(nextSettings);
    engineRef.current?.syncProgress(updated);
  };

  const handleOpenSettings = () => {
    soundController.unlock();
    setBlessingOpen(false);
    setSettingsOpen(true);
    engineRef.current?.setPaused(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    if (screenState === 'PLAYING' && !blessingOpen) {
      engineRef.current?.setPaused(false);
    }
  };

  const handleOpenBlessingShop = () => {
    if (screenState !== 'PLAYING') return;
    soundController.unlock();
    setSettingsOpen(false);
    setBlessingOpen(true);
    engineRef.current?.setPaused(true);
  };

  const handleCloseBlessingShop = () => {
    setBlessingOpen(false);
    if (screenState === 'PLAYING' && !settingsOpen) {
      engineRef.current?.setPaused(false);
    }
  };

  const handlePurchaseBlessing = (kind: BlessingKind) => {
    soundController.unlock();
    engineRef.current?.purchaseBlessing(kind);
  };

  const hasSavedProgress =
    progress.currentChapterIndex > 0 ||
    progress.totalStars > 0 ||
    progress.totalGifts > 0 ||
    progress.level > 1 ||
    Object.keys(progress.chapterRatings).length > 0;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#82b5d6]">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Loading State */}
      {!assetsReady && !loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1b2838]/85 text-[#FFF8E7] backdrop-blur-sm">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-[#FFF8E7] shadow-lg">
            <img
              src={ASSET_URLS.brachioPortrait}
              alt="Loading Brachio"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-4 font-display text-lg font-bold">
            Preparing Evergreen Village...
          </p>
        </div>
      )}

      {/* Load Error State */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center text-white">
          <p className="font-display text-xl font-bold text-rose-400">
            Could not load adventure assets
          </p>
          <p className="mt-2 max-w-md text-sm text-slate-300">{loadError}</p>
        </div>
      )}

      {/* Active HUD */}
      {assetsReady && uiAssets && screenState !== 'TITLE' && (
        <GameHud
          hud={hud}
          uiAssets={uiAssets}
          onOpenSettings={handleOpenSettings}
          onOpenBlessingShop={handleOpenBlessingShop}
          onControlChange={handleControlChange}
          showTouchControls={
            (screenState === 'PLAYING' ||
              screenState === 'STAGE_COMPLETE' ||
              screenState === 'ADVENTURE_COMPLETE') &&
            !settingsOpen &&
            !blessingOpen
          }
        />
      )}

      {/* Illustrated Welcome / Title Screen */}
      {assetsReady && uiAssets && screenState === 'TITLE' && (
        <WelcomeScreen
          uiAssets={uiAssets}
          hasSavedProgress={hasSavedProgress}
          currentChapterNumber={progress.currentChapterIndex + 1}
          onStartAdventure={startAdventure}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Stage Complete / Adventure Complete Story Dialog */}
      {assetsReady &&
        uiAssets &&
        (screenState === 'STAGE_COMPLETE' || screenState === 'ADVENTURE_COMPLETE') &&
        completedChapter && (
          <StoryDialog
            chapter={completedChapter}
            summary={stageSummary}
            uiAssets={uiAssets}
            isFinalChapter={screenState === 'ADVENTURE_COMPLETE'}
            isSpeaking={isSpeaking}
            ttsEnabled={progress.settings.ttsEnabled}
            onReplaySpeech={() => {
              soundController.unlock();
              void soundController.speakStory(
                completedChapter.storyDialogue,
                completedChapter.storySpeaker,
                setIsSpeaking
              );
            }}
            onToggleTtsMute={() => {
              const nextEnabled = !progress.settings.ttsEnabled;
              handleUpdateSettings({ ...progress.settings, ttsEnabled: nextEnabled });
              if (!nextEnabled) {
                soundController.stopSpeech();
                setIsSpeaking(false);
              } else {
                void soundController.speakStory(
                  completedChapter.storyDialogue,
                  completedChapter.storySpeaker,
                  setIsSpeaking
                );
              }
            }}
            onNextChapter={handleNextChapter}
          />
        )}

      {/* Game Over Retry Overlay */}
      {assetsReady && screenState === 'GAME_OVER' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-[#D7B377] bg-[#FFF9ED] p-6 text-center text-[#3E2A1E] shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-[#9C4221]">
              Brachio Slipped in the Snow!
            </h2>
            <p className="mt-2 text-sm text-[#6E4E37]">
              Take a deep breath, dust off that Santa hat, and hop right back onto the snowy trail.
            </p>
            <button
              type="button"
              onClick={handleRetryChapter}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-display text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Chapter Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Starlight Blessing Shop Modal */}
      {blessingOpen && (
        <BlessingModal
          starsCount={hud.starsCount}
          hp={hud.hp}
          maxHp={hud.maxHp}
          activeBlessings={hud.activeBlessings}
          onPurchase={handlePurchaseBlessing}
          onClose={handleCloseBlessingShop}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={progress.settings}
          currentChapterIndex={progress.currentChapterIndex}
          highestUnlockedChapter={progress.highestUnlockedChapter}
          chapterRatings={progress.chapterRatings}
          onUpdateSettings={handleUpdateSettings}
          onSelectChapter={(idx) => {
            const next: PlayerProgress = {
              ...progress,
              currentChapterIndex: idx,
              hp: progress.maxHp,
            };
            setProgress(next);
            saveProgress(next);
            engineRef.current?.syncProgress(next);
            engineRef.current?.loadChapter(idx);
            engineRef.current?.setPaused(false);
            setCompletedChapter(null);
            setStageSummary(null);
            setScreenState('PLAYING');
          }}
          onResetSave={() => {
            soundController.stopSpeech();
            const fresh = resetProgressStorage();
            setProgress(fresh);
            engineRef.current?.syncProgress(fresh);
            engineRef.current?.loadChapter(0);
            engineRef.current?.setPaused(false);
            setCompletedChapter(null);
            setStageSummary(null);
            setScreenState('PLAYING');
          }}
          onClose={handleCloseSettings}
        />
      )}
    </main>
  );
}
