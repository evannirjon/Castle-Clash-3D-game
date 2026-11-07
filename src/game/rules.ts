import {
  BiomeTheme,
  EnemyBehaviorPolicy,
  EnemyTierConfig,
  HeroConfig,
  HeroId,
  LevelConfig,
  SaveProgress,
  UnitConfig,
  UnitType,
} from './types';

export const HEROES: Record<HeroId, HeroConfig> = {
  roland: {
    id: 'roland',
    name: 'Sir Roland',
    title: 'Paladin of the Dawn',
    cost: 0,
    maxHp: 820,
    damage: 66,
    attackRange: 76,
    attackCooldown: 0.62,
    moveSpeed: 195,
    isRanged: false,
    isMounted: true,
    skillName: 'Solar Judgement',
    skillDescription: 'Smites nearby foes for 240 damage and heals allied troops for 150 HP.',
    skillCooldown: 10,
    primaryColor: '#eab308',
    accentColor: '#fef08a',
    capeColor: '#1d4ed8',
    steedColor: '#f8fafc',
  },
  lyra: {
    id: 'lyra',
    name: 'Lyra Sunbow',
    title: 'Outrider of Silverwood',
    cost: 280,
    maxHp: 680,
    damage: 58,
    attackRange: 285,
    attackCooldown: 0.46,
    moveSpeed: 225,
    isRanged: true,
    isMounted: true,
    skillName: 'Starfall Volley',
    skillDescription: 'Rains 14 piercing sun-arrows across the battlefield dealing heavy area damage.',
    skillCooldown: 9,
    primaryColor: '#10b981',
    accentColor: '#a7f3d0',
    capeColor: '#065f46',
    steedColor: '#d97706',
  },
  thane: {
    id: 'thane',
    name: 'Thane Ironhelm',
    title: 'Runelord of Anvilpeak',
    cost: 620,
    maxHp: 1180,
    damage: 88,
    attackRange: 80,
    attackCooldown: 0.72,
    moveSpeed: 182,
    isRanged: false,
    isMounted: true,
    skillName: 'Earthshaker Slam',
    skillDescription: 'Shatters the ground, stunning enemy ranks for 2.8s and dealing 310 crush damage.',
    skillCooldown: 11,
    primaryColor: '#f97316',
    accentColor: '#fed7aa',
    capeColor: '#7c2d12',
    steedColor: '#57534e',
  },
  seraphina: {
    id: 'seraphina',
    name: 'Archmage Seraphina',
    title: 'High Pyromancer',
    cost: 1050,
    maxHp: 780,
    damage: 82,
    attackRange: 295,
    attackCooldown: 0.56,
    moveSpeed: 205,
    isRanged: true,
    isMounted: true,
    skillName: 'Cataclysm Meteor',
    skillDescription: 'Calls down blazing meteors that scorch enemies and enemy fortifications for 420 damage.',
    skillCooldown: 11,
    primaryColor: '#ec4899',
    accentColor: '#fbcfe8',
    capeColor: '#831843',
    steedColor: '#312e81',
  },
  malakor: {
    id: 'malakor',
    name: 'Malakor Dragonlord',
    title: 'Sovereign of the Wyrm',
    cost: 1650,
    maxHp: 1480,
    damage: 115,
    attackRange: 92,
    attackCooldown: 0.58,
    moveSpeed: 220,
    isRanged: false,
    isMounted: true,
    skillName: 'Draconic Tempest',
    skillDescription: 'Unleashes a devastating 500-damage flame wave and accelerates Dragon Summon by 9s.',
    skillCooldown: 10,
    primaryColor: '#f59e0b',
    accentColor: '#fde68a',
    capeColor: '#991b1b',
    steedColor: '#1e1b4b',
  },
};

export const HERO_ORDER: HeroId[] = ['roland', 'lyra', 'thane', 'seraphina', 'malakor'];

