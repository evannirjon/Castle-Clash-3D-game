import React from 'react';
import { ALLY_UNITS, HEROES, getTowerUpgradeCost, getWallUpgradeCost } from '../game/rules';
import {
  CastleTowerShieldSvg,
  DemonSkullShieldSvg,
  EnemyFlagSvg,
  HudIconSvg,
} from '../game/icons';
import { HeroId, LiveHudState, UnitType } from '../game/types';

interface GameHudProps {
  hud: LiveHudState;
  heroId: HeroId;
  isMuted: boolean;
  onDeployUnit: (type: UnitType) => void;
  onUpgradeWall: () => void;
  onUpgradeTower: () => void;
  onTriggerHeroSkill: () => void;
  onSummonDragon: () => void;
  onHeroAttack: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
}

const UNIT_KEYS: Array<{ type: UnitType; shortLabel: string; icon: 'sword' | 'bow' | 'knight' | 'catapult' }> = [
  { type: 'swordsman', shortLabel: 'Squire', icon: 'sword' },
  { type: 'archer', shortLabel: 'Archer', icon: 'bow' },
  { type: 'knight', shortLabel: 'Paladin', icon: 'knight' },
  { type: 'siege', shortLabel: 'Catapult', icon: 'catapult' },
];

function formatTimerClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  heroId,
  isMuted,
  onDeployUnit,
  onUpgradeWall,
  onUpgradeTower,
  onTriggerHeroSkill,
  onSummonDragon,
  onHeroAttack,
  onToggleMute,
  onPause,
  onRestart,
}) => {
  const hero = HEROES[heroId];
  const playerHpPct = Math.max(0, Math.min(100, (hud.playerCastleHp / Math.max(1, hud.playerCastleMaxHp)) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (hud.enemyCastleHp / Math.max(1, hud.enemyCastleMaxHp)) * 100));

  const wallCost = getWallUpgradeCost(hud.wallLevel);
  const towerCost = getTowerUpgradeCost(hud.towerLevel);

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 select-none z-20">
      {/* Clean Non-Overlapping Top Battle Header (No Boss Icon Clutter) */}
      <div className="flex items-start justify-between gap-1.5 w-full">
        {/* Left: Castle of Gaza Shield + Blue Health Bar + Utility Controls */}
        <div className="flex flex-col items-start gap-1 shrink-0">
          <div className="flex items-center">
            <div className="z-10 -mr-2 drop-shadow-lg">
              <CastleTowerShieldSvg className="w-8 h-9 sm:w-9 sm:h-10" />
            </div>
            <div className="pl-3 pr-2.5 py-1 rounded-r-md bg-[#161f30]/95 border-2 border-[#090a0f] shadow-lg w-[165px] sm:w-[205px]">
              <div className="flex items-center justify-between text-[10px] tracking-wider uppercase text-sky-300">
                <span className="font-algerian">Castle of Gaza</span>
                <span className="font-mono-num font-bold text-[10px] text-white">
                  {hud.playerCastleHp}/{hud.playerCastleMaxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#090a0f] rounded-sm overflow-hidden border border-slate-700 mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 origin-left"
                  style={{ transform: `scaleX(${playerHpPct / 100})` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5 font-calibri">
                <span className="truncate font-georgia italic text-sky-200">{hero.name}</span>
                <span className="text-amber-300 font-bold">
                  {hud.heroHp > 0 ? `HP ${hud.heroHp}` : 'Respawn'} · W.{hud.wallLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Left Utility Controls (Pause, Restart, Mute) */}
          <div className="flex items-center gap-1 pointer-events-auto pl-1">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Battle [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-7 h-7 rounded bg-[#293548] hover:bg-[#3b4c66] border-2 border-[#090a0f] shadow flex items-center justify-center transition-colors cursor-pointer"
            >
              <HudIconSvg kind="pause" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Battle [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-7 h-7 rounded bg-[#293548] hover:bg-[#3b4c66] border-2 border-[#090a0f] shadow flex items-center justify-center transition-colors cursor-pointer"
            >
              <HudIconSvg kind="restart" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-7 h-7 rounded bg-[#293548] hover:bg-[#3b4c66] border-2 border-[#090a0f] shadow flex items-center justify-center transition-colors cursor-pointer"
            >
              <HudIconSvg kind={isMuted ? 'sound_off' : 'sound_on'} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Clean Compact Clock + Gold + Realm & Distance Plaque (No Boss Head Icons) */}
        <div className="flex flex-col items-center min-w-0 shrink">
          <div className="px-3 py-1 rounded-lg bg-[#161f30]/95 border-2 border-[#090a0f] shadow-xl flex items-center gap-2.5">
            <span className="font-mono-num text-sm sm:text-base font-black text-white tracking-wider">
              {formatTimerClock(hud.elapsedSeconds)}
            </span>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <div className="flex items-center gap-1 font-calibri">
              <HudIconSvg kind="gold" className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono-num text-xs sm:text-sm font-extrabold text-amber-300">
                {hud.battleGold}
              </span>
              <span className="text-[10px] font-mono-num text-amber-400">
                +{hud.goldRate}/s
              </span>
            </div>
            <span className="text-slate-600 hidden md:inline" aria-hidden="true">|</span>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-calibri">
              <span className="font-georgia text-amber-200 font-bold">
                Realm {hud.level} ({hud.castleDistance}m)
              </span>
              <span className="text-slate-300 font-mono-num">
                Score <strong className="text-white">{hud.score}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Castle of Epstein Red Health Bar + Enemy Flag + Demon Skull Shield */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center">
            <div className="pl-2.5 pr-3 py-1 rounded-l-md bg-[#161f30]/95 border-2 border-[#090a0f] shadow-lg w-[170px] sm:w-[210px]">
              <div className="flex items-center justify-between text-[10px] tracking-wider uppercase text-rose-400">
                <span className="flex items-center gap-1">
                  <EnemyFlagSvg className="w-4 h-3 shrink-0" />
                  <span className="font-algerian">Castle of Epstein</span>
                </span>
                <span className="font-mono-num font-bold text-[10px] text-white">
                  {hud.enemyCastleHp}/{hud.enemyCastleMaxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#090a0f] rounded-sm overflow-hidden border border-slate-700 mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 origin-right ml-auto"
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5 font-calibri">
                <span className="truncate font-georgia italic text-rose-300">{hud.featuredEnemyName}</span>
                <span>T.{hud.towerLevel}</span>
              </div>
            </div>
            <div className="z-10 -ml-2 drop-shadow-lg">
              <DemonSkullShieldSvg className="w-8 h-9 sm:w-9 sm:h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Enemy Dragon Telegraph Banner (only appears 3s before an aerial dragon raid) */}
      {hud.enemyDragonWarning > 0 && (
        <div className="self-center px-3.5 py-1 rounded bg-rose-950/95 border border-rose-500 text-rose-200 font-algerian text-xs tracking-wider uppercase shadow-lg">
          Warning: Enemy Dragon Raid in {hud.enemyDragonWarning.toFixed(1)}s!
        </div>
      )}

      {/* Compact Bottom Deploy Bar — All 9 Force & Command Buttons Visible Simultaneously in 1 Tight Row */}
      <div className="flex items-end justify-center w-full">
        <div
          className="px-1.5 py-1 rounded-xl border-2 border-[#090a0f] shadow-2xl grid grid-cols-9 gap-1 w-full max-w-[920px] pointer-events-auto font-calibri"
          style={{ backgroundColor: 'rgba(18, 24, 38, 0.95)' }}
        >
          {/* 4 Deployable Mounted/Siege Units */}
          {UNIT_KEYS.map(({ type, shortLabel, icon }) => {
            const cfg = ALLY_UNITS[type];
            const cd = hud.unitCooldowns[type] || 0;
            const canAfford = hud.battleGold >= cfg.cost && cd <= 0;

            return (
              <button
                key={type}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onDeployUnit(type);
                }}
                disabled={!canAfford}
                className={`relative px-1.5 py-1 rounded-md border text-left transition-transform active:scale-95 cursor-pointer min-w-0 ${
                  canAfford
                    ? 'bg-[#1e293b] hover:bg-[#334155] border-cyan-400 text-white shadow-sm'
                    : 'bg-[#0f172a] border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
                  <span className="flex items-center gap-1 truncate">
                    <HudIconSvg kind={icon} className="w-3 h-3 shrink-0" />
                    <span className="truncate">{shortLabel}</span>
                  </span>
                  <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-cyan-300 shrink-0">
                    {cfg.shortcutKey}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono-num mt-0.5 leading-tight">
                  <span className={hud.battleGold >= cfg.cost ? 'text-amber-300 font-bold' : 'text-rose-400'}>
                    {cfg.cost}g
                  </span>
                  <span className="text-slate-200 font-bold">
                    {cd > 0 ? `${cd.toFixed(1)}s` : 'Ready'}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Wall Upgrade [5] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onUpgradeWall();
            }}
            disabled={hud.wallLevel >= 5 || hud.battleGold < wallCost}
            className={`px-1.5 py-1 rounded-md border text-left transition-transform active:scale-95 cursor-pointer min-w-0 ${
              hud.wallLevel < 5 && hud.battleGold >= wallCost
                ? 'bg-[#1e293b] hover:bg-[#334155] border-sky-400 text-slate-100'
                : 'bg-[#0f172a] border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
              <span className="flex items-center gap-1 truncate">
                <HudIconSvg kind="wall" className="w-3 h-3 shrink-0" />
                <span className="truncate">Wall</span>
              </span>
              <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-sky-300 shrink-0">
                5
              </span>
            </div>
            <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono-num mt-0.5 leading-tight">
              <span className="text-slate-400">Lv.{hud.wallLevel}</span>
              <span className="text-amber-300 font-bold">
                {hud.wallLevel >= 5 ? 'MAX' : `${wallCost}g`}
              </span>
            </div>
          </button>

          {/* Cannons Upgrade [6] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onUpgradeTower();
            }}
            disabled={hud.towerLevel >= 5 || hud.battleGold < towerCost}
            className={`px-1.5 py-1 rounded-md border text-left transition-transform active:scale-95 cursor-pointer min-w-0 ${
              hud.towerLevel < 5 && hud.battleGold >= towerCost
                ? 'bg-[#1e293b] hover:bg-[#334155] border-sky-400 text-slate-100'
                : 'bg-[#0f172a] border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
              <span className="flex items-center gap-1 truncate">
                <HudIconSvg kind="tower" className="w-3 h-3 shrink-0" />
                <span className="truncate">Cannon</span>
              </span>
              <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-sky-300 shrink-0">
                6
              </span>
            </div>
            <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono-num mt-0.5 leading-tight">
              <span className="text-slate-400">Lv.{hud.towerLevel}</span>
              <span className="text-amber-300 font-bold">
                {hud.towerLevel >= 5 ? 'MAX' : `${towerCost}g`}
              </span>
            </div>
          </button>

          {/* Hero Strike [Space] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onHeroAttack();
            }}
            className="px-1.5 py-1 rounded-md border bg-[#1e293b] hover:bg-[#334155] border-slate-500 text-slate-100 text-left transition-transform active:scale-95 cursor-pointer min-w-0"
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
              <span className="truncate">Strike</span>
              <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-amber-300 shrink-0">
                Spc
              </span>
            </div>
            <div className="text-[9px] font-mono-num text-cyan-300 mt-0.5 leading-tight truncate">
              A/D Move
            </div>
          </button>

          {/* Hero Power [Q] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerHeroSkill();
            }}
            disabled={hud.heroSkillCooldown > 0 || hud.heroHp <= 0}
            className={`px-1.5 py-1 rounded-md border text-left transition-transform active:scale-95 cursor-pointer min-w-0 ${
              hud.heroSkillCooldown <= 0 && hud.heroHp > 0
                ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-400 text-amber-100'
                : 'bg-[#0f172a] border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
              <span className="flex items-center gap-1 truncate">
                <HudIconSvg kind="skill" className="w-3 h-3 shrink-0" />
                <span className="truncate">Power</span>
              </span>
              <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-amber-300 shrink-0">
                Q
              </span>
            </div>
            <div className="text-[9px] font-mono-num mt-0.5 font-bold text-amber-300 leading-tight truncate">
              {hud.heroSkillCooldown > 0 ? `${hud.heroSkillCooldown.toFixed(1)}s` : 'READY'}
            </div>
          </button>

          {/* Summon Dragon [E] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onSummonDragon();
            }}
            disabled={hud.dragonCooldown > 0 || hud.dragonActive}
            className={`px-1.5 py-1 rounded-md border text-left transition-transform active:scale-95 cursor-pointer min-w-0 ${
              hud.dragonCooldown <= 0 && !hud.dragonActive
                ? 'bg-purple-950/90 hover:bg-purple-900 border-purple-400 text-purple-100'
                : 'bg-[#0f172a] border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] font-bold leading-tight">
              <span className="flex items-center gap-1 truncate">
                <HudIconSvg kind="dragon" className="w-3 h-3 shrink-0" />
                <span className="truncate">Dragon</span>
              </span>
              <span className="px-1 rounded bg-[#090a0f] font-mono-num text-[9px] text-purple-300 shrink-0">
                E
              </span>
            </div>
            <div className="text-[9px] font-mono-num mt-0.5 font-bold text-purple-300 leading-tight truncate">
              {hud.dragonActive
                ? 'ACTIVE'
                : hud.dragonCooldown > 0
                  ? `${hud.dragonCooldown.toFixed(1)}s`
                  : 'SUMMON'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
