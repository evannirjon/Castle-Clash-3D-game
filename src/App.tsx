import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignHeroModal } from './components/CampaignHeroModal';
import { GameHud } from './components/GameHud';
import { StatusModal } from './components/StatusModal';
import { soundEngine } from './game/audio';
import { KingdomGameEngine, WORLD_HEIGHT, WORLD_WIDTH } from './game/engine';
import {
  CastleTowerShieldSvg,
  DemonSkullShieldSvg,
  HudIconSvg,
  TitleCrestSvg,
} from './game/icons';
import {
  ALLY_UNITS,
  BOSS_PORTRAIT_1,
  BOSS_PORTRAIT_2,
  HEROES,
  getLevelConfig,
  loadSaveProgress,
  persistSaveProgress,
  purchaseHeroState,
} from './game/rules';
import { BattleSnapshot, GameState, HeroId, LiveHudState, SaveProgress, UnitType } from './game/types';

const INITIAL_HUD: LiveHudState = {
  level: 1,
  levelName: 'Borderwatch Outpost',
  castleDistance: 1150,
  featuredEnemyName: 'Goblin Outrider',
  featuredEnemyTitle: 'Borderland Warg Scout',
  featuredBossPortraitUrl: BOSS_PORTRAIT_1,
  secondaryBossPortraitUrl: BOSS_PORTRAIT_2,
  battleGold: 185,
  goldRate: 17,
  score: 0,
  highScore: 0,
  elapsedSeconds: 0,
  playerCastleHp: 1200,
  playerCastleMaxHp: 1200,
  enemyCastleHp: 720,
  enemyCastleMaxHp: 720,
  heroHp: 780,
  heroMaxHp: 780,
  heroSkillCooldown: 0,
  heroSkillMaxCooldown: 10,
  dragonCooldown: 0,
  dragonMaxCooldown: 22,
  dragonActive: false,
  enemyDragonWarning: 0,
  wallLevel: 1,
  towerLevel: 1,
  unitCooldowns: { swordsman: 0, archer: 0, knight: 0, siege: 0 },
  unitMaxCooldowns: {
    swordsman: ALLY_UNITS.swordsman.cooldown,
    archer: ALLY_UNITS.archer.cooldown,
    knight: ALLY_UNITS.knight.cooldown,
    siege: ALLY_UNITS.siege.cooldown,
  },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<KingdomGameEngine | null>(null);

  const [save, setSave] = useState<SaveProgress>(() => loadSaveProgress());
  const saveRef = useRef<SaveProgress>(save);
  useEffect(() => {
    saveRef.current = save;
    persistSaveProgress(save);
    engineRef.current?.setHighScore(save.highScore);
  }, [save]);

  const [selectedLevel, setSelectedLevel] = useState<number>(() => save.highestUnlockedLevel);
  const selectedLevelRef = useRef<number>(selectedLevel);
  useEffect(() => {
    selectedLevelRef.current = selectedLevel;
  }, [selectedLevel]);

  const [gameState, setGameState] = useState<GameState>('title');
  const [hud, setHud] = useState<LiveHudState>(INITIAL_HUD);
  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [councilOpen, setCouncilOpen] = useState<boolean>(false);
  const [councilTab, setCouncilTab] = useState<'levels' | 'heroes'>('levels');
  const councilOpenRef = useRef<boolean>(false);
  useEffect(() => {
    councilOpenRef.current = councilOpen;
  }, [councilOpen]);

  const handleBattleEnd = useCallback((battleSnap: BattleSnapshot) => {
    setSnapshot(battleSnap);
    setSave((prev) => {
      const nextCoins = prev.coins + battleSnap.coinsEarned;
      const nextHighestLevel = battleSnap.victory
        ? Math.min(20, Math.max(prev.highestUnlockedLevel, battleSnap.level + 1))
        : prev.highestUnlockedLevel;
      const nextHighScore = Math.max(prev.highScore, battleSnap.score);
      const prevLvlScore = prev.levelScores[battleSnap.level] || 0;
      const prevLvlStars = prev.levelStars[battleSnap.level] || 0;

      return {
        ...prev,
        coins: nextCoins,
        highestUnlockedLevel: nextHighestLevel,
        highScore: nextHighScore,
        levelScores: {
          ...prev.levelScores,
          [battleSnap.level]: Math.max(prevLvlScore, battleSnap.score),
        },
        levelStars: {
          ...prev.levelStars,
          [battleSnap.level]: Math.max(prevLvlStars, battleSnap.starsEarned),
        },
      };
    });
  }, []);

  const startLevelBattle = useCallback((levelToStart?: number) => {
    const lvl = levelToStart ?? selectedLevelRef.current;
    setSelectedLevel(lvl);
    setCouncilOpen(false);
    setSnapshot(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    engineRef.current?.startBattle(lvl, saveRef.current.selectedHero, saveRef.current.highScore);
  }, []);

  // Mount Canvas & Simulation Loop once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;

    const engine = new KingdomGameEngine(canvas, {
      onHudUpdate: (nextHud) => setHud(nextHud),
      onBattleEnd: handleBattleEnd,
      onStateChange: (nextState) => setGameState(nextState),
    });
    engineRef.current = engine;
    (window as unknown as Record<string, unknown>).__engine = engine;
    engine.setHighScore(saveRef.current.highScore);
    engine.startLoop();

    // Check ?autostart=1 query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startBattle(
        selectedLevelRef.current,
        saveRef.current.selectedHero,
        saveRef.current.highScore
      );
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || e.code === 'KeyP')) {
        return;
      }

      const currentState = engine.getGameState();

      if (e.code === 'KeyM') {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
        return;
      }

      if (currentState === 'title' && !councilOpenRef.current) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startLevelBattle();
        }
        return;
      }

      if (currentState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          engine.setGameState('paused');
          return;
        }
        if (e.code === 'KeyR') {
          e.preventDefault();
          startLevelBattle(selectedLevelRef.current);
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
        }
        engine.handleKeyDown(e.code);
      } else if (currentState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setCouncilOpen(false);
          engine.setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.code);
    };

    const handleBlur = () => {
      engine.clearInputs();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        engine.clearInputs();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      engine.stopLoop();
    };
  }, [handleBattleEnd, startLevelBattle]);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handlePurchaseHero = (heroId: HeroId) => {
    setSave((prev) => {
      const updated = purchaseHeroState(heroId, prev);
      if (updated !== prev) {
        soundEngine.playPurchase();
      }
      return updated;
    });
  };

  const handleSelectHero = (heroId: HeroId) => {
    soundEngine.playDeploy();
    setSave((prev) => ({
      ...prev,
      selectedHero: heroId,
    }));
  };

  const activeHero = HEROES[save.selectedHero];
  const activeLevelCfg = getLevelConfig(selectedLevel);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d0f14] select-none">
      {/* Isolated 60fps Canvas Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          onClick={(e) => engineRef.current?.handleCanvasClick(e.clientX, e.clientY)}
          className="block w-full h-full cursor-crosshair"
        />
      </div>

      {/* Title Screen Stage Overlay */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
          {/* Top Bar on Title Screen: Professional Ornate Royal Crest Plaque (Photo 3 Fix) & Audio Toggle (Photo 4 Fix: No Raylib Button) */}
          <div className="flex items-center justify-between gap-3">
            {/* Redesigned Professional Royal Matchup & Treasury Plaque */}
            <div
              className="p-0.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
            >
              <div
                className="px-3.5 py-1.5 rounded-[10px] border border-slate-900 flex flex-wrap items-center gap-2.5 sm:gap-3.5"
                style={{
                  background: 'linear-gradient(180deg, rgba(19, 28, 49, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
                }}
              >
                {/* Left Kingdom Crest */}
                <div className="flex items-center gap-1.5">
                  <CastleTowerShieldSvg className="w-6 h-7 shrink-0 drop-shadow" />
                  <span className="font-algerian text-xs sm:text-sm text-sky-300 tracking-wider">
                    CASTLE OF GAZA
                  </span>
                </div>

                {/* Ornate VS Medallion */}
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 border border-amber-200 font-georgia italic font-black text-[10px] text-slate-950 shadow">
                  VS
                </span>

                {/* Right Kingdom Crest */}
                <div className="flex items-center gap-1.5">
                  <span className="font-algerian text-xs sm:text-sm text-rose-400 tracking-wider">
                    CASTLE OF EPSTEIN
                  </span>
                  <DemonSkullShieldSvg className="w-6 h-7 shrink-0 drop-shadow" />
                </div>

                {/* Recessed Best Score Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d18] border border-amber-500/40 font-georgia text-xs text-amber-300 font-bold">
                  <HudIconSvg kind="crown" className="w-4 h-4 shrink-0" />
                  <span>Record:</span>
                  <span className="font-calibri font-black text-amber-200">{save.highScore}</span>
                </div>

                {/* Recessed Royal Treasury Coins Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d18] border border-amber-500/40 font-calibri text-xs text-amber-200 font-extrabold">
                  <HudIconSvg kind="gold" className="w-4 h-4 shrink-0" />
                  <span>{save.coins}</span>
                </div>
              </div>
            </div>

            {/* Top-Right Audio Control Only (Raylib C Code Button Removed per Photo 4) */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                onClick={handleToggleMute}
                className="w-10 h-10 rounded-xl bg-[#161f30] hover:bg-[#26354d] border-2 border-amber-400/80 flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              >
                <HudIconSvg kind={isMuted ? 'sound_off' : 'sound_on'} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top-Center SVG Title Lockup: CASTLE CLASH: HEROES VS BOSSES */}
          <div className="flex flex-col items-center text-center mt-1 max-w-xl mx-auto">
            <TitleCrestSvg className="w-full max-w-[490px] h-auto" />
            <p className="font-georgia italic text-xs sm:text-sm text-amber-100 font-bold tracking-wide hud-stroke">
              Realm {selectedLevel} of 20: {activeLevelCfg.name} ({activeLevelCfg.castleDistance}m) · Commander {activeHero.name}
            </p>
          </div>

          {/* Bottom-Center Glowing Orange BATTLE Button & HEROS & LEVELS Button */}
          <div className="flex flex-col items-center gap-2 mt-auto">
            <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
              <button
                type="button"
                data-start="true"
                onClick={() => startLevelBattle(selectedLevel)}
                className="px-10 py-3 rounded-xl bg-gradient-to-b from-amber-300 via-orange-500 to-amber-700 hover:from-amber-200 hover:to-orange-500 text-white font-algerian text-2xl tracking-widest uppercase shadow-2xl border-4 border-[#090a0f] ring-2 ring-amber-200 transition-transform active:scale-95 cursor-pointer hud-stroke"
              >
                BATTLE
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playDeploy();
                  setCouncilTab('levels');
                  setCouncilOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-[#1e293b]/95 hover:bg-[#334155] text-amber-200 font-algerian text-sm sm:text-base tracking-wider uppercase border-2 border-[#090a0f] ring-2 ring-amber-400/80 shadow-xl transition-colors cursor-pointer"
              >
                HEROES &amp; LEVELS
              </button>
            </div>

            {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
            <div className="text-center text-[11px] text-slate-200 font-calibri font-semibold tracking-wide hud-stroke">
              A/D Move Hero · Space Strike · 1–4 Deploy Mounted Army · 5–6 Upgrade Wall &amp; Cannons · Q Skill · E Dragon
            </div>
          </div>
        </div>
      )}

      {/* Active Gameplay Perimeter HUD */}
      {gameState === 'playing' && (
        <GameHud
          hud={hud}
          heroId={save.selectedHero}
          isMuted={isMuted}
          onDeployUnit={(type: UnitType) => engineRef.current?.deployUnit(type)}
          onUpgradeWall={() => engineRef.current?.upgradeWall()}
          onUpgradeTower={() => engineRef.current?.upgradeTower()}
          onTriggerHeroSkill={() => engineRef.current?.triggerHeroSkill()}
          onSummonDragon={() => engineRef.current?.summonPlayerDragon()}
          onHeroAttack={() => engineRef.current?.triggerManualHeroAttack()}
          onToggleMute={handleToggleMute}
          onPause={() => engineRef.current?.setGameState('paused')}
          onRestart={() => startLevelBattle(selectedLevel)}
        />
      )}

      {/* Pause / Victory / Defeat Status Modal */}
      <StatusModal
        gameState={gameState}
        snapshot={snapshot}
        currentLevel={selectedLevel}
        highScore={save.highScore}
        onResume={() => engineRef.current?.setGameState('playing')}
        onRestart={() => startLevelBattle(selectedLevel)}
        onNextLevel={() => {
          const nextLvl = Math.min(20, selectedLevel + 1);
          startLevelBattle(nextLvl);
        }}
        onOpenCouncil={(tab) => {
          setCouncilTab(tab);
          setCouncilOpen(true);
        }}
        onReturnTitle={() => {
          setCouncilOpen(false);
          engineRef.current?.setGameState('title');
        }}
      />

      {/* Heros & Levels Modal (Stepping-Stone Level Board & 5 Heroes) */}
      <CampaignHeroModal
        isOpen={councilOpen}
        initialTab={councilTab}
        save={save}
        selectedLevel={selectedLevel}
        onSelectLevel={(lvl) => setSelectedLevel(lvl)}
        onLaunchLevel={(lvl) => startLevelBattle(lvl)}
        onSelectHero={handleSelectHero}
        onPurchaseHero={handlePurchaseHero}
        onClose={() => setCouncilOpen(false)}
      />
    </main>
  );
}