export const ALLY_UNITS: Record<UnitType, UnitConfig> = {
  swordsman: {
    type: 'swordsman',
    name: 'Mounted Squire',
    roleLabel: 'Fast Cavalry Vanguard',
    shortcutKey: '1',
    cost: 40,
    cooldown: 1.5,
    maxHp: 310,
    damage: 34,
    range: 58,
    attackSpeed: 0.76,
    moveSpeed: 132,
    armor: 5,
    isMounted: true,
    color: '#3b82f6',
    steedColor: '#a16207',
  },
  archer: {
    type: 'archer',
    name: 'Horse Archer',
    roleLabel: 'Mounted Bow Volley',
    shortcutKey: '2',
    cost: 65,
    cooldown: 2.2,
    maxHp: 210,
    damage: 36,
    range: 280,
    attackSpeed: 0.86,
    moveSpeed: 120,
    armor: 3,
    isMounted: true,
    isRanged: true,
    color: '#10b981',
    steedColor: '#b45309',
  },
  knight: {
    type: 'knight',
    name: 'Royal Paladin',
    roleLabel: 'Heavy Barded Warhorse',
    shortcutKey: '3',
    cost: 110,
    cooldown: 3.5,
    maxHp: 580,
    damage: 68,
    range: 68,
    attackSpeed: 0.82,
    moveSpeed: 155,
    armor: 10,
    isMounted: true,
    color: '#f59e0b',
    steedColor: '#e2e8f0',
  },
  siege: {
    type: 'siege',
    name: 'Siege Catapult',
    roleLabel: 'Long-Range Castle Breaker',
    shortcutKey: '4',
    cost: 165,
    cooldown: 5.5,
    maxHp: 420,
    damage: 130,
    range: 400,
    attackSpeed: 1.9,
    moveSpeed: 72,
    armor: 7,
    isRanged: true,
    isSiege: true,
    splashRadius: 80,
    color: '#a855f7',
  },
};

