import React, { useState } from 'react';
import { HEROES, HERO_ORDER, LEVELS, canPurchaseHero } from '../game/rules';
import { HudIconSvg } from '../game/icons';
import { HeroId, SaveProgress } from '../game/types';

interface CampaignHeroModalProps {
  isOpen: boolean;
  initialTab?: 'levels' | 'heroes';
  save: SaveProgress;
  selectedLevel: number;
  onSelectLevel: (level: number) => void;
  onLaunchLevel: (level: number) => void;
  onSelectHero: (heroId: HeroId) => void;
  onPurchaseHero: (heroId: HeroId) => void;
  onClose: () => void;
}

export const CampaignHeroModal: React.FC<CampaignHeroModalProps> = ({
  isOpen,
  initialTab = 'levels',
  save,
  selectedLevel,
  onSelectLevel,
  onLaunchLevel,
  onSelectHero,
  onPurchaseHero,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'heroes'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const activeLevelCfg = LEVELS.find((l) => l.level === selectedLevel) || LEVELS[0];

  // Arrange the 20 levels into a winding serpentine board (4 rows of 5 tiles)
  const serpentineRows = [
    [1, 2, 3, 4, 5],
    [10, 9, 8, 7, 6],
    [11, 12, 13, 14, 15],
    [20, 19, 18, 17, 16],
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 pointer-events-auto select-none"
      style={{ backgroundColor: 'rgba(9, 10, 15, 0.86)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Heroes and Levels"
    >
      <div className="w-full max-w-4xl bg-[#3b200d] border-4 border-[#d99b26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar (Matches Photo 2: Left Home Button, Center Title & Tabs, Right Coins) */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b-2 border-[#8c581c]"
          style={{
            background: 'linear-gradient(180deg, #4f2c12 0%, #2e1808 100%)',
          }}
        >
          {/* Prominent Home Button to Return to Home UI */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Home"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#6e3f19] hover:bg-[#874f21] border-2 border-[#e8b944] text-amber-100 font-calibri font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span>Home</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#f3c65f] to-[#b57c1e] border-2 border-[#fff3c4] shadow flex items-center justify-center font-algerian text-base text-[#3b200d]">
                {save.highestUnlockedLevel}
              </div>
              <h2 className="font-algerian text-lg sm:text-xl text-white tracking-wider drop-shadow">
                HEROES &amp; LEVELS
              </h2>
            </div>
          </div>

          {/* Center Tab Switcher: LEVELS vs HEROES */}
          <div className="flex items-center gap-1.5 p-1 bg-[#241205] rounded-xl border border-[#8c581c] font-calibri">
            <button
              type="button"
              onClick={() => setActiveTab('levels')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'levels'
                  ? 'bg-gradient-to-b from-[#7ccf35] to-[#4d9c16] text-white shadow'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              LEVELS (1–20)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('heroes')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'heroes'
                  ? 'bg-gradient-to-b from-[#f59e0b] to-[#b45309] text-white shadow'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              HEROES (5)
            </button>
          </div>

          {/* Right Coin Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#241205] border border-[#d99b26] text-amber-300 font-calibri text-sm font-bold">
            <HudIconSvg kind="gold" className="w-4 h-4 shrink-0" />
            <span>{save.coins} Coins</span>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'levels' ? (
          <div
            className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-between relative"
            style={{
              backgroundColor: '#5c3317',
              backgroundImage: `
                linear-gradient(45deg, #4e2a12 25%, transparent 25%),
                linear-gradient(-45deg, #4e2a12 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #4e2a12 75%),
                linear-gradient(-45deg, transparent 75%, #4e2a12 75%)
              `,
              backgroundSize: '64px 64px',
              backgroundPosition: '0 0, 0 32px, 32px -32px, -32px 0',
            }}
          >
            {/* 3D Stepping-Stone Tile Board (Matches Photo 2: Green Checkmark Tiles, 3D Green Pawn, Golden Numbered Tiles) */}
            <div className="flex flex-col gap-5 sm:gap-6 items-center my-auto py-2">
              {serpentineRows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid grid-cols-5 gap-3 sm:gap-6 w-full max-w-2xl place-items-center"
                >
                  {row.map((lvlNum) => {
                    const isUnlocked = lvlNum <= save.highestUnlockedLevel;
                    const isCompleted =
                      lvlNum < save.highestUnlockedLevel || (save.levelStars[lvlNum] || 0) > 0;
                    const isSelected = lvlNum === selectedLevel;

                    return (
                      <button
                        key={lvlNum}
                        type="button"
                        onClick={() => {
                          if (isUnlocked) {
                            onSelectLevel(lvlNum);
                          }
                        }}
                        onDoubleClick={() => {
                          if (isUnlocked) {
                            onSelectLevel(lvlNum);
                            onLaunchLevel(lvlNum);
                          }
                        }}
                        disabled={!isUnlocked}
                        aria-label={`Level ${lvlNum}`}
                        className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-2xl transition-transform flex items-center justify-center ${
                          isUnlocked
                            ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0.5'
                            : 'cursor-not-allowed opacity-85'
                        }`}
                      >
                        {/* 3D Tile Base / Bevel Shadow */}
                        <div
                          className={`w-full h-full rounded-2xl border-2 flex items-center justify-center shadow-xl ${
                            isCompleted
                              ? 'bg-gradient-to-b from-[#84db3b] to-[#4d9c16] border-[#b8f77e] shadow-[0_7px_0_#2d6307,0_12px_18px_rgba(0,0,0,0.45)]'
                              : isUnlocked
                                ? 'bg-gradient-to-b from-[#f5c148] to-[#b87e14] border-[#fde68a] shadow-[0_7px_0_#784d06,0_12px_18px_rgba(0,0,0,0.45)]'
                                : 'bg-gradient-to-b from-[#b07d2b] to-[#754f12] border-[#d4a34a] shadow-[0_7px_0_#4a3006,0_10px_15px_rgba(0,0,0,0.45)]'
                          } ${isSelected ? 'ring-4 ring-white scale-105' : ''}`}
                        >
                          {/* Inner Recessed Tile Top Surface (Like Photo 2) */}
                          <div
                            className={`w-[76%] h-[74%] rounded-xl flex items-center justify-center border ${
                              isCompleted
                                ? 'bg-[#65b822] border-[#9ef059]'
                                : isUnlocked
                                  ? 'bg-[#8c5a0b] border-[#f7cf68]'
                                  : 'bg-[#694309] border-[#b8862d]'
                            }`}
                          >
                            {isCompleted ? (
                              /* Bold White Checkmark (✓) for Completed Levels */
                              <svg
                                viewBox="0 0 24 24"
                                className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              /* Bold White Level Number Only (8, 9, 10, 11...) */
                              <span className="font-calibri font-black text-xl sm:text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)]">
                                {lvlNum}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3D Green Chess Pawn Token Standing on the Selected Level (Matches Photo 2!) */}
                        {isSelected && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-[0_5px_6px_rgba(0,0,0,0.65)] animate-bounce">
                            <svg viewBox="0 0 44 56" className="w-9 h-11 sm:w-10 sm:h-12">
                              <ellipse cx="22" cy="50" rx="16" ry="5" fill="#255407" />
                              <path
                                d="M10 48 C10 36, 16 32, 18 24 L26 24 C28 32, 34 36, 34 48 Z"
                                fill="#5bb318"
                                stroke="#1e4606"
                                strokeWidth="2.5"
                              />
                              <ellipse
                                cx="22"
                                cy="23"
                                rx="9"
                                ry="3.5"
                                fill="#7ccf35"
                                stroke="#1e4606"
                                strokeWidth="2"
                              />
                              <circle
                                cx="22"
                                cy="13"
                                r="8.5"
                                fill="#7ccf35"
                                stroke="#1e4606"
                                strokeWidth="2.5"
                              />
                              <circle cx="19" cy="10" r="2.5" fill="#bef264" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Selected Level Action Bar */}
            <div className="mt-4 pt-3 border-t-2 border-[#8c581c] flex flex-wrap items-center justify-between gap-3 bg-[#361c0a]/95 px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-[#7ccf35] text-[#1a3803] font-algerian text-sm font-bold">
                  LEVEL {activeLevelCfg.level}
                </span>
                <div>
                  <div className="font-georgia font-bold text-amber-200 text-sm">
                    {activeLevelCfg.name}
                  </div>
                  <div className="font-calibri text-xs text-amber-100/75">
                    Castle Distance: {activeLevelCfg.castleDistance}m · Reward: +{activeLevelCfg.baseCoinReward} Coins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#5c3317] hover:bg-[#73411e] border border-[#d99b26] text-amber-100 font-calibri font-bold text-xs sm:text-sm cursor-pointer"
                >
                  ← Home
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchLevel(selectedLevel)}
                  className="px-6 py-2 rounded-lg bg-gradient-to-b from-[#7ccf35] to-[#4d9c16] hover:from-[#8ce342] hover:to-[#58b01a] border-2 border-[#d9f99d] text-white font-algerian text-sm sm:text-base tracking-wider shadow-lg cursor-pointer"
                >
                  PLAY LEVEL {selectedLevel}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* HEROS Tab */
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#291507]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HERO_ORDER.map((heroId) => {
                const hero = HEROES[heroId];
                const isUnlocked = save.unlockedHeroes.includes(heroId);
                const isEquipped = save.selectedHero === heroId;
                const affordable = canPurchaseHero(heroId, save);

                return (
                  <div
                    key={hero.id}
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-[#42230d] border-[#7ccf35] shadow-lg'
                        : 'bg-[#361c0a] border-[#8c581c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-slate-950 font-algerian font-bold text-slate-950"
                            style={{ backgroundColor: hero.primaryColor }}
                          >
                            {hero.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-algerian text-base text-amber-100">
                              {hero.name}
                            </h3>
                            <p className="font-georgia italic text-xs text-amber-300/90">
                              {hero.title}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-calibri font-bold px-2 py-0.5 rounded bg-[#241205] text-amber-200">
                          {hero.isRanged ? 'Ranged' : 'Melee'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#5c3317] text-xs text-amber-100/90 space-y-1.5 font-calibri">
                        <div className="flex items-center justify-between font-bold text-amber-200">
                          <span>HP: {hero.maxHp}</span>
                          <span>·</span>
                          <span>DMG: {hero.damage}</span>
                          <span>·</span>
                          <span>SPD: {hero.moveSpeed}</span>
                        </div>
                        <p className="text-amber-300 font-bold pt-1">
                          Power [Q]: {hero.skillName} ({hero.skillCooldown}s)
                        </p>
                        <p className="font-georgia text-amber-100/75 leading-relaxed">
                          {hero.skillDescription}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#5c3317] flex items-center justify-between font-calibri">
                      {isUnlocked ? (
                        <>
                          <span className="text-xs text-[#84db3b] font-bold">
                            {isEquipped ? '✓ Equipped Hero' : 'Unlocked'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectHero(hero.id)}
                            disabled={isEquipped}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isEquipped
                                ? 'bg-[#4d9c16]/30 text-[#a3e635] border border-[#7ccf35]/40 cursor-default'
                                : 'bg-gradient-to-b from-[#f59e0b] to-[#b45309] text-white cursor-pointer'
                            }`}
                          >
                            {isEquipped ? 'Selected' : 'Select Hero'}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                            <HudIconSvg kind="gold" className="w-4 h-4" />
                            <span>{hero.cost} Coins</span>
                          </div>
                          <button
                            type="button"
                            disabled={!affordable}
                            onClick={() => onPurchaseHero(hero.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              affordable
                                ? 'bg-gradient-to-b from-[#7ccf35] to-[#4d9c16] text-white cursor-pointer'
                                : 'bg-[#241205] text-amber-200/40 cursor-not-allowed'
                            }`}
                          >
                            {affordable ? `Buy (${hero.cost})` : 'Locked'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
