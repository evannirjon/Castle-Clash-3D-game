export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type HeroId = 'roland' | 'lyra' | 'thane' | 'seraphina' | 'malakor';

export type UnitType = 'swordsman' | 'archer' | 'knight' | 'siege';

export type EnemyBehaviorPolicy =
  | 'swarmer'
  | 'kiter'
  | 'charger'
  | 'shielded'
  | 'aerial'
  | 'siege_telegraph';

export type BiomeTheme = 'dawn' | 'autumn' | 'frost' | 'ember' | 'obsidian';

export interface HeroConfig {
  id: HeroId;
  name: string;
  title: string;
  cost: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  moveSpeed: number;
  isRanged: boolean;
  isMounted: boolean;
  skillName: string;
  skillDescription: string;
  skillCooldown: number;
  primaryColor: string;
  accentColor: string;
  capeColor: string;
  steedColor: string;
}

export interface UnitConfig {
  type: UnitType;
  name: string;
  roleLabel: string;
  shortcutKey: string;
  cost: number;
  cooldown: number;
  maxHp: number;
  damage: number;
  range: number;
  attackSpeed: number;
  moveSpeed: number;
  armor: number;
  isMounted?: boolean;
  isSiege?: boolean;
  isRanged?: boolean;
  splashRadius?: number;
  color: string;
  steedColor?: string;
}

export interface EnemyTierConfig {
  tier: number; // 1 to 20 (unlocked at Level = tier)
  id: string;
  name: string;
  title: string;
  behaviorPolicy: EnemyBehaviorPolicy;
  maxHp: number;
  damage: number;
  range: number;
  attackSpeed: number;
  moveSpeed: number;
  armor: number;
  goldDrop: number;
  scoreValue: number;
  windupDuration: number;
  isMounted: boolean;
  isBossFace: boolean;
  bossPortraitUrl: string;
  scale: number;
  primaryColor: string;
  secondaryColor: string;
  steedColor?: string;
  helmStyle: 'hood' | 'horned' | 'crown' | 'skull' | 'plate' | 'wyvern';
  weaponStyle: 'sword' | 'spear' | 'axe' | 'mace' | 'crossbow' | 'staff' | 'catapult' | 'halberd';
}

export interface LevelConfig {
  level: number;
  name: string;
  subtitle: string;
  biome: BiomeTheme;
  battlefieldWidth: number;
  castleDistance: number;
  playerCastleHp: number;
  enemyCastleHp: number;
  startingGold: number;
  goldPerSecond: number;
  spawnInterval: number;
  enemyStatMultiplier: number;
  unlockedEnemyTiers: number[]; // Cumulative 1..level
  featuredEnemy: EnemyTierConfig; // The new powerful boss face introduced on this level
  coBossEnemy: EnemyTierConfig; // The second cartoon boss commander accompanying on this level
  hasEnemyDragon: boolean;
  enemyDragonInterval: number;
  baseCoinReward: number;
  parTimeSeconds: number;
}

export interface SaveProgress {
  coins: number;
  highestUnlockedLevel: number;
  selectedHero: HeroId;
  unlockedHeroes: HeroId[];
  highScore: number;
  levelScores: Record<number, number>;
  levelStars: Record<number, number>;
}

export interface BattleSnapshot {
  victory: boolean;
  level: number;
  levelName: string;
  clearTimeSeconds: number;
  score: number;
  previousBestScore: number;
  isNewHighScore: boolean;
  coinsEarned: number;
  enemiesDefeated: number;
  playerCastleHpPct: number;
  enemyCastleHpPct: number;
  starsEarned: number;
}

export interface LiveHudState {
  level: number;
  levelName: string;
  castleDistance: number;
  featuredEnemyName: string;
  featuredEnemyTitle: string;
  featuredBossPortraitUrl: string;
  secondaryBossPortraitUrl: string;
  battleGold: number;
  goldRate: number;
  score: number;
  highScore: number;
  elapsedSeconds: number;
  playerCastleHp: number;
  playerCastleMaxHp: number;
  enemyCastleHp: number;
  enemyCastleMaxHp: number;
  heroHp: number;
  heroMaxHp: number;
  heroSkillCooldown: number;
  heroSkillMaxCooldown: number;
  dragonCooldown: number;
  dragonMaxCooldown: number;
  dragonActive: boolean;
  enemyDragonWarning: number;
  wallLevel: number;
  towerLevel: number;
  unitCooldowns: Record<UnitType, number>;
  unitMaxCooldowns: Record<UnitType, number>;
}