// 20 Progressive Enemy Faces — Level N includes Tiers 1..N, with Tier N as the new powerful face!
const RAW_ENEMY_TIERS: Array<{
  name: string;
  title: string;
  policy: EnemyBehaviorPolicy;
  isMounted: boolean;
  helm: EnemyTierConfig['helmStyle'];
  weapon: EnemyTierConfig['weaponStyle'];
  primary: string;
  secondary: string;
  steed?: string;
}> = [
  { name: 'Goblin Outrider', title: 'Borderland Warg Scout', policy: 'swarmer', isMounted: true, helm: 'hood', weapon: 'sword', primary: '#65a30d', secondary: '#bef264', steed: '#57534e' },
  { name: 'Dark Marksman', title: 'Mounted Crossbow Raider', policy: 'kiter', isMounted: true, helm: 'hood', weapon: 'crossbow', primary: '#9333ea', secondary: '#e9d5ff', steed: '#3f3f46' },
  { name: 'Ironpike Lancer', title: 'Renegade Heavy Horsemen', policy: 'charger', isMounted: true, helm: 'plate', weapon: 'spear', primary: '#dc2626', secondary: '#fecaca', steed: '#451a03' },
  { name: 'Sunbreaker Shieldman', title: 'Armored Phalanx Warden', policy: 'shielded', isMounted: false, helm: 'plate', weapon: 'mace', primary: '#d97706', secondary: '#fef08a' },
  { name: 'Bloodfang Marauder', title: 'Frenzied War-steed Berserker', policy: 'charger', isMounted: true, helm: 'horned', weapon: 'axe', primary: '#b91c1c', secondary: '#fca5a5', steed: '#1c1917' },
  { name: 'Blackwood Horsebow', title: 'Venom-Tipped Mounted Archer', policy: 'kiter', isMounted: true, helm: 'hood', weapon: 'crossbow', primary: '#059669', secondary: '#a7f3d0', steed: '#44403c' },
  { name: 'Crow’s Hollow Juggernaut', title: 'Tower-Shielded Dread Knight', policy: 'shielded', isMounted: true, helm: 'plate', weapon: 'mace', primary: '#475569', secondary: '#cbd5e1', steed: '#27272a' },
  { name: 'Crimson Drake-Knight', title: 'Dragon-Barded Lancer Champion', policy: 'charger', isMounted: true, helm: 'plate', weapon: 'spear', primary: '#e11d48', secondary: '#fda4af', steed: '#451a03' },
  { name: 'Blight Catapult', title: 'Siege Boulder Engine', policy: 'siege_telegraph', isMounted: false, helm: 'plate', weapon: 'catapult', primary: '#7c2d12', secondary: '#fdba74' },
  { name: 'Frostpeak Reaver', title: 'Glacier Wolf-Stallion Champion', policy: 'charger', isMounted: true, helm: 'horned', weapon: 'halberd', primary: '#0284c7', secondary: '#bae6fd', steed: '#cbd5e1' },
  { name: 'Icebound Warlock', title: 'Frost-Bolt Arcane Cavalier', policy: 'kiter', isMounted: true, helm: 'crown', weapon: 'staff', primary: '#2563eb', secondary: '#93c5fd', steed: '#1e293b' },
  { name: 'Winterbane Colossus', title: 'Runed Bulwark Champion', policy: 'shielded', isMounted: true, helm: 'horned', weapon: 'mace', primary: '#1d4ed8', secondary: '#e0f2fe', steed: '#334155' },
  { name: 'Cinderfall Hellknight', title: 'Ash-Barded Dread Charger', policy: 'charger', isMounted: true, helm: 'skull', weapon: 'halberd', primary: '#ea580c', secondary: '#fed7aa', steed: '#292524' },
  { name: 'Molten Bombardier', title: 'Hellfire Siege Trebuchet', policy: 'siege_telegraph', isMounted: false, helm: 'skull', weapon: 'catapult', primary: '#c2410c', secondary: '#fde047' },
  { name: 'Scorched Arch-Cavalier', title: 'Hellfire Lance Warlord', policy: 'charger', isMounted: true, helm: 'horned', weapon: 'spear', primary: '#dc2626', secondary: '#fef08a', steed: '#1c1917' },
  { name: 'Bloodstone Executioner', title: 'Crimson Greataxe Warlord', policy: 'charger', isMounted: true, helm: 'horned', weapon: 'axe', primary: '#991b1b', secondary: '#fecaca', steed: '#090a0f' },
  { name: 'Dreadmaw Necro-Lord', title: 'Shadow-Flame Lich Cavalier', policy: 'kiter', isMounted: true, helm: 'skull', weapon: 'staff', primary: '#7e22ce', secondary: '#f3e8ff', steed: '#18181b' },
  { name: 'Nightfall Dreadnought', title: 'Immortal Obsidian Guard', policy: 'shielded', isMounted: true, helm: 'crown', weapon: 'mace', primary: '#312e81', secondary: '#c7d2fe', steed: '#0f172a' },
  { name: 'Cinder War-Regent', title: 'Supreme Royal Vanguard', policy: 'charger', isMounted: true, helm: 'crown', weapon: 'halberd', primary: '#b45309', secondary: '#fef08a', steed: '#1c1917' },
  { name: 'Malgrim the Undying', title: 'Emperor of the Obsidian Citadel', policy: 'charger', isMounted: true, helm: 'crown', weapon: 'halberd', primary: '#dc2626', secondary: '#fef08a', steed: '#090a0f' },
];

export const BOSS_PORTRAIT_1 = '/assets/aistudio/image_0f808666.png';
export const BOSS_PORTRAIT_2 = '/assets/aistudio/image_0f5dbb65.png';
export const BOSS_PORTRAITS: [string, string] = [BOSS_PORTRAIT_1, BOSS_PORTRAIT_2];

