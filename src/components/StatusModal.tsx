import React from 'react';
import { CastleTowerShieldSvg, DemonSkullShieldSvg, HudIconSvg } from '../game/icons';
import { BattleSnapshot, GameState } from '../game/types';

interface StatusModalProps {
  gameState: GameState;
  snapshot: BattleSnapshot | null;
  currentLevel: number;
  highScore: number;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onOpenCouncil: (tab: 'levels' | 'heroes') => void;
  onReturnTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  gameState,
  snapshot,
  currentLevel,
  highScore,
  onResume,
  onRestart,
  onNextLevel,
  onOpenCouncil,
  onReturnTitle,
}) => {
  if (gameState !== 'paused' && gameState !== 'gameover') return null;

  if (gameState === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto select-none"
        style={{ backgroundColor: 'rgba(8, 11, 18, 0.82)', backdropFilter: 'blur(4px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Battle Paused"
      >
        <div className="p-0.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 shadow-[0_20px_50px_rgba(0,0,0,0.85)] w-full max-w-md">
          <div className="bg-gradient-to-b from-[#182238] via-[#111827] to-[#0b0f19] rounded-[14px] p-6 text-center border border-slate-900">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-700 border-2 border-amber-200 flex items-center justify-center shadow-lg mb-3">
              <HudIconSvg kind="pause" className="w-6 h-6" />
            </div>
            <h2 className="font-algerian text-2xl text-amber-300 tracking-wider">
              BATTLE PAUSED
            </h2>
            <p className="font-georgia italic text-xs text-slate-300 mt-1">
              Level {currentLevel} · Press Esc or P to resume command
            </p>

            <div className="mt-6 flex flex-col gap-2.5 font-calibri">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#7ccf35] to-[#4d9c16] hover:from-[#8ce342] hover:to-[#58b01a] border-2 border-[#d9f99d] text-white font-bold text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Resume Battle
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-100 border border-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Restart Level
              </button>
              <button
                type="button"
                onClick={() => onOpenCouncil('levels')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-amber-200 border border-amber-500/50 font-bold text-sm transition-colors cursor-pointer"
              >
                Map and Hero
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  const isVictory = snapshot.victory;
  const hasNextLevel = snapshot.level < 20;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto select-none"
      style={{ backgroundColor: 'rgba(8, 11, 18, 0.82)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={isVictory ? 'Victory Summary' : 'Defeat Summary'}
    >
      {/* Royal Ornate Outer Frame */}
      <div
        className={`p-1 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] w-full max-w-xl ${
          snapshot.isNewHighScore
            ? 'bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-700'
            : isVictory
              ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800'
              : 'bg-gradient-to-b from-rose-400 via-red-600 to-rose-950'
        }`}
      >
        <div className="bg-gradient-to-b from-[#19233a] via-[#111827] to-[#0a0e17] rounded-[14px] px-6 py-6 text-center border border-slate-950 relative overflow-hidden">
          {/* Top Royal Medallion Crest */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-xl mb-2.5 ${
                isVictory
                  ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-yellow-100'
                  : 'bg-gradient-to-b from-rose-500 to-rose-900 border-rose-300'
              }`}
            >
              {isVictory ? (
                <HudIconSvg kind="crown" className="w-8 h-8" />
              ) : (
                <DemonSkullShieldSvg className="w-8 h-9" />
              )}
            </div>

            {/* Celebratory High Score Banner */}
            {snapshot.isNewHighScore && (
              <div className="mb-2 py-1 px-4 rounded-full bg-amber-500/20 border border-amber-300 text-amber-200 font-calibri text-xs font-extrabold tracking-widest uppercase shadow">
                ★ New Kingdom Record Score! ★
              </div>
            )}

            <h2
              className={`font-algerian text-2xl sm:text-3xl tracking-wider uppercase drop-shadow-[0_3px_4px_rgba(0,0,0,0.85)] ${
                isVictory ? 'text-amber-300' : 'text-rose-400'
              }`}
            >
              {isVictory ? 'CASTLE OF EPSTEIN CAPTURED!' : 'CASTLE OF GAZA FALLEN'}
            </h2>

            {/* Level Subtitle & Illuminated Star Ribbon */}
            <div className="mt-2 inline-flex items-center gap-3 px-4 py-1 rounded-full bg-[#0b101d] border border-slate-700/80 shadow-inner">
              <CastleTowerShieldSvg className="w-4 h-5 shrink-0" />
              <span className="font-georgia italic text-xs sm:text-sm text-amber-100 font-bold">
                Level {snapshot.level}: {snapshot.levelName}
              </span>
              {isVictory && (
                <span className="flex items-center gap-0.5 text-amber-400 text-base leading-none">
                  {[1, 2, 3].map((starIdx) => (
                    <span
                      key={starIdx}
                      className={
                        starIdx <= snapshot.starsEarned
                          ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'text-slate-600'
                      }
                    >
                      ★
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* 3 Beveled Royal Stat Cards */}
          <div className="grid grid-cols-3 gap-3 mt-5 font-calibri">
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-slate-700/90 shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                {isVictory ? 'Clear Time' : 'Enemy Castle'}
              </div>
              <div className="font-mono-num text-2xl font-black text-white mt-1">
                {isVictory ? `${snapshot.clearTimeSeconds}s` : `${snapshot.enemyCastleHpPct}%`}
              </div>
              <div className="text-[11px] text-slate-300 mt-1 font-medium">
                {isVictory
                  ? `Castle HP: ${snapshot.playerCastleHpPct}%`
                  : `${snapshot.enemiesDefeated} Defeated`}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-amber-500/40 shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Battle Score
              </div>
              <div className="font-mono-num text-2xl font-black text-amber-300 mt-1">
                {snapshot.score}
              </div>
              <div className="text-[11px] text-amber-200/80 mt-1 font-medium">
                Best: {Math.max(highScore, snapshot.score)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-emerald-500/40 shadow-md">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Royal Bounty
              </div>
              <div className="font-mono-num text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <HudIconSvg kind="gold" className="w-5 h-5 shrink-0" />
                <span>+{snapshot.coinsEarned}</span>
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-1 font-medium">
                Coins Earned
              </div>
            </div>
          </div>

          {/* Tactical Strategy Tip (Explains how smarter tactics win tough levels) */}
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-[#0d1322] border border-sky-500/30 text-left flex items-center gap-2.5 font-calibri">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/50 text-sky-300 font-bold text-[10px] uppercase shrink-0">
              Tactics
            </span>
            <p className="text-xs text-slate-300 leading-snug">
              <strong className="text-amber-300">Paladins [3]</strong> crush mounted Chargers &amp; break Shields,{' '}
              <strong className="text-sky-300">Archers [2]</strong> fire 25% faster behind{' '}
              <strong className="text-emerald-300">Squires [1]</strong>, and timed{' '}
              <strong className="text-amber-200">Hero Strikes [Space]</strong> stun Bosses!
            </p>
          </div>

          {/* 3 Professional Action Buttons: Next Level, Map and Hero, Home */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 font-calibri">
            {isVictory && hasNextLevel ? (
              <button
                type="button"
                data-start="true"
                onClick={onNextLevel}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 hover:from-amber-200 hover:to-orange-500 border-2 border-yellow-100 text-slate-950 font-algerian text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Next Level
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 hover:from-amber-200 hover:to-orange-500 border-2 border-yellow-100 text-slate-950 font-algerian text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                {isVictory ? 'Play Again' : 'Retry Level'}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenCouncil('levels')}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-b from-[#26354d] to-[#162032] hover:from-[#324563] hover:to-[#1e2b42] text-amber-200 border-2 border-amber-400/70 font-algerian text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Map and Hero
            </button>

            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-3 px-3 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] hover:from-[#29374f] hover:to-[#172238] text-slate-100 border-2 border-slate-500 font-algerian text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