export const ENEMY_TIERS: EnemyTierConfig[] = RAW_ENEMY_TIERS.map((raw, idx) => {
  const tier = idx + 1;
  const isRanged = raw.policy === 'kiter' || raw.policy === 'siege_telegraph' || raw.policy === 'aerial';
  const baseHp = 115 + (tier - 1) * 35;
  const baseDmg = 15 + (tier - 1) * 3.9;
  const bossPortraitUrl = tier % 2 === 1 ? BOSS_PORTRAIT_1 : BOSS_PORTRAIT_2;

  return {
    tier,
    id: `enemy_tier_${tier}`,
    name: raw.name,
    title: raw.title,
    behaviorPolicy: raw.policy,
    maxHp: Math.round(baseHp),
    damage: Math.round(baseDmg),
    range: raw.policy === 'siege_telegraph' ? 350 : raw.policy === 'kiter' ? 235 : raw.policy === 'aerial' ? 150 : 62,
    attackSpeed: raw.policy === 'siege_telegraph' ? 2.5 : isRanged ? 1.2 : 0.92,
    moveSpeed: raw.policy === 'siege_telegraph' ? 54 : raw.isMounted ? 105 + (tier % 4) * 5 : 80,
    armor: Math.min(12, 1 + Math.floor(tier * 0.48) + (raw.policy === 'shielded' ? 3 : 0)),
    goldDrop: 24 + tier * 6,
    scoreValue: 75 + tier * 25,
    windupDuration: raw.policy === 'siege_telegraph' ? 0.65 : raw.policy === 'charger' ? 0.44 : 0.28,
    isMounted: raw.isMounted,
    isBossFace: true,
    bossPortraitUrl,
    scale: Math.min(1.38, 1.0 + (tier - 1) * 0.018),
    primaryColor: raw.primary,
    secondaryColor: raw.secondary,
    steedColor: raw.steed,
    helmStyle: raw.helm,
    weaponStyle: raw.weapon,
  };
});

export function computeTacticalCounter(params: {
  attackerUnitType?: UnitType;
  isHero?: boolean;
  targetPolicy?: EnemyBehaviorPolicy;
  isTargetBoss?: boolean;
  isTargetWindingUp?: boolean;
  hasFrontlineEscort?: boolean;
}): {
  damageMultiplier: number;
  breaksShield: boolean;
  stunSeconds: number;
  bonusGold: number;
  callout: string | null;
} {
  const {
    attackerUnitType,
    isHero,
    targetPolicy,
    isTargetBoss,
    isTargetWindingUp,
    hasFrontlineEscort,
  } = params;

  // 1. Hero Timed Counter-Parry: Striking an enemy or Boss during their attack windup stuns them, deals 2.0x damage, and grants +25 Gold!
  if (isHero && isTargetWindingUp) {
    return {
      damageMultiplier: 2.0,
      breaksShield: true,
      stunSeconds: 1.7,
      bonusGold: 25,
      callout: 'PARRY COUNTER! +25g',
    };
  }

  // 2. Royal Paladin (Knight) Counter: Crushes Shielded Wardens, Heavy Chargers & Boss Commanders
  if (attackerUnitType === 'knight') {
    if (targetPolicy === 'shielded') {
      return {
        damageMultiplier: 1.75,
        breaksShield: true,
        stunSeconds: 0.65,
        bonusGold: 0,
        callout: 'SHIELD BREAKER! x1.75',
      };
    }
    if (targetPolicy === 'charger' || isTargetBoss) {
      return {
        damageMultiplier: 1.55,
        breaksShield: false,
        stunSeconds: 0,
        bonusGold: 0,
        callout: 'LANCE COUNTER! x1.55',
      };
    }
  }

  // 3. Horse Archer Counter & Combined-Arms Volley Synergy: Counters Aerial Wyverns, Kiters & Swarmers, and deals bonus damage behind an allied vanguard!
  if (attackerUnitType === 'archer') {
    const isCounterTarget =
      targetPolicy === 'aerial' || targetPolicy === 'kiter' || targetPolicy === 'swarmer';
    if (isCounterTarget && hasFrontlineEscort) {
      return {
        damageMultiplier: 1.85,
        breaksShield: false,
        stunSeconds: 0,
        bonusGold: 0,
        callout: 'SYNERGY VOLLEY! x1.85',
      };
    }
    if (isCounterTarget) {
      return {
        damageMultiplier: 1.5,
        breaksShield: false,
        stunSeconds: 0,
        bonusGold: 0,
        callout: 'PIERCING SHOT! x1.5',
      };
    }
    if (hasFrontlineEscort) {
      return {
        damageMultiplier: 1.3,
        breaksShield: false,
        stunSeconds: 0,
        bonusGold: 0,
        callout: null,
      };
    }
  }

  // 4. Mounted Squire (Swordsman) Counter: Disrupts Enemy Siege Engines & Kiter Crossbows
  if (attackerUnitType === 'swordsman') {
    if (targetPolicy === 'siege_telegraph' || targetPolicy === 'kiter') {
      return {
        damageMultiplier: 1.65,
        breaksShield: false,
        stunSeconds: 0.4,
        bonusGold: 0,
        callout: 'FLANK STRIKE! x1.65',
      };
    }
  }

  // 5. Siege Catapult: Shatters Shielded Phalanxes & Heavy Clusters
  if (attackerUnitType === 'siege') {
    return {
      damageMultiplier: targetPolicy === 'shielded' || isTargetBoss ? 1.6 : 1.25,
      breaksShield: true,
      stunSeconds: 0.5,
      bonusGold: 0,
      callout: targetPolicy === 'shielded' ? 'ARMOR SHATTER!' : null,
    };
  }

  return {
    damageMultiplier: 1.0,
    breaksShield: false,
    stunSeconds: 0,
    bonusGold: 0,
    callout: null,
  };
}

// Keep backwards-compatible ENEMY_ARCHETYPES export mapped to key tiers for any external consumers
export const ENEMY_ARCHETYPES: Record<string, EnemyTierConfig> = {
  goblin: ENEMY_TIERS[0],
  crossbow: ENEMY_TIERS[1],
  berserker: ENEMY_TIERS[4],
  juggernaut: ENEMY_TIERS[6],
  wyvern: ENEMY_TIERS[7],
  trebuchet: ENEMY_TIERS[8],
};

export function getEnemyRosterForLevel(level: number): EnemyTierConfig[] {
  const clamped = Math.max(1, Math.min(ENEMY_TIERS.length, Math.floor(level)));
  return ENEMY_TIERS.slice(0, clamped);
}

const LEVEL_NAMES: Array<{ name: string; subtitle: string; biome: BiomeTheme }> = [
  { name: 'Borderwatch Outpost', subtitle: 'Repel the Goblin Outrider cavalry at the frontier', biome: 'dawn' },
  { name: 'Silverbrook Crossing', subtitle: 'Dark Marksman horse-crossbows join the raid', biome: 'dawn' },
  { name: 'Whispering Fens', subtitle: 'Ironpike Lancers charge across the misty bridge', biome: 'dawn' },
  { name: 'Sunspire Watchtower', subtitle: 'Sunbreaker Shieldmen reinforce the vanguard', biome: 'dawn' },
  { name: 'Highgate Bastion', subtitle: 'Bloodfang Marauders unleash frenzied war-steeds', biome: 'autumn' },
  { name: 'Amberleaf Stronghold', subtitle: 'Blackwood Horsebows rain venom-tipped shafts', biome: 'autumn' },
  { name: 'Crow’s Hollow Keep', subtitle: 'Tower-shielded Juggernauts lead the dark column', biome: 'autumn' },
  { name: 'Redwater Ravine', subtitle: 'Crimson Drake-Knights charge down from the canyon', biome: 'autumn' },
  { name: 'Windscar Plateau', subtitle: 'Blight Catapults bombard the royal road', biome: 'frost' },
  { name: 'Frostpeak Gatehouse', subtitle: 'Frostpeak Reavers & Dread Dragons descend', biome: 'frost' },
  { name: 'Glacierhold Sanctum', subtitle: 'Icebound Warlocks hurl arcane frost bolts', biome: 'frost' },
  { name: 'Winterbane Spire', subtitle: 'Winterbane Colossi march under frozen skies', biome: 'frost' },
  { name: 'Cinderfall Trenches', subtitle: 'Ash-barded Cinderfall Hellknights charge forth', biome: 'ember' },
  { name: 'Molten Forge Keep', subtitle: 'Molten Bombardiers hurl volcanic boulders', biome: 'ember' },
  { name: 'Scorched Palisade', subtitle: 'Scorched Arch-Cavaliers ignite the frontlines', biome: 'ember' },
  { name: 'Bloodstone Redoubt', subtitle: 'Bloodstone Executioners cleave the frontlines', biome: 'ember' },
  { name: 'Dreadmaw Caldera', subtitle: 'Dreadmaw Necro-Lords command the dark host', biome: 'obsidian' },
  { name: 'Nightfall Battlements', subtitle: 'Nightfall Dreadnoughts guard the inner ring', biome: 'obsidian' },
  { name: 'Throne of Cinders', subtitle: 'The Cinder War-Regent leads the royal guard', biome: 'obsidian' },
  { name: 'Obsidian Dragon Citadel', subtitle: 'Emperor Malgrim the Undying & his full legion', biome: 'obsidian' },
];

export const LEVELS: LevelConfig[] = LEVEL_NAMES.map((meta, idx) => {
  const level = idx + 1;
  const roster = getEnemyRosterForLevel(level);
  const featuredEnemy = roster[roster.length - 1];
  const coBossEnemy =
    roster.length >= 2
      ? roster[roster.length - 2]
      : {
          ...ENEMY_TIERS[1],
          maxHp: featuredEnemy.maxHp,
          damage: featuredEnemy.damage,
        };
  const hasEnemyDragon = level >= 4;
  const enemyDragonInterval = Math.max(24, 44 - level * 0.85);
  // Progressive distance between the two castles increases on every level!
  const battlefieldWidth = 1440 + (level - 1) * 75;
  const castleDistance = battlefieldWidth - 290;

  return {
    level,
    name: meta.name,
    subtitle: meta.subtitle,
    biome: meta.biome,
    battlefieldWidth,
    castleDistance,
    playerCastleHp: 1120 + (level - 1) * 105,
    enemyCastleHp: 940 + (level - 1) * 195,
    startingGold: 165 + (level - 1) * 14,
    goldPerSecond: 14 + Math.floor(level * 0.95),
    spawnInterval: Number(Math.max(2.3, 4.1 - level * 0.085).toFixed(2)),
    enemyStatMultiplier: Number((0.92 + (level - 1) * 0.048).toFixed(2)),
    unlockedEnemyTiers: roster.map((r) => r.tier),
    featuredEnemy,
    coBossEnemy,
    hasEnemyDragon,
    enemyDragonInterval: Math.round(enemyDragonInterval),
    baseCoinReward: 120 + (level - 1) * 55,
    parTimeSeconds: 80 + level * 7,
  };
});

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(LEVELS.length, Math.floor(level)));
  return LEVELS[clamped - 1];
}

export function getWallUpgradeCost(currentLevel: number): number {
  return 110 + (currentLevel - 1) * 65;
}

export function getTowerUpgradeCost(currentLevel: number): number {
  return 140 + (currentLevel - 1) * 85;
}

export function calculateBattleScore(params: {
  victory: boolean;
  level: number;
  clearTimeSeconds: number;
  parTimeSeconds: number;
  playerCastleHp: number;
  playerCastleMaxHp: number;
  enemiesDefeated: number;
  damageDealtToCastle: number;
}): number {
  const {
    victory,
    level,
    clearTimeSeconds,
    parTimeSeconds,
    playerCastleHp,
    playerCastleMaxHp,
    enemiesDefeated,
    damageDealtToCastle,
  } = params;

  const combatScore = enemiesDefeated * 75 + Math.round(damageDealtToCastle * 0.8);
  if (!victory) {
    return Math.max(0, Math.round(combatScore * (1 + (level - 1) * 0.05)));
  }

  const levelBase = 1200 + level * 350;
  const timeSaved = Math.max(0, parTimeSeconds - clearTimeSeconds);
  const speedBonus = Math.round(timeSaved * 32 + (parTimeSeconds / Math.max(15, clearTimeSeconds)) * 450);

  const hpRatio = Math.max(0, Math.min(1, playerCastleHp / Math.max(1, playerCastleMaxHp)));
  const fortressBonus = Math.round(hpRatio * 800);

  return Math.round(levelBase + combatScore + speedBonus + fortressBonus);
}

export function calculateStars(params: {
  victory: boolean;
  clearTimeSeconds: number;
  parTimeSeconds: number;
  playerCastleHp: number;
  playerCastleMaxHp: number;
}): number {
  if (!params.victory) return 0;
  const hpRatio = params.playerCastleHp / Math.max(1, params.playerCastleMaxHp);
  if (params.clearTimeSeconds <= params.parTimeSeconds && hpRatio >= 0.65) {
    return 3;
  }
  if (params.clearTimeSeconds <= params.parTimeSeconds * 1.35 || hpRatio >= 0.45) {
    return 2;
  }
  return 1;
}

export function calculateCoinReward(params: {
  victory: boolean;
  levelConfig: LevelConfig;
  stars: number;
  enemiesDefeated: number;
}): number {
  const { victory, levelConfig, stars, enemiesDefeated } = params;
  const skirmishBonus = Math.min(150, enemiesDefeated * 4);
  if (!victory) {
    return Math.max(20, Math.round(levelConfig.baseCoinReward * 0.25 + skirmishBonus * 0.5));
  }
  const starBonus = stars === 3 ? 65 : stars === 2 ? 30 : 0;
  return Math.round(levelConfig.baseCoinReward + starBonus + skirmishBonus);
}

export function isNewHighScore(candidateScore: number, currentHighScore: number): boolean {
  return candidateScore > 0 && candidateScore > currentHighScore;
}

export function computeDamage(rawDamage: number, targetArmor: number, isShieldedFront = false): number {
  const effectiveRaw = isShieldedFront ? rawDamage * 0.45 : rawDamage;
  const mitigated = effectiveRaw - targetArmor * 0.85;
  return Math.max(3, Math.round(mitigated));
}

export function canDeployUnit(
  unitType: UnitType,
  currentGold: number,
  currentCooldown: number
): boolean {
  const cfg = ALLY_UNITS[unitType];
  if (!cfg) return false;
  return currentGold >= cfg.cost && currentCooldown <= 0;
}

export function canPurchaseHero(heroId: HeroId, save: SaveProgress): boolean {
  if (save.unlockedHeroes.includes(heroId)) return false;
  const hero = HEROES[heroId];
  if (!hero) return false;
  return save.coins >= hero.cost;
}

export function purchaseHeroState(heroId: HeroId, save: SaveProgress): SaveProgress {
  if (!canPurchaseHero(heroId, save)) return save;
  const hero = HEROES[heroId];
  return {
    ...save,
    coins: save.coins - hero.cost,
    unlockedHeroes: [...save.unlockedHeroes, heroId],
    selectedHero: heroId,
  };
}

export function checkBattleOutcome(
  playerCastleHp: number,
  enemyCastleHp: number
): 'ongoing' | 'victory' | 'defeat' {
  if (enemyCastleHp <= 0) return 'victory';
  if (playerCastleHp <= 0) return 'defeat';
  return 'ongoing';
}

export const DEFAULT_SAVE_PROGRESS: SaveProgress = {
  coins: 320,
  highestUnlockedLevel: 1,
  selectedHero: 'roland',
  unlockedHeroes: ['roland'],
  highScore: 0,
  levelScores: {},
  levelStars: {},
};

const STORAGE_KEY = 'crown_and_cinder_save_v1';

export function loadSaveProgress(): SaveProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SAVE_PROGRESS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<SaveProgress>;
    return {
      coins: typeof parsed.coins === 'number' ? Math.max(0, Math.floor(parsed.coins)) : DEFAULT_SAVE_PROGRESS.coins,
      highestUnlockedLevel:
        typeof parsed.highestUnlockedLevel === 'number'
          ? Math.max(1, Math.min(20, Math.floor(parsed.highestUnlockedLevel)))
          : 1,
      selectedHero:
        parsed.selectedHero && HEROES[parsed.selectedHero] ? parsed.selectedHero : 'roland',
      unlockedHeroes:
        Array.isArray(parsed.unlockedHeroes) && parsed.unlockedHeroes.length > 0
          ? (parsed.unlockedHeroes.filter((id) => Boolean(HEROES[id as HeroId])) as HeroId[])
          : ['roland'],
      highScore: typeof parsed.highScore === 'number' ? Math.max(0, Math.floor(parsed.highScore)) : 0,
      levelScores: parsed.levelScores && typeof parsed.levelScores === 'object' ? parsed.levelScores : {},
      levelStars: parsed.levelStars && typeof parsed.levelStars === 'object' ? parsed.levelStars : {},
    };
  } catch {
    return { ...DEFAULT_SAVE_PROGRESS };
  }
}

export function persistSaveProgress(save: SaveProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore storage quota errors
  }
}
