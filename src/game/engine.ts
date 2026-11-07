import { soundEngine } from './audio';
import { Raylib2DContext, RLTexture2D } from './raylib';
// Imported (not hard-coded) so Vite fingerprints them and rewrites URLs for the deploy base path.
import imgBattlefieldBg from '../assets/images/battlefield_bg_1794043501397.jpg';
import imgCastleAlly from '../assets/images/castle_ally_1794043501147.jpg';
import imgCastleEnemy from '../assets/images/castle_enemy_1794043501923.jpg';
import imgDragon from '../assets/images/dragon_sprite_1794043503257.jpg';
import imgKnight from '../assets/images/cavalry_knight_1794043504093.jpg';
import imgArcher from '../assets/images/cavalry_archer_1794043541820.jpg';
import imgSiege from '../assets/images/siege_catapult_1794043541691.jpg';
import imgBoss1 from '../assets/images/boss_warlord_1_1794043540234.jpg';
import imgBoss2 from '../assets/images/boss_warlord_2_1794043542286.jpg';
import {
  ALLY_UNITS,
  BOSS_PORTRAIT_1,
  BOSS_PORTRAIT_2,
  BOSS_PORTRAITS,
  HEROES,
  calculateBattleScore,
  calculateCoinReward,
  calculateStars,
  canDeployUnit,
  checkBattleOutcome,
  computeDamage,
  computeTacticalCounter,
  getEnemyRosterForLevel,
  getLevelConfig,
  getTowerUpgradeCost,
  getWallUpgradeCost,
  isNewHighScore,
} from './rules';
import {
  BattleSnapshot,
  BiomeTheme,
  EnemyBehaviorPolicy,
  EnemyTierConfig,
  GameState,
  HeroId,
  LevelConfig,
  LiveHudState,
  UnitType,
} from './types';

export const WORLD_WIDTH = 1440;
export const WORLD_HEIGHT = 820;
// Keep GROUND_Y at 575 (70% down) so the entire battlefield and castle bases sit cleanly above the compact bottom HUD bar!
export const GROUND_Y = 575;
export const PLAYER_CASTLE_X = 145;
export const ENEMY_CASTLE_X = 1295;

interface CombatActor {
  id: number;
  side: 'ally' | 'enemy';
  name: string;
  isHero?: boolean;
  isFeaturedFace?: boolean;
  bossPortraitUrl?: string;
  unitType?: UnitType;
  enemyTier?: number;
  behaviorPolicy?: EnemyBehaviorPolicy;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  ghostHp: number;
  damage: number;
  range: number;
  attackCooldown: number;
  attackTimer: number;
  moveSpeed: number;
  armor: number;
  color: string;
  accentColor: string;
  capeColor: string;
  steedColor: string;
  isMounted: boolean;
  isRanged: boolean;
  isSiege: boolean;
  splashRadius: number;
  actorScale: number;
  helmStyle: 'hood' | 'horned' | 'crown' | 'skull' | 'plate' | 'wyvern';
  weaponStyle: 'sword' | 'spear' | 'axe' | 'mace' | 'crossbow' | 'staff' | 'catapult' | 'halberd';
  // Animation & feel states
  walkPhase: number;
  swingAnim: number; // 0..1 weapon swing arc
  scaleX: number;
  scaleY: number;
  hitFlashTimer: number;
  stunTimer: number;
  windupTimer: number;
  windupMax: number;
  isCharging: boolean;
  shieldRaised: boolean;
  shieldCycleTimer: number;
  koTimer: number;
  koRotation: number;
  targetGroundX: number;
  goldDrop: number;
  scoreValue: number;
}

interface Projectile {
  active: boolean;
  side: 'ally' | 'enemy';
  kind: 'arrow' | 'bolt' | 'boulder' | 'fireball' | 'sun_arrow' | 'meteor';
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  damage: number;
  splashRadius: number;
  color: string;
  breaksShield?: boolean;
}

interface FloatingCallout {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  glow: boolean;
}

interface ActiveDragon {
  active: boolean;
  side: 'ally' | 'enemy';
  x: number;
  y: number;
  vx: number;
  wingPhase: number;
  breathTick: number;
}

const MAX_PARTICLES = 450;
const MAX_PROJECTILES = 120;

const BIOME_PALETTES: Record<
  BiomeTheme,
  {
    skyTop: string;
    skyMid: string;
    skyBottom: string;
    farMtn: string;
    nearMtn: string;
    groundTop: string;
    groundDeep: string;
  }
> = {
  dawn: {
    skyTop: '#090f1f',
    skyMid: '#1e294b',
    skyBottom: '#4338ca',
    farMtn: '#1b1947',
    nearMtn: '#2c286e',
    groundTop: '#164e2e',
    groundDeep: '#072213',
  },
  autumn: {
    skyTop: '#181016',
    skyMid: '#3b1d2e',
    skyBottom: '#7c2d12',
    farMtn: '#2e1623',
    nearMtn: '#451a03',
    groundTop: '#713f12',
    groundDeep: '#271406',
  },
  frost: {
    skyTop: '#081420',
    skyMid: '#0f2942',
    skyBottom: '#1e40af',
    farMtn: '#172554',
    nearMtn: '#1e3a8a',
    groundTop: '#334155',
    groundDeep: '#0f172a',
  },
  ember: {
    skyTop: '#140808',
    skyMid: '#381010',
    skyBottom: '#991b1b',
    farMtn: '#2a0a0a',
    nearMtn: '#450a0a',
    groundTop: '#3f2318',
    groundDeep: '#1c0d08',
  },
  obsidian: {
    skyTop: '#07060e',
    skyMid: '#1b1136',
    skyBottom: '#581c87',
    farMtn: '#170d2b',
    nearMtn: '#2e1065',
    groundTop: '#1f2430',
    groundDeep: '#090b10',
  },
};

export class KingdomGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudUpdate: (hud: LiveHudState) => void;
  private onBattleEnd: (snapshot: BattleSnapshot) => void;
  private onStateChange: (state: GameState) => void;

  private gameState: GameState = 'title';
  private levelConfig: LevelConfig = getLevelConfig(1);
  private heroId: HeroId = 'roland';
  private highScore = 0;

  private battleGold = 150;
  private score = 0;
  private elapsedSeconds = 0;
  private playerCastleHp = 1000;
  private playerCastleMaxHp = 1000;
  private playerCastleGhostHp = 1000;
  private enemyCastleHp = 1000;
  private enemyCastleMaxHp = 1000;
  private enemyCastleGhostHp = 1000;
  private playerCastleFlash = 0;
  private enemyCastleFlash = 0;

  private wallLevel = 1;
  private towerLevel = 1;
  private towerFireTimer = 0;

  private heroActor: CombatActor | null = null;
  private heroRespawnTimer = 0;
  private heroSkillCooldown = 0;
  private heroSkillMaxCooldown = 11;

  private dragonCooldown = 6;
  private dragonMaxCooldown = 24;
  private activeDragon: ActiveDragon = {
    active: false,
    side: 'ally',
    x: -200,
    y: 175,
    vx: 0,
    wingPhase: 0,
    breathTick: 0,
  };

  private enemyDragonTimer = 28;
  private enemyDragonWarning = 0;

  private unitCooldowns: Record<UnitType, number> = {
    swordsman: 0,
    archer: 0,
    knight: 0,
    siege: 0,
  };

  private actors: CombatActor[] = [];
  private nextActorId = 1;
  private spawnTimer = 1.2;
  private enemiesDefeated = 0;
  private damageDealtToCastle = 0;

  private particles: PooledParticle[] = [];
  private particleCursor = 0;
  private projectiles: Projectile[] = [];
  private projectileCursor = 0;
  private callouts: FloatingCallout[] = [];

  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private titlePanTime = 0;
  private celebrationMode = false;
  private fireworkTimer = 0;
  private endBeatTimer = 0;
  private pendingOutcome: 'victory' | 'defeat' | null = null;

  private keysHeld = new Set<string>();
  private keysJustPressed = new Set<string>();
  private attackBufferTimer = 0;
  private pointerTargetX: number | null = null;

  private rafId: number | null = null;
  private loopTimerId: number | null = null;
  private lastTimestamp = 0;
  private hudSyncAccum = 0;
  private bossImages = new Map<string, HTMLImageElement>();
  private bossWaveCounter = 0;

  private rl: Raylib2DContext;
  private texBg: RLTexture2D;
  private texCastleAlly: RLTexture2D;
  private texCastleEnemy: RLTexture2D;
  private texDragon: RLTexture2D;
  private texKnight: RLTexture2D;
  private texArcher: RLTexture2D;
  private texSiege: RLTexture2D;
  private texBoss1: RLTexture2D;
  private texBoss2: RLTexture2D;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onHudUpdate: (hud: LiveHudState) => void;
      onBattleEnd: (snapshot: BattleSnapshot) => void;
      onStateChange: (state: GameState) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onBattleEnd = callbacks.onBattleEnd;
    this.onStateChange = callbacks.onStateChange;

    // Initialize Raylib 2D Texture/Sprite Pipeline & Preload High-Res Game Sprites
    this.rl = new Raylib2DContext(this.ctx);
    this.texBg = this.rl.LoadTexture(imgBattlefieldBg, false);
    this.texCastleAlly = this.rl.LoadTexture(imgCastleAlly, true);
    this.texCastleEnemy = this.rl.LoadTexture(imgCastleEnemy, true);
    this.texDragon = this.rl.LoadTexture(imgDragon, true);
    this.texKnight = this.rl.LoadTexture(imgKnight, true);
    this.texArcher = this.rl.LoadTexture(imgArcher, true);
    this.texSiege = this.rl.LoadTexture(imgSiege, true);
    this.texBoss1 = this.rl.LoadTexture(imgBoss1, true);
    this.texBoss2 = this.rl.LoadTexture(imgBoss2, true);

    if (typeof Image !== 'undefined') {
      const portraitMap = [
        { key: BOSS_PORTRAIT_1, src: imgBoss1 },
        { key: BOSS_PORTRAIT_2, src: imgBoss2 },
      ];
      for (const p of portraitMap) {
        const img = new Image();
        img.src = p.src;
        this.bossImages.set(p.key, img);
        this.bossImages.set(p.src, img);
      }
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        life: 0,
        maxLife: 1,
        color: '#fbbf24',
        gravity: 0,
        glow: false,
      });
    }

    for (let i = 0; i < MAX_PROJECTILES; i++) {
      this.projectiles.push({
        active: false,
        side: 'ally',
        kind: 'arrow',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        damage: 10,
        splashRadius: 0,
        color: '#fef08a',
      });
    }
  }

  public startLoop(): void {
    if (this.loopTimerId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = () => {
      this.loopTimerId = null;
      const now = performance.now();
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      this.update(dt);
      this.render();
      this.keysJustPressed.clear();
      this.loopTimerId = window.setTimeout(tick, 16);
    };
    this.loopTimerId = window.setTimeout(tick, 16);
  }

  public stopLoop(): void {
    if (this.loopTimerId !== null) {
      window.clearTimeout(this.loopTimerId);
      this.loopTimerId = null;
    }
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    soundEngine.stopMusic();
  }

  public setHighScore(highScore: number): void {
    this.highScore = highScore;
  }

  public setGameState(nextState: GameState): void {
    this.gameState = nextState;
    if (typeof document !== 'undefined') {
      document.body.dataset.state = nextState;
    }
    if (nextState === 'playing') {
      this.keysHeld.clear();
      this.keysJustPressed.clear();
      soundEngine.startMusic();
    } else {
      soundEngine.stopMusic();
    }
    this.onStateChange(nextState);
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public clearInputs(): void {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.pointerTargetX = null;
  }

  public handleKeyDown(code: string): void {
    if (!this.keysHeld.has(code)) {
      this.keysJustPressed.add(code);
    }
    this.keysHeld.add(code);
  }

  public handleKeyUp(code: string): void {
    this.keysHeld.delete(code);
  }

  public screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const normX = (clientX - rect.left) / Math.max(1, rect.width);
    const normY = (clientY - rect.top) / Math.max(1, rect.height);
    return {
      x: normX * WORLD_WIDTH,
      y: normY * WORLD_HEIGHT,
    };
  }

  public handleCanvasClick(clientX: number, clientY: number): void {
    if (this.gameState !== 'playing') return;
    const worldPos = this.screenToWorld(clientX, clientY);
    this.pointerTargetX = Math.max(PLAYER_CASTLE_X + 60, Math.min(ENEMY_CASTLE_X - 70, worldPos.x));
    this.attackBufferTimer = 0.14;
  }

  public startBattle(level: number, heroId: HeroId, highScore: number): void {
    this.levelConfig = getLevelConfig(level);
    this.heroId = heroId;
    this.highScore = highScore;
    this.celebrationMode = false;
    this.pendingOutcome = null;
    this.endBeatTimer = 0;

    this.battleGold = this.levelConfig.startingGold;
    this.score = 0;
    this.elapsedSeconds = 0;
    this.enemiesDefeated = 0;
    this.damageDealtToCastle = 0;

    this.playerCastleMaxHp = this.levelConfig.playerCastleHp;
    this.playerCastleHp = this.playerCastleMaxHp;
    this.playerCastleGhostHp = this.playerCastleMaxHp;
    this.enemyCastleMaxHp = this.levelConfig.enemyCastleHp;
    this.enemyCastleHp = this.enemyCastleMaxHp;
    this.enemyCastleGhostHp = this.enemyCastleMaxHp;

    this.wallLevel = 1;
    this.towerLevel = 1;
    this.towerFireTimer = 0.6;

    this.unitCooldowns = {
      swordsman: 0,
      archer: 0,
      knight: 0,
      siege: 0,
    };

    this.dragonMaxCooldown = 22;
    this.dragonCooldown = 0; // First Dragon Summon ready immediately, then 22s cooldown
    this.activeDragon.active = false;
    this.enemyDragonTimer = this.levelConfig.enemyDragonInterval;
    this.enemyDragonWarning = 0;

    this.actors = [];
    this.callouts = [];
    this.particles.forEach((p) => (p.active = false));
    this.projectiles.forEach((pr) => (pr.active = false));

    // Spawn Player Hero + initial mounted vanguard at Castle of Gaza gate
    this.spawnHero();
    this.spawnAllyUnit('swordsman', PLAYER_CASTLE_X + 120);
    this.spawnAllyUnit('archer', PLAYER_CASTLE_X + 80);

    // Enemy vanguard marches out from the Castle of Epstein gate
    const roster = getEnemyRosterForLevel(level);
    const featured = this.levelConfig.featuredEnemy;
    const prevTier1 = roster.length >= 2 ? roster[roster.length - 2] : roster[0];

    this.bossWaveCounter = 0;
    this.spawnEnemyFromTier(featured, ENEMY_CASTLE_X - 55, true, BOSS_PORTRAIT_1);
    if (level >= 2) {
      this.spawnEnemyFromTier(prevTier1, ENEMY_CASTLE_X - 110, false, BOSS_PORTRAIT_2);
    }

    this.spawnTimer = 2.6;

    this.setGameState('playing');
    this.emitHudState();
  }

  private spawnHero(): void {
    const cfg = HEROES[this.heroId];
    this.heroSkillMaxCooldown = cfg.skillCooldown;
    this.heroSkillCooldown = 0;
    this.heroActor = {
      id: this.nextActorId++,
      side: 'ally',
      name: cfg.name,
      isHero: true,
      x: PLAYER_CASTLE_X + 165,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      ghostHp: cfg.maxHp,
      damage: cfg.damage,
      range: cfg.attackRange,
      attackCooldown: cfg.attackCooldown,
      attackTimer: 0,
      moveSpeed: cfg.moveSpeed,
      armor: 10,
      color: cfg.primaryColor,
      accentColor: cfg.accentColor,
      capeColor: cfg.capeColor,
      steedColor: cfg.steedColor,
      isMounted: true,
      isRanged: cfg.isRanged,
      isSiege: false,
      splashRadius: 0,
      actorScale: 1.18,
      helmStyle: 'crown',
      weaponStyle: cfg.isRanged ? 'crossbow' : 'sword',
      walkPhase: 0,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.16,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    };
    this.actors.push(this.heroActor);
  }

  public deployUnit(type: UnitType): boolean {
    if (this.gameState !== 'playing') return false;
    const cfg = ALLY_UNITS[type];
    if (!canDeployUnit(type, this.battleGold, this.unitCooldowns[type])) {
      return false;
    }
    this.battleGold -= cfg.cost;
    this.unitCooldowns[type] = cfg.cooldown;
    this.spawnAllyUnit(type, PLAYER_CASTLE_X + 90 + Math.random() * 25);
    soundEngine.playDeploy();
    this.emitHudState();
    return true;
  }

  private spawnAllyUnit(type: UnitType, spawnX: number): void {
    const cfg = ALLY_UNITS[type];
    const actor: CombatActor = {
      id: this.nextActorId++,
      side: 'ally',
      name: cfg.name,
      unitType: type,
      x: spawnX,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      ghostHp: cfg.maxHp,
      damage: cfg.damage,
      range: cfg.range,
      attackCooldown: cfg.attackSpeed,
      attackTimer: 0,
      moveSpeed: cfg.moveSpeed,
      armor: cfg.armor,
      color: cfg.color,
      accentColor: '#f8fafc',
      capeColor: '#1e3a8a',
      steedColor: cfg.steedColor || '#a16207',
      isMounted: Boolean(cfg.isMounted),
      isRanged: Boolean(cfg.isRanged),
      isSiege: Boolean(cfg.isSiege),
      splashRadius: cfg.splashRadius || 0,
      actorScale: type === 'knight' ? 1.12 : 1.0,
      helmStyle: type === 'knight' ? 'plate' : 'hood',
      weaponStyle: type === 'siege' ? 'catapult' : type === 'archer' ? 'crossbow' : type === 'knight' ? 'spear' : 'sword',
      walkPhase: Math.random() * Math.PI * 2,
      swingAnim: 0,
      scaleX: 0.85,
      scaleY: 1.15,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.18,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    };
    this.actors.push(actor);
    this.spawnBurst(spawnX, GROUND_Y - 24, 6, cfg.color, false);
  }

  private spawnEnemyFromTier(
    tierCfg: EnemyTierConfig,
    spawnX = ENEMY_CASTLE_X - 55,
    isFeatured = false,
    overridePortraitUrl?: string
  ): void {
    const mult = this.levelConfig.enemyStatMultiplier;
    // Bosses, cavalry, and all land troops remain firmly on the ground causeway; only dragons fly in the sky!
    const baseY = GROUND_Y;
    const isBossCommander = isFeatured || tierCfg.tier === this.levelConfig.level;
    const portraitUrl = overridePortraitUrl || tierCfg.bossPortraitUrl;
    const bossHpMult = isBossCommander ? 1.45 : 1.05;
    const finalHp = Math.round(tierCfg.maxHp * mult * bossHpMult);

    const actor: CombatActor = {
      id: this.nextActorId++,
      side: 'enemy',
      name: tierCfg.name,
      isFeaturedFace: isBossCommander,
      bossPortraitUrl: portraitUrl,
      enemyTier: tierCfg.tier,
      behaviorPolicy: tierCfg.behaviorPolicy,
      x: spawnX,
      y: baseY,
      vx: 0,
      vy: 0,
      hp: finalHp,
      maxHp: finalHp,
      ghostHp: finalHp,
      damage: Math.round(tierCfg.damage * mult),
      range: tierCfg.range,
      attackCooldown: tierCfg.attackSpeed,
      attackTimer: 0,
      moveSpeed: tierCfg.moveSpeed,
      armor: tierCfg.armor,
      color: tierCfg.primaryColor,
      accentColor: tierCfg.secondaryColor,
      capeColor: '#7f1d1d',
      steedColor: tierCfg.steedColor || '#27272a',
      isMounted: tierCfg.isMounted,
      isRanged: tierCfg.range > 95,
      isSiege: tierCfg.behaviorPolicy === 'siege_telegraph',
      splashRadius: tierCfg.behaviorPolicy === 'siege_telegraph' ? 75 : 0,
      actorScale: isBossCommander ? Math.max(1.22, tierCfg.scale) : tierCfg.scale,
      helmStyle: tierCfg.helmStyle,
      weaponStyle: tierCfg.weaponStyle,
      walkPhase: Math.random() * Math.PI * 2,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: tierCfg.windupDuration,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: tierCfg.goldDrop,
      scoreValue: tierCfg.scoreValue,
    };
    this.actors.push(actor);
  }

  public upgradeWall(): boolean {
    if (this.gameState !== 'playing' || this.wallLevel >= 5) return false;
    const cost = getWallUpgradeCost(this.wallLevel);
    if (this.battleGold < cost) return false;
    this.battleGold -= cost;
    this.wallLevel++;
    const bonusHp = 320;
    this.playerCastleMaxHp += bonusHp;
    this.playerCastleHp = Math.min(this.playerCastleMaxHp, this.playerCastleHp + bonusHp + 150);
    this.playerCastleGhostHp = this.playerCastleHp;
    soundEngine.playPurchase();
    this.spawnBurst(PLAYER_CASTLE_X + 35, GROUND_Y - 60, 18, '#38bdf8', true);
    this.emitHudState();
    return true;
  }

  public upgradeTower(): boolean {
    if (this.gameState !== 'playing' || this.towerLevel >= 5) return false;
    const cost = getTowerUpgradeCost(this.towerLevel);
    if (this.battleGold < cost) return false;
    this.battleGold -= cost;
    this.towerLevel++;
    soundEngine.playPurchase();
    this.spawnBurst(PLAYER_CASTLE_X + 10, GROUND_Y - 160, 20, '#fbbf24', true);
    this.emitHudState();
    return true;
  }

  public triggerHeroSkill(): boolean {
    if (this.gameState !== 'playing') return false;
    if (!this.heroActor || this.heroActor.koTimer > 0 || this.heroSkillCooldown > 0) return false;

    const cfg = HEROES[this.heroId];
    this.heroSkillCooldown = cfg.skillCooldown;
    soundEngine.playHeroSkill();
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.45);
    this.hitstopTimer = 0.045;

    const hx = this.heroActor.x;
    this.heroActor.scaleX = 1.25;
    this.heroActor.scaleY = 0.82;
    this.heroActor.swingAnim = 1;

    if (this.heroId === 'roland') {
      this.spawnBurst(hx, GROUND_Y - 40, 32, '#fef08a', true);
      for (const actor of this.actors) {
        if (actor.koTimer > 0) continue;
        if (actor.side === 'ally' && Math.abs(actor.x - hx) <= 290) {
          actor.hp = Math.min(actor.maxHp, actor.hp + 120);
          this.spawnBurst(actor.x, actor.y - 30, 8, '#4ade80', true);
        } else if (actor.side === 'enemy' && Math.abs(actor.x - hx) <= 280) {
          this.applyActorDamage(actor, 200, true);
        }
      }
    } else if (this.heroId === 'lyra') {
      for (let i = 0; i < 14; i++) {
        const targetX = Math.min(ENEMY_CASTLE_X, hx + 110 + i * 62);
        this.spawnProjectile({
          side: 'ally',
          kind: 'sun_arrow',
          x: targetX - 90,
          y: 35 - i * 18,
          vx: 180,
          vy: 540,
          gravity: 120,
          damage: 98,
          splashRadius: 52,
          color: '#6ee7b7',
        });
      }
    } else if (this.heroId === 'thane') {
      this.spawnBurst(hx + 60, GROUND_Y - 10, 36, '#fb923c', true);
      for (const actor of this.actors) {
        if (actor.koTimer > 0 || actor.side !== 'enemy') continue;
        if (Math.abs(actor.x - hx) <= 380) {
          actor.stunTimer = 2.5;
          this.applyActorDamage(actor, 250, true);
        }
      }
    } else if (this.heroId === 'seraphina') {
      for (let i = 0; i < 6; i++) {
        const targetX = Math.min(ENEMY_CASTLE_X, hx + 150 + i * 125);
        this.spawnProjectile({
          side: 'ally',
          kind: 'meteor',
          x: targetX - 120,
          y: -30 - i * 45,
          vx: 220,
          vy: 480,
          gravity: 80,
          damage: 185,
          splashRadius: 90,
          color: '#f43f5e',
        });
      }
    } else if (this.heroId === 'malakor') {
      this.dragonCooldown = Math.max(0, this.dragonCooldown - 8);
      this.spawnBurst(hx + 80, GROUND_Y - 45, 40, '#f59e0b', true);
      for (const actor of this.actors) {
        if (actor.koTimer > 0 || actor.side !== 'enemy') continue;
        if (actor.x >= hx - 60 && actor.x <= hx + 460) {
          this.applyActorDamage(actor, 340, true);
        }
      }
    }

    this.emitHudState();
    return true;
  }

  public summonPlayerDragon(): boolean {
    if (this.gameState !== 'playing') return false;
    if (this.dragonCooldown > 0 || this.activeDragon.active) return false;

    this.dragonCooldown = this.dragonMaxCooldown;
    this.activeDragon = {
      active: true,
      side: 'ally',
      x: 340,
      y: 185,
      vx: 280,
      wingPhase: 0.4,
      breathTick: 0,
    };
    soundEngine.playDragonRoar();
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.55);
    this.emitHudState();
    return true;
  }

  private summonEnemyDragon(): void {
    if (this.activeDragon.active) return;
    this.activeDragon = {
      active: true,
      side: 'enemy',
      x: WORLD_WIDTH - 40,
      y: 185,
      vx: -300,
      wingPhase: 0,
      breathTick: 0,
    };
    soundEngine.playDragonRoar();
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.45);
  }

  public triggerManualHeroAttack(): void {
    this.attackBufferTimer = 0.14;
  }

  public debugTriggerVictory(): void {
    if (this.gameState !== 'playing') return;
    this.damageCastle('enemy', this.enemyCastleHp + 100);
  }

  private spawnCallout(text: string, x: number, y: number, color = '#fde047'): void {
    if (this.callouts.length >= 14) {
      this.callouts.shift();
    }
    this.callouts.push({
      text,
      x,
      y,
      vy: -36,
      life: 1.05,
      maxLife: 1.05,
      color,
    });
  }

  private updateCallouts(dt: number): void {
    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      c.y += c.vy * dt;
      if (c.life <= 0) {
        this.callouts.splice(i, 1);
      }
    }
  }

  private update(dt: number): void {
    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.6);
    this.updateParticles(dt);
    this.updateCallouts(dt);

    if (this.gameState === 'title') {
      this.titlePanTime += dt;
      if (Math.random() < dt * 12) {
        this.spawnParticle({
          x: Math.random() * WORLD_WIDTH,
          y: GROUND_Y - Math.random() * 240,
          vx: 15 + Math.random() * 25,
          vy: -20 - Math.random() * 30,
          size: 2.5 + Math.random() * 2,
          life: 2.2,
          color: '#fbbf24',
          gravity: 0,
          glow: true,
        });
      }
      return;
    }

    if (this.gameState === 'gameover' && this.celebrationMode) {
      this.fireworkTimer -= dt;
      if (this.fireworkTimer <= 0) {
        this.fireworkTimer = 0.42;
        const fx = 250 + Math.random() * (WORLD_WIDTH - 500);
        const fy = 110 + Math.random() * 240;
        const palette = ['#fef08a', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7', '#4ade80'];
        const color = palette[Math.floor(Math.random() * palette.length)];
        this.spawnBurst(fx, fy, 28, color, true);
        soundEngine.playFireworkBurst();
      }
      return;
    }

    if (this.gameState !== 'playing') return;

    this.processGameplayInputs(dt);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      for (const actor of this.actors) {
        if (actor.hitFlashTimer > 0) {
          actor.hitFlashTimer = Math.max(0, actor.hitFlashTimer - dt);
        }
      }
      return;
    }

    if (this.pendingOutcome !== null) {
      this.endBeatTimer -= dt;
      if (this.endBeatTimer <= 0) {
        this.finalizeBattle(this.pendingOutcome === 'victory');
      }
      return;
    }

    this.elapsedSeconds += dt;
    this.battleGold += this.levelConfig.goldPerSecond * dt;

    for (const k of Object.keys(this.unitCooldowns) as UnitType[]) {
      if (this.unitCooldowns[k] > 0) {
        this.unitCooldowns[k] = Math.max(0, this.unitCooldowns[k] - dt);
      }
    }
    if (this.heroSkillCooldown > 0) {
      this.heroSkillCooldown = Math.max(0, this.heroSkillCooldown - dt);
    }
    if (this.dragonCooldown > 0) {
      this.dragonCooldown = Math.max(0, this.dragonCooldown - dt);
    }

    this.playerCastleGhostHp += (this.playerCastleHp - this.playerCastleGhostHp) * Math.min(1, dt * 4.5);
    this.enemyCastleGhostHp += (this.enemyCastleHp - this.enemyCastleGhostHp) * Math.min(1, dt * 4.5);
    if (this.playerCastleFlash > 0) this.playerCastleFlash = Math.max(0, this.playerCastleFlash - dt);
    if (this.enemyCastleFlash > 0) this.enemyCastleFlash = Math.max(0, this.enemyCastleFlash - dt);

    this.updatePlayerBastionTower(dt);
    this.updateDragons(dt);

    // Cumulative Enemy Spawning: spawns previous enemy tiers + alternates the two Cartoon Boss Commanders!
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.levelConfig.spawnInterval * (0.88 + Math.random() * 0.24);
      const activeEnemies = this.actors.filter((a) => a.side === 'enemy' && a.koTimer === 0).length;
      if (activeEnemies < 10) {
        const roster = getEnemyRosterForLevel(this.levelConfig.level);
        this.bossWaveCounter++;
        const isBossWave = this.bossWaveCounter % 3 === 0;
        const pick = isBossWave
          ? this.bossWaveCounter % 6 === 0
            ? this.levelConfig.coBossEnemy
            : this.levelConfig.featuredEnemy
          : roster[Math.floor(Math.random() * roster.length)];
        const bossPortrait =
          this.bossWaveCounter % 2 === 0 ? BOSS_PORTRAIT_1 : BOSS_PORTRAIT_2;
        this.spawnEnemyFromTier(pick, ENEMY_CASTLE_X - 55, isBossWave, bossPortrait);

        // Tactical Coordinated Escort on Boss Waves (Level >= 3)
        if (isBossWave && this.levelConfig.level >= 3 && activeEnemies < 8) {
          const escort = roster[Math.max(0, roster.length - 2)];
          const escortPortrait = bossPortrait === BOSS_PORTRAIT_1 ? BOSS_PORTRAIT_2 : BOSS_PORTRAIT_1;
          this.spawnEnemyFromTier(escort, ENEMY_CASTLE_X - 108, false, escortPortrait);
        }
      }
    }

    this.updateActors(dt);
    this.updateProjectiles(dt);

    const outcome = checkBattleOutcome(this.playerCastleHp, this.enemyCastleHp);
    if (outcome !== 'ongoing' && this.pendingOutcome === null) {
      this.pendingOutcome = outcome;
      this.endBeatTimer = 0.45;
      this.cameraTrauma = 0.85;
      if (outcome === 'victory') {
        this.spawnBurst(ENEMY_CASTLE_X, GROUND_Y - 90, 45, '#f59e0b', true);
        soundEngine.playSiegeBoom();
      } else {
        this.spawnBurst(PLAYER_CASTLE_X, GROUND_Y - 90, 45, '#ef4444', true);
        soundEngine.playSiegeBoom();
      }
    }

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.1) {
      this.hudSyncAccum = 0;
      this.emitHudState();
    }
  }

  private processGameplayInputs(dt: number): void {
    if (this.keysJustPressed.has('Digit1')) this.deployUnit('swordsman');
    if (this.keysJustPressed.has('Digit2')) this.deployUnit('archer');
    if (this.keysJustPressed.has('Digit3')) this.deployUnit('knight');
    if (this.keysJustPressed.has('Digit4')) this.deployUnit('siege');
    if (this.keysJustPressed.has('Digit5')) this.upgradeWall();
    if (this.keysJustPressed.has('Digit6')) this.upgradeTower();
    if (this.keysJustPressed.has('KeyQ')) this.triggerHeroSkill();
    if (this.keysJustPressed.has('KeyE')) this.summonPlayerDragon();

    if (this.keysJustPressed.has('Space')) {
      this.attackBufferTimer = 0.14;
    } else if (this.attackBufferTimer > 0) {
      this.attackBufferTimer = Math.max(0, this.attackBufferTimer - dt);
    }

    if (!this.heroActor || this.heroActor.koTimer > 0) {
      if (this.heroRespawnTimer > 0) {
        this.heroRespawnTimer -= dt;
        if (this.heroRespawnTimer <= 0) {
          this.spawnHero();
        }
      }
      return;
    }

    const moveLeft = this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft');
    const moveRight = this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight');

    let moveDir = 0;
    if (moveLeft && !moveRight) {
      moveDir = -1;
      this.pointerTargetX = null;
    } else if (moveRight && !moveLeft) {
      moveDir = 1;
      this.pointerTargetX = null;
    } else if (this.pointerTargetX !== null) {
      const diff = this.pointerTargetX - this.heroActor.x;
      if (Math.abs(diff) > 12) {
        moveDir = Math.sign(diff);
      } else {
        this.pointerTargetX = null;
      }
    }

    this.heroActor.vx = moveDir * this.heroActor.moveSpeed;
    this.heroActor.x = Math.max(
      PLAYER_CASTLE_X + 60,
      Math.min(ENEMY_CASTLE_X - 65, this.heroActor.x + this.heroActor.vx * dt)
    );
  }

  private updatePlayerBastionTower(dt: number): void {
    this.towerFireTimer -= dt;
    if (this.towerFireTimer > 0) return;

    const cooldown = Math.max(0.55, 1.4 - (this.towerLevel - 1) * 0.18);
    const towerRange = 500 + (this.towerLevel - 1) * 60;
    const towerDamage = 34 + (this.towerLevel - 1) * 24;

    let nearestEnemy: CombatActor | null = null;
    let bestDist = Infinity;
    for (const actor of this.actors) {
      if (actor.side !== 'enemy' || actor.koTimer > 0) continue;
      const dist = actor.x - PLAYER_CASTLE_X;
      if (dist <= towerRange && dist < bestDist) {
        bestDist = dist;
        nearestEnemy = actor;
      }
    }

    if (nearestEnemy) {
      this.towerFireTimer = cooldown;
      const dx = nearestEnemy.x - (PLAYER_CASTLE_X + 20);
      const dy = nearestEnemy.y - 28 - (GROUND_Y - 195);
      const flightTime = Math.max(0.25, Math.min(0.65, Math.abs(dx) / 680));
      this.spawnProjectile({
        side: 'ally',
        kind: this.towerLevel >= 3 ? 'fireball' : 'bolt',
        x: PLAYER_CASTLE_X + 20,
        y: GROUND_Y - 195,
        vx: dx / flightTime,
        vy: dy / flightTime - 0.5 * 160 * flightTime,
        gravity: 160,
        damage: towerDamage,
        splashRadius: this.towerLevel >= 3 ? 55 : 0,
        color: this.towerLevel >= 3 ? '#fbbf24' : '#38bdf8',
      });
      soundEngine.playBowRelease();
    }
  }

  private updateDragons(dt: number): void {
    if (this.levelConfig.hasEnemyDragon && !this.activeDragon.active) {
      this.enemyDragonTimer -= dt;
      if (this.enemyDragonTimer <= 3.0 && this.enemyDragonTimer > 0) {
        this.enemyDragonWarning = this.enemyDragonTimer;
      } else {
        this.enemyDragonWarning = 0;
      }
      if (this.enemyDragonTimer <= 0) {
        this.enemyDragonTimer = this.levelConfig.enemyDragonInterval;
        this.enemyDragonWarning = 0;
        this.summonEnemyDragon();
      }
    }

    if (!this.activeDragon.active) return;

    const d = this.activeDragon;
    d.x += d.vx * dt;
    // Vigorous realistic wing-flapping cadence
    d.wingPhase += dt * 11.2;
    d.breathTick -= dt;

    if (d.breathTick <= 0 && d.x > PLAYER_CASTLE_X + 60 && d.x < ENEMY_CASTLE_X - 40) {
      d.breathTick = 0.07;
      const breathX = d.x + (d.side === 'ally' ? 115 : -115);
      const primaryFlame = d.side === 'ally' ? '#f59e0b' : '#ec4899';
      const coreFlame = d.side === 'ally' ? '#fef08a' : '#f43f5e';

      for (let i = 0; i < 6; i++) {
        this.spawnParticle({
          x: d.x + (d.side === 'ally' ? 72 : -72),
          y: d.y + 18,
          vx: (d.side === 'ally' ? 290 : -290) + (Math.random() - 0.5) * 95,
          vy: 360 + Math.random() * 95,
          size: 6 + Math.random() * 6,
          life: 0.55,
          color: i % 2 === 0 ? coreFlame : primaryFlame,
          gravity: 0,
          glow: true,
        });
      }

      for (const actor of this.actors) {
        if (actor.koTimer > 0 || actor.side === d.side) continue;
        if (Math.abs(actor.x - breathX) <= 95) {
          this.applyActorDamage(actor, d.side === 'ally' ? 48 : 24, true);
        }
      }

      if (d.side === 'ally' && Math.abs(ENEMY_CASTLE_X - breathX) <= 125) {
        this.damageCastle('enemy', 55);
      } else if (d.side === 'enemy' && Math.abs(PLAYER_CASTLE_X - breathX) <= 125) {
        this.damageCastle('ally', 25);
      }
    }

    if (d.side === 'ally' && d.x > WORLD_WIDTH + 220) {
      d.active = false;
    } else if (d.side === 'enemy' && d.x < -220) {
      d.active = false;
    }
  }

  private hasFrontlineEscortAhead(archerActor: CombatActor): boolean {
    if (archerActor.side !== 'ally') return false;
    for (const ally of this.actors) {
      if (ally.side !== 'ally' || ally.koTimer > 0) continue;
      if (ally.isHero || ally.unitType === 'swordsman' || ally.unitType === 'knight') {
        const ahead = ally.x - archerActor.x;
        if (ahead >= -15 && ahead <= 220) {
          return true;
        }
      }
    }
    return false;
  }

  private updateActors(dt: number): void {
    let activeEnemyWindups = 0;
    for (const a of this.actors) {
      if (a.side === 'enemy' && a.windupTimer > 0) activeEnemyWindups++;
    }

    // Progressive Castle Distance: each level increases the effective road length between the two castles,
    // giving the player more time to build gold and counter enemy waves!
    const distanceFactor = 1150 / Math.max(1150, this.levelConfig.castleDistance);
    const heroX = this.heroActor && this.heroActor.koTimer === 0 ? this.heroActor.x : null;

    for (let i = this.actors.length - 1; i >= 0; i--) {
      const actor = this.actors[i];

      actor.scaleX += (1 - actor.scaleX) * Math.min(1, dt * 12);
      actor.scaleY += (1 - actor.scaleY) * Math.min(1, dt * 12);
      actor.ghostHp += (actor.hp - actor.ghostHp) * Math.min(1, dt * 5);
      if (actor.swingAnim > 0) {
        actor.swingAnim = Math.max(0, actor.swingAnim - dt * 3.5);
      }

      if (actor.hitFlashTimer > 0) {
        actor.hitFlashTimer = Math.max(0, actor.hitFlashTimer - dt);
      }

      if (actor.koTimer > 0) {
        actor.koTimer -= dt;
        actor.koRotation += (actor.side === 'ally' ? -1 : 1) * dt * 4.2;
        actor.x += (actor.side === 'ally' ? -45 : 45) * dt;
        if (actor.koTimer <= 0) {
          this.actors.splice(i, 1);
        }
        continue;
      }

      if (actor.stunTimer > 0) {
        actor.stunTimer = Math.max(0, actor.stunTimer - dt);
        continue;
      }

      // Hero Commander Aura: allied units within 210px of the Hero recover attack cooldown 25% faster!
      const inHeroAura =
        actor.side === 'ally' && !actor.isHero && heroX !== null && Math.abs(actor.x - heroX) <= 210;
      const cooldownRate = inHeroAura ? 1.25 : 1.0;

      if (actor.attackTimer > 0) {
        actor.attackTimer = Math.max(0, actor.attackTimer - dt * cooldownRate);
      }

      if (actor.behaviorPolicy === 'shielded') {
        actor.shieldCycleTimer += dt;
        actor.shieldRaised = actor.shieldCycleTimer % 5.0 < 2.6;
      }

      const dir = actor.side === 'ally' ? 1 : -1;
      let targetActor: CombatActor | null = null;
      let minDist = Infinity;

      for (const other of this.actors) {
        if (other.side === actor.side || other.koTimer > 0) continue;
        const dist = (other.x - actor.x) * dir;
        if (dist >= -28 && dist < minDist) {
          minDist = dist;
          targetActor = other;
        }
      }

      const enemyCastleDist =
        actor.side === 'ally' ? ENEMY_CASTLE_X - 50 - actor.x : actor.x - (PLAYER_CASTLE_X + 50);
      const effectiveDist = Math.min(minDist, enemyCastleDist);

      if (actor.windupTimer > 0) {
        actor.windupTimer -= dt;
        if (actor.windupTimer <= 0) {
          this.executeActorAttack(actor, targetActor, enemyCastleDist <= actor.range);
        }
        continue;
      }

      if (actor.isHero) {
        const distMoved = Math.abs(actor.vx) * dt;
        if (distMoved > 0.1) {
          actor.walkPhase += distMoved * 0.175;
          if (Math.random() < dt * 14) {
            this.spawnParticle({
              x: actor.x - Math.sign(actor.vx || 1) * 18,
              y: GROUND_Y + 4,
              vx: -Math.sign(actor.vx || 1) * (35 + Math.random() * 30),
              vy: -18 - Math.random() * 20,
              size: 2.5 + Math.random() * 2,
              life: 0.28,
              color: '#d6d3d1',
              gravity: 110,
              glow: false,
            });
          }
        } else {
          // Gentle steed idle pawing
          actor.walkPhase += dt * 2.4;
        }

        const wantsAttack = this.attackBufferTimer > 0 || effectiveDist <= actor.range;
        if (wantsAttack && actor.attackTimer <= 0 && effectiveDist <= actor.range + 28) {
          this.attackBufferTimer = 0;
          actor.attackTimer = actor.attackCooldown;
          actor.scaleX = 1.18;
          actor.scaleY = 0.86;
          actor.swingAnim = 1;
          this.executeActorAttack(actor, targetActor, enemyCastleDist <= actor.range + 28);
        }
        continue;
      }

      if (effectiveDist <= actor.range) {
        if (
          actor.behaviorPolicy === 'kiter' &&
          minDist < 95 &&
          actor.attackTimer > 0.25 &&
          actor.x < ENEMY_CASTLE_X - 95
        ) {
          const retreatStep = actor.moveSpeed * 0.65 * dt;
          actor.x += retreatStep;
          actor.walkPhase += retreatStep * 0.175;
          continue;
        }

        if (actor.attackTimer <= 0) {
          if (actor.side === 'enemy' && activeEnemyWindups >= 4) {
            actor.attackTimer = 0.15;
            continue;
          }
          actor.windupTimer = actor.windupMax;
          actor.attackTimer = actor.attackCooldown;
          if (actor.behaviorPolicy === 'siege_telegraph') {
            actor.targetGroundX = targetActor ? targetActor.x : PLAYER_CASTLE_X + 30;
          }
          if (actor.side === 'enemy') activeEnemyWindups++;
        }
      } else {
        let speedMult = 1;
        if (actor.behaviorPolicy === 'charger' && effectiveDist < 260) {
          actor.isCharging = true;
          speedMult = 1.75;
        } else {
          actor.isCharging = false;
        }

        if (actor.behaviorPolicy === 'swarmer' && effectiveDist < 140) {
          speedMult = 1.25;
        }

        // Apply progressive castleDistance scaling so enemy armies take longer to cross larger realms
        const marchRatio = actor.side === 'enemy' ? distanceFactor : Math.max(0.78, distanceFactor * 1.12);
        const step = dir * actor.moveSpeed * speedMult * marchRatio * dt;
        actor.x += step;
        actor.walkPhase += Math.abs(step) * 0.175;

        // Subtle hoof-dust kicks when horses gallop across the causeway
        if (!actor.isSiege && Math.random() < dt * 8) {
          this.spawnParticle({
            x: actor.x - dir * 16,
            y: GROUND_Y + 4,
            vx: -dir * (25 + Math.random() * 25),
            vy: -14 - Math.random() * 16,
            size: 2 + Math.random() * 1.8,
            life: 0.25,
            color: '#a8a29e',
            gravity: 90,
            glow: false,
          });
        }

        // All horse-riding units and bosses remain firmly planted on the land causeway
        actor.y = GROUND_Y;
      }
    }
  }

  private executeActorAttack(
    attacker: CombatActor,
    targetActor: CombatActor | null,
    canHitCastle: boolean
  ): void {
    const dir = attacker.side === 'ally' ? 1 : -1;
    attacker.scaleX = 1.15;
    attacker.scaleY = 0.88;
    attacker.swingAnim = 1;

    // Evaluate Tactical Counter & Combined-Arms Formation Synergy for Allied Attackers
    const tactical =
      attacker.side === 'ally' && targetActor
        ? computeTacticalCounter({
            attackerUnitType: attacker.unitType,
            isHero: attacker.isHero,
            targetPolicy: targetActor.behaviorPolicy,
            isTargetBoss: targetActor.isFeaturedFace,
            isTargetWindingUp: targetActor.windupTimer > 0,
            hasFrontlineEscort:
              attacker.unitType === 'archer' ? this.hasFrontlineEscortAhead(attacker) : false,
          })
        : {
            damageMultiplier: 1.0,
            breaksShield: false,
            stunSeconds: 0,
            bonusGold: 0,
            callout: null,
          };

    if (tactical.callout && targetActor) {
      this.spawnCallout(
        tactical.callout,
        targetActor.x,
        targetActor.y - 125,
        attacker.isHero ? '#38bdf8' : '#fde047'
      );
    }
    if (tactical.bonusGold > 0) {
      this.battleGold += tactical.bonusGold;
      this.score += 120;
    }

    if (attacker.isRanged) {
      const targetX =
        attacker.behaviorPolicy === 'siege_telegraph' && attacker.targetGroundX > 0
          ? attacker.targetGroundX
          : targetActor
            ? targetActor.x
            : attacker.side === 'ally'
              ? ENEMY_CASTLE_X - 30
              : PLAYER_CASTLE_X + 30;

      const dx = targetX - attacker.x;
      const flightTime = Math.max(0.28, Math.min(0.85, Math.abs(dx) / (attacker.isSiege ? 430 : 620)));
      const gravity = attacker.isSiege ? 380 : 170;
      const vy = -0.5 * gravity * flightTime;

      const projectileDmg = Math.round(attacker.damage * tactical.damageMultiplier);

      this.spawnProjectile({
        side: attacker.side,
        kind: attacker.isSiege ? 'boulder' : attacker.side === 'ally' ? 'arrow' : 'bolt',
        x: attacker.x + dir * 22,
        y: attacker.y - 36,
        vx: dx / flightTime,
        vy,
        gravity,
        damage: projectileDmg,
        splashRadius: attacker.splashRadius,
        color: attacker.color,
        breaksShield: tactical.breaksShield,
      });

      if (attacker.isSiege) {
        soundEngine.playSiegeBoom();
      } else {
        soundEngine.playBowRelease();
      }
      return;
    }

    soundEngine.playSwordSwing();
    if (targetActor && Math.abs(targetActor.x - attacker.x) <= attacker.range + 32) {
      if (tactical.breaksShield) {
        targetActor.shieldRaised = false;
      }
      if (tactical.stunSeconds > 0) {
        targetActor.windupTimer = 0;
        targetActor.stunTimer = Math.max(targetActor.stunTimer, tactical.stunSeconds);
      }

      const isHeavy =
        attacker.isCharging ||
        attacker.unitType === 'knight' ||
        attacker.isHero ||
        tactical.damageMultiplier > 1.2;
      const chargeMult = attacker.isCharging ? 1.35 : 1.0;
      const bonusDmg = Math.round(attacker.damage * chargeMult * tactical.damageMultiplier);
      this.applyActorDamage(targetActor, bonusDmg, Boolean(isHeavy));
      attacker.isCharging = false;
    } else if (canHitCastle) {
      const castleDmg =
        attacker.unitType === 'siege' ? Math.round(attacker.damage * 1.8) : attacker.damage;
      this.damageCastle(attacker.side === 'ally' ? 'enemy' : 'ally', castleDmg);
    }
  }

  private applyActorDamage(target: CombatActor, rawDamage: number, heavy = false): void {
    if (target.koTimer > 0) return;
    const dmg = computeDamage(rawDamage, target.armor, target.shieldRaised);
    target.hp = Math.max(0, target.hp - dmg);
    target.hitFlashTimer = 0.055;
    target.scaleX = 0.86;
    target.scaleY = 1.15;

    const dir = target.side === 'enemy' ? 1 : -1;
    if (heavy) {
      target.x += dir * 14;
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.036);
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.2);
    }

    soundEngine.playHit(heavy);
    this.spawnBurst(
      target.x,
      target.y - 32,
      heavy ? 14 : 6,
      target.side === 'enemy' ? '#fbbf24' : '#f87171',
      heavy
    );

    if (target.hp <= 0) {
      target.koTimer = 0.36;
      if (target.side === 'enemy') {
        this.enemiesDefeated++;
        this.battleGold += target.goldDrop;
        this.score += target.scoreValue;
      } else if (target.isHero) {
        this.heroRespawnTimer = 6.0;
      }
    }
  }

  private damageCastle(targetSide: 'ally' | 'enemy', amount: number): void {
    if (targetSide === 'enemy') {
      this.enemyCastleHp = Math.max(0, this.enemyCastleHp - amount);
      this.enemyCastleFlash = 0.06;
      this.damageDealtToCastle += amount;
      this.score += Math.round(amount * 0.6);
      this.spawnBurst(ENEMY_CASTLE_X - 40, GROUND_Y - 75, 14, '#f97316', true);
    } else {
      const wallMitigation = Math.max(0.55, 1 - (this.wallLevel - 1) * 0.09);
      const finalDmg = Math.max(4, Math.round(amount * wallMitigation));
      this.playerCastleHp = Math.max(0, this.playerCastleHp - finalDmg);
      this.playerCastleFlash = 0.06;
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.18);
      this.spawnBurst(PLAYER_CASTLE_X + 40, GROUND_Y - 75, 12, '#ef4444', true);
    }
    soundEngine.playHit(true);
  }

  private spawnProjectile(p: Omit<Projectile, 'active'>): void {
    const slot = this.projectiles[this.projectileCursor];
    this.projectileCursor = (this.projectileCursor + 1) % MAX_PROJECTILES;
    slot.active = true;
    slot.side = p.side;
    slot.kind = p.kind;
    slot.x = p.x;
    slot.y = p.y;
    slot.vx = p.vx;
    slot.vy = p.vy;
    slot.gravity = p.gravity;
    slot.damage = p.damage;
    slot.splashRadius = p.splashRadius;
    slot.color = p.color;
    slot.breaksShield = p.breaksShield;
  }

  private updateProjectiles(dt: number): void {
    for (const pr of this.projectiles) {
      if (!pr.active) continue;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.vy += pr.gravity * dt;

      if (pr.kind === 'meteor' || pr.kind === 'fireball' || pr.kind === 'boulder') {
        if (Math.random() < 0.65) {
          this.spawnParticle({
            x: pr.x,
            y: pr.y,
            vx: -pr.vx * 0.12,
            vy: -20,
            size: 4,
            life: 0.28,
            color: pr.color,
            gravity: 0,
            glow: true,
          });
        }
      }

      let hit = false;
      if (pr.splashRadius <= 0) {
        for (const actor of this.actors) {
          if (actor.side === pr.side || actor.koTimer > 0) continue;
          if (Math.abs(actor.x - pr.x) <= 28 && Math.abs(actor.y - 32 - pr.y) <= 38) {
            if (pr.breaksShield) actor.shieldRaised = false;
            this.applyActorDamage(actor, pr.damage, false);
            hit = true;
            break;
          }
        }
      }

      const hitEnemyCastle = pr.side === 'ally' && pr.x >= ENEMY_CASTLE_X - 45;
      const hitPlayerCastle = pr.side === 'enemy' && pr.x <= PLAYER_CASTLE_X + 45;
      const hitGround = pr.y >= GROUND_Y;

      if (hit || hitEnemyCastle || hitPlayerCastle || hitGround) {
        pr.active = false;
        if (pr.splashRadius > 0) {
          this.spawnBurst(pr.x, Math.min(GROUND_Y, pr.y), 20, pr.color, true);
          soundEngine.playSiegeBoom();
          for (const actor of this.actors) {
            if (actor.side === pr.side || actor.koTimer > 0) continue;
            if (Math.abs(actor.x - pr.x) <= pr.splashRadius) {
              if (pr.breaksShield) actor.shieldRaised = false;
              this.applyActorDamage(actor, pr.damage, true);
            }
          }
          if (pr.side === 'ally' && Math.abs(ENEMY_CASTLE_X - pr.x) <= pr.splashRadius + 50) {
            const siegeBonus = pr.kind === 'boulder' ? Math.round(pr.damage * 1.75) : pr.damage;
            this.damageCastle('enemy', siegeBonus);
          } else if (pr.side === 'enemy' && Math.abs(PLAYER_CASTLE_X - pr.x) <= pr.splashRadius + 50) {
            this.damageCastle('ally', pr.damage);
          }
        } else if (hitEnemyCastle) {
          this.damageCastle('enemy', pr.damage);
        } else if (hitPlayerCastle) {
          this.damageCastle('ally', pr.damage);
        }
      }
    }
  }

  private spawnParticle(params: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    color: string;
    gravity: number;
    glow: boolean;
  }): void {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % MAX_PARTICLES;
    p.active = true;
    p.x = params.x;
    p.y = params.y;
    p.vx = params.vx;
    p.vy = params.vy;
    p.size = params.size;
    p.life = params.life;
    p.maxLife = params.life;
    p.color = params.color;
    p.gravity = params.gravity;
    p.glow = params.glow;
  }

  public spawnBurst(x: number, y: number, count: number, color: string, glow = false): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 190;
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 2.5 + Math.random() * 4,
        life: 0.35 + Math.random() * 0.45,
        color,
        gravity: 280,
        glow,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }

  private finalizeBattle(victory: boolean): void {
    const clearTime = Math.max(1, Math.round(this.elapsedSeconds));
    const finalScore = calculateBattleScore({
      victory,
      level: this.levelConfig.level,
      clearTimeSeconds: clearTime,
      parTimeSeconds: this.levelConfig.parTimeSeconds,
      playerCastleHp: this.playerCastleHp,
      playerCastleMaxHp: this.playerCastleMaxHp,
      enemiesDefeated: this.enemiesDefeated,
      damageDealtToCastle: this.damageDealtToCastle,
    });

    const stars = calculateStars({
      victory,
      clearTimeSeconds: clearTime,
      parTimeSeconds: this.levelConfig.parTimeSeconds,
      playerCastleHp: this.playerCastleHp,
      playerCastleMaxHp: this.playerCastleMaxHp,
    });

    const coinsEarned = calculateCoinReward({
      victory,
      levelConfig: this.levelConfig,
      stars,
      enemiesDefeated: this.enemiesDefeated,
    });

    const newRecord = victory && isNewHighScore(finalScore, this.highScore);
    const prevBest = this.highScore;
    if (newRecord) {
      this.highScore = finalScore;
      this.celebrationMode = true;
      this.fireworkTimer = 0.05;
    }

    if (victory) {
      soundEngine.playVictory(newRecord);
    } else {
      soundEngine.playDefeat();
    }

    const snapshot: BattleSnapshot = {
      victory,
      level: this.levelConfig.level,
      levelName: this.levelConfig.name,
      clearTimeSeconds: clearTime,
      score: finalScore,
      previousBestScore: prevBest,
      isNewHighScore: newRecord,
      coinsEarned,
      enemiesDefeated: this.enemiesDefeated,
      playerCastleHpPct: Math.round((this.playerCastleHp / Math.max(1, this.playerCastleMaxHp)) * 100),
      enemyCastleHpPct: Math.round((this.enemyCastleHp / Math.max(1, this.enemyCastleMaxHp)) * 100),
      starsEarned: stars,
    };

    this.setGameState('gameover');
    this.onBattleEnd(snapshot);
  }

  public emitHudState(): void {
    const heroMax = this.heroActor ? this.heroActor.maxHp : HEROES[this.heroId].maxHp;
    const heroHp = this.heroActor && this.heroActor.koTimer === 0 ? Math.round(this.heroActor.hp) : 0;

    this.onHudUpdate({
      level: this.levelConfig.level,
      levelName: this.levelConfig.name,
      castleDistance: this.levelConfig.castleDistance,
      featuredEnemyName: this.levelConfig.featuredEnemy.name,
      featuredEnemyTitle: this.levelConfig.featuredEnemy.title,
      featuredBossPortraitUrl: this.levelConfig.featuredEnemy.bossPortraitUrl,
      secondaryBossPortraitUrl: this.levelConfig.coBossEnemy.bossPortraitUrl,
      battleGold: Math.floor(this.battleGold),
      goldRate: this.levelConfig.goldPerSecond,
      score: Math.round(this.score),
      highScore: Math.max(this.highScore, Math.round(this.score)),
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      playerCastleHp: Math.round(this.playerCastleHp),
      playerCastleMaxHp: Math.round(this.playerCastleMaxHp),
      enemyCastleHp: Math.round(this.enemyCastleHp),
      enemyCastleMaxHp: Math.round(this.enemyCastleMaxHp),
      heroHp,
      heroMaxHp: heroMax,
      heroSkillCooldown: Number(this.heroSkillCooldown.toFixed(1)),
      heroSkillMaxCooldown: this.heroSkillMaxCooldown,
      dragonCooldown: Number(this.dragonCooldown.toFixed(1)),
      dragonMaxCooldown: this.dragonMaxCooldown,
      dragonActive: this.activeDragon.active && this.activeDragon.side === 'ally',
      enemyDragonWarning: Number(this.enemyDragonWarning.toFixed(1)),
      wallLevel: this.wallLevel,
      towerLevel: this.towerLevel,
      unitCooldowns: { ...this.unitCooldowns },
      unitMaxCooldowns: {
        swordsman: ALLY_UNITS.swordsman.cooldown,
        archer: ALLY_UNITS.archer.cooldown,
        knight: ALLY_UNITS.knight.cooldown,
        siege: ALLY_UNITS.siege.cooldown,
      },
    });
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === 0 || h === 0) return;

    ctx.save();
    ctx.scale(w / WORLD_WIDTH, h / WORLD_HEIGHT);

    const shakeMag = this.cameraTrauma * this.cameraTrauma * 14;
    if (shakeMag > 0.2) {
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }

    // 1. Raylib High-Resolution Battlefield Background Texture (with procedural fallback while loading)
    const drewBg = this.rl.DrawTexturePro(
      this.texBg,
      { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT },
      { x: 0, y: 0 },
      0,
      false,
      1
    );

    if (!drewBg) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#33485e');
      skyGrad.addColorStop(0.45, '#647d94');
      skyGrad.addColorStop(0.82, '#94a8b8');
      skyGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

      this.drawDistantSilhouetteLandscape(ctx);

      const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 14, 0, WORLD_HEIGHT);
      groundGrad.addColorStop(0, '#4d6b32');
      groundGrad.addColorStop(0.28, '#364e22');
      groundGrad.addColorStop(0.65, '#1e2c14');
      groundGrad.addColorStop(1, '#0c1309');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, GROUND_Y - 14, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y + 14);
    }

    // 2. Towering Center Boss Dragon ONLY on Title Screen (never standing in the fighting zone during active battles!)
    if (this.gameState === 'title') {
      this.drawCenterColossusDragon(ctx);
    }

    // 3. Stone Battle Causeway & Glowing Cyan Deployment Chevron Arrows (>>>)
    const roadGrad = ctx.createLinearGradient(0, GROUND_Y - 14, 0, GROUND_Y + 28);
    roadGrad.addColorStop(0, 'rgba(133, 119, 99, 0.55)');
    roadGrad.addColorStop(0.5, 'rgba(168, 153, 132, 0.65)');
    roadGrad.addColorStop(1, 'rgba(87, 76, 63, 0.55)');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(210, GROUND_Y - 12, WORLD_WIDTH - 420, 34);

    for (let i = 0; i < 3; i++) {
      const ax = 430 + i * 95;
      const ay = GROUND_Y + 4;
      const pulse = 0.65 + Math.sin(this.elapsedSeconds * 5 - i * 0.9) * 0.3;
      ctx.save();
      ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax - 22, ay - 6);
      ctx.lineTo(ax + 6, ay - 6);
      ctx.lineTo(ax + 6, ay - 13);
      ctx.lineTo(ax + 28, ay);
      ctx.lineTo(ax + 6, ay + 13);
      ctx.lineTo(ax + 6, ay + 6);
      ctx.lineTo(ax - 22, ay + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Left Fortress ("Castle of Gaza") & Right Fortress ("Castle of Epstein" with Enemy Flag)
    this.drawPlayerCastle(ctx);
    this.drawEnemyCastle(ctx);

    // 5. Actors, Units, Projectiles & Swooping Dragon Raids
    if (this.gameState === 'title') {
      this.drawTitleStageActors(ctx);
    } else {
      this.drawAttackTelegraphs(ctx);

      for (const actor of this.actors) {
        this.drawActor(ctx, actor);
      }

      this.drawProjectiles(ctx);

      if (this.activeDragon.active) {
        this.drawDragon(ctx, this.activeDragon);
      }
    }

    // 6. Particles, Tactical Callouts & Foreground Framing
    this.drawParticles(ctx);
    this.drawCallouts(ctx);
    this.drawForegroundVignette(ctx);

    if (
      this.gameState === 'playing' &&
      this.playerCastleHp / Math.max(1, this.playerCastleMaxHp) < 0.28
    ) {
      const pulse = 0.18 + Math.sin(this.elapsedSeconds * 6) * 0.08;
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 24;
      ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    ctx.restore();
  }

  private drawDistantSilhouetteLandscape(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#687f94';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(0, 390);
    ctx.lineTo(280, 320);
    ctx.lineTo(540, 420);
    ctx.lineTo(820, 340);
    ctx.lineTo(1120, 410);
    ctx.lineTo(WORLD_WIDTH, 330);
    ctx.lineTo(WORLD_WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // Draws the towering Winged Fire Dragon in the center background with Articulated Flapping Wings
  private drawCenterColossusDragon(ctx: CanvasRenderingContext2D): void {
    const t = this.gameState === 'title' ? this.titlePanTime : this.elapsedSeconds;
    const breathHover = Math.sin(t * 2.2) * 8;
    const dx = 775;
    const dy = GROUND_Y - 175 + breathHover;

    const drewDragon = this.rl.DrawAnimatedDragonPro(
      this.texDragon,
      { x: dx, y: dy, width: 390, height: 390 },
      { x: 195, y: 195 },
      0,
      true, // Flip horizontally so the rearing background dragon faces left toward the player
      t * 8.5,
      0.96
    );

    if (drewDragon) {
      // Blazing Fireball Blast Erupting from the Dragon's Jaws
      const fbX = dx - 155;
      const fbY = dy - 38;
      const fireGrad = ctx.createRadialGradient(fbX, fbY, 10, fbX, fbY, 64);
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.32, '#fef08a');
      fireGrad.addColorStop(0.68, '#f97316');
      fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.save();
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(fbX, fbY, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
  }

  // Draws Left Fortress: "CASTLE OF GAZA" using the high-resolution Raylib Castle Ally Sprite Texture
  private drawPlayerCastle(ctx: CanvasRenderingContext2D): void {
    const spread = this.gameState === 'title' ? 0 : Math.min(48, (this.levelConfig.level - 1) * 2.5);
    const cx = PLAYER_CASTLE_X - spread * 0.5;
    const castleH = 400 + (this.wallLevel - 1) * 10;
    const castleW = 370;

    ctx.save();

    const drewCastle = this.rl.DrawTexturePro(
      this.texCastleAlly,
      { x: 175 - spread, y: GROUND_Y + 34, width: castleW, height: castleH },
      { x: castleW / 2, y: castleH },
      0,
      false,
      1
    );

    if (!drewCastle) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, GROUND_Y - 260, 260, 260);
    }

    // Battlement Siege Cannon firing when upgraded
    this.drawBattlementCannon(ctx, 215 - spread, GROUND_Y - 195, true);

    // Glowing Cyan Arcane Portal Aura at Castle Gate
    const gateX = 225 - spread;
    const gateY = GROUND_Y;
    const portalGlow = ctx.createRadialGradient(gateX, gateY - 38, 6, gateX, gateY - 38, 56);
    portalGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    portalGlow.addColorStop(0.4, 'rgba(56, 189, 248, 0.55)');
    portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = portalGlow;
    ctx.beginPath();
    ctx.arc(gateX, gateY - 38, 56, 0, Math.PI * 2);
    ctx.fill();

    if (this.gameState === 'playing') {
      ctx.font = '900 17px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#090a0f';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeText('DEPLOY!', gateX + 52, GROUND_Y - 135);
      ctx.fillText('DEPLOY!', gateX + 52, GROUND_Y - 135);
    }

    this.drawCastleNameBanner(ctx, cx + 25, GROUND_Y - 315, 'CASTLE OF GAZA', '#0284c7', '#fde047');
    ctx.restore();
  }

  // Draws Right Fortress: "CASTLE OF EPSTEIN" using the high-resolution Raylib Castle Enemy Sprite Texture + Waving Enemy Flag
  private drawEnemyCastle(ctx: CanvasRenderingContext2D): void {
    const spread = this.gameState === 'title' ? 0 : Math.min(48, (this.levelConfig.level - 1) * 2.5);
    const cx = ENEMY_CASTLE_X + spread * 0.5;
    const hpPct = Math.max(0, this.enemyCastleHp / Math.max(1, this.enemyCastleMaxHp));
    const collapseOffset = (1 - hpPct) * 32;
    const castleW = 380;
    const castleH = Math.max(220, 410 - collapseOffset);

    ctx.save();

    const drewCastle = this.rl.DrawTexturePro(
      this.texCastleEnemy,
      { x: WORLD_WIDTH - 175 + spread, y: GROUND_Y + 34, width: castleW, height: castleH },
      { x: castleW / 2, y: castleH },
      0,
      false,
      1
    );

    if (!drewCastle) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(WORLD_WIDTH - 260, GROUND_Y - 260, 260, 260);
    }

    // Waving Enemy Flag atop the Castle Turret
    this.drawWavingEnemyFlag(ctx, WORLD_WIDTH - 235 + spread, GROUND_Y - castleH + 78);

    // Glowing Purple Shadow-Portal Aura at Enemy Gate
    const gateX = 1215 + spread;
    const gateY = GROUND_Y;
    const portalGlow = ctx.createRadialGradient(gateX, gateY - 38, 6, gateX, gateY - 38, 56);
    portalGlow.addColorStop(0, 'rgba(245, 208, 254, 0.8)');
    portalGlow.addColorStop(0.45, 'rgba(192, 132, 252, 0.5)');
    portalGlow.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = portalGlow;
    ctx.beginPath();
    ctx.arc(gateX, gateY - 38, 56, 0, Math.PI * 2);
    ctx.fill();

    this.drawCastleNameBanner(ctx, cx - 25, GROUND_Y - 315, 'CASTLE OF EPSTEIN', '#991b1b', '#fca5a5');
    ctx.restore();
  }

  // Draws the Waving Enemy Flag (Red/White Stripes + Navy Canton with White Star of David)
  private drawWavingEnemyFlag(ctx: CanvasRenderingContext2D, poleX: number, roofApexY: number): void {
    const t = this.gameState === 'title' ? this.titlePanTime : this.elapsedSeconds;
    const poleTopY = roofApexY - 96;
    const flagW = 104;
    const flagH = 63;

    ctx.save();
    // Flagpole & Finial
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(poleX, roofApexY + 6);
    ctx.lineTo(poleX, poleTopY - 6);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(poleX, poleTopY - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Waving Flag Body (9 horizontal stripes: 5 red, 4 white)
    const stripeCount = 9;
    const stripeH = flagH / stripeCount;

    for (let s = 0; s < stripeCount; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#b91c1c' : '#ffffff';
      ctx.beginPath();
      const y0 = poleTopY + s * stripeH;
      const y1 = y0 + stripeH + 0.6;
      ctx.moveTo(poleX, y0);
      for (let x = 0; x <= flagW; x += 13) {
        const wave = Math.sin(t * 4.5 + x * 0.055) * 3.5 * (x / flagW);
        ctx.lineTo(poleX + x, y0 + wave);
      }
      for (let x = flagW; x >= 0; x -= 13) {
        const wave = Math.sin(t * 4.5 + x * 0.055) * 3.5 * (x / flagW);
        ctx.lineTo(poleX + x, y1 + wave);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Navy Blue Canton in Upper-Left of Flag
    const cantonW = 46;
    const cantonH = stripeH * 5;
    ctx.fillStyle = '#1e295b';
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY);
    for (let x = 0; x <= cantonW; x += 11) {
      const wave = Math.sin(t * 4.5 + x * 0.055) * 3.5 * (x / flagW);
      ctx.lineTo(poleX + x, poleTopY + wave);
    }
    for (let x = cantonW; x >= 0; x -= 11) {
      const wave = Math.sin(t * 4.5 + x * 0.055) * 3.5 * (x / flagW);
      ctx.lineTo(poleX + x, poleTopY + cantonH + wave);
    }
    ctx.closePath();
    ctx.fill();

    // Crisp White 6-Pointed Star of David inside the Navy Blue Canton
    const starCx = poleX + cantonW * 0.5;
    const starCy = poleTopY + cantonH * 0.5 + Math.sin(t * 4.5 + cantonW * 0.028) * 1.2;
    const r = 11.5;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    // Upward Triangle
    ctx.beginPath();
    ctx.moveTo(starCx, starCy - r);
    ctx.lineTo(starCx + r * 0.866, starCy + r * 0.5);
    ctx.lineTo(starCx - r * 0.866, starCy + r * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Downward Triangle
    ctx.beginPath();
    ctx.moveTo(starCx, starCy + r);
    ctx.lineTo(starCx + r * 0.866, starCy - r * 0.5);
    ctx.lineTo(starCx - r * 0.866, starCy - r * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Flag Outline
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 2;
    ctx.strokeRect(poleX, poleTopY, flagW, flagH);

    ctx.restore();
  }

  private drawStoneBrickPattern(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    brickW: number,
    brickH: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 1.6;
    let row = 0;
    for (let by = y; by < y + h - brickH; by += brickH) {
      const offset = (row % 2) * (brickW * 0.5);
      for (let bx = x + offset; bx < x + w - brickW; bx += brickW) {
        ctx.strokeRect(bx, by, brickW - 2, brickH - 2);
      }
      row++;
    }
    ctx.restore();
  }

  private drawCastleDefender(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 2;
    // Blue-skinned defender body & helmet
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-7, -18, 14, 18);
    ctx.strokeRect(-7, -18, 14, 18);
    // Blue head
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -24, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Steel cap
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -26, 8, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    // Crossbow / Harpoon aimed right
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, -16);
    ctx.lineTo(22, -22);
    ctx.stroke();
    ctx.restore();
  }

  private drawBattlementCannon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facingRight: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facingRight ? 1 : -1, 1);
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 2.4;

    // Wooden Cannon Carriage
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, -16);
    ctx.lineTo(-14, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy Bronze / Iron Cannon Barrel angled up
    ctx.save();
    ctx.translate(-2, -14);
    ctx.rotate(-0.32);
    const barrelGrad = ctx.createLinearGradient(0, -10, 0, 10);
    barrelGrad.addColorStop(0, '#94a3b8');
    barrelGrad.addColorStop(0.5, '#475569');
    barrelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -9, 48, 18, 5);
    ctx.fill();
    ctx.stroke();

    // Cannon Muzzle Flash & Fire Blast on Left Castle!
    if (facingRight) {
      const flashGrad = ctx.createLinearGradient(32, 0, 88, 0);
      flashGrad.addColorStop(0, '#ffffff');
      flashGrad.addColorStop(0.35, '#fef08a');
      flashGrad.addColorStop(0.7, '#f97316');
      flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.moveTo(32, -4);
      ctx.lineTo(88, -16);
      ctx.lineTo(88, 16);
      ctx.lineTo(32, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Carriage Wheel
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-4, -3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawCastleNameBanner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    title: string,
    bgColor: string,
    textColor: string
  ): void {
    ctx.save();
    ctx.font = '800 13px system-ui, -apple-system, sans-serif';
    const w = 168;
    const h = 26;
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 3;
    ctx.strokeText(title, x, y + 1);
    ctx.fillText(title, x, y + 1);
    ctx.restore();
  }

  private drawForegroundVignette(ctx: CanvasRenderingContext2D): void {
    // Dark foreground rocks & gnarled silhouette branch in bottom corners (like reference image)
    ctx.save();
    ctx.fillStyle = '#090d08';
    ctx.beginPath();
    ctx.moveTo(0, WORLD_HEIGHT);
    ctx.lineTo(0, WORLD_HEIGHT - 95);
    ctx.lineTo(135, WORLD_HEIGHT - 25);
    ctx.lineTo(220, WORLD_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(WORLD_WIDTH, WORLD_HEIGHT);
    ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT - 110);
    ctx.lineTo(WORLD_WIDTH - 145, WORLD_HEIGHT - 30);
    ctx.lineTo(WORLD_WIDTH - 240, WORLD_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawTitleStageActors(ctx: CanvasRenderingContext2D): void {
    // Blue-Skinned Spearman & Blue-Skinned Hero Knight galloping from Castle of Gaza
    this.drawActor(ctx, {
      id: 997,
      side: 'ally',
      name: 'Gaza Spearman',
      unitType: 'swordsman',
      x: 315,
      y: GROUND_Y + 6,
      vx: 120,
      vy: 0,
      hp: 250,
      maxHp: 250,
      ghostHp: 250,
      damage: 26,
      range: 56,
      attackCooldown: 0.8,
      attackTimer: 0,
      moveSpeed: 120,
      armor: 4,
      color: '#38bdf8',
      accentColor: '#f8fafc',
      capeColor: '#1d4ed8',
      steedColor: '#a16207',
      isMounted: true,
      isRanged: false,
      isSiege: false,
      splashRadius: 0,
      actorScale: 1.22,
      helmStyle: 'hood',
      weaponStyle: 'spear',
      walkPhase: this.titlePanTime * 9.5,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.2,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    });

    this.drawActor(ctx, {
      id: 998,
      side: 'ally',
      name: 'Sir Roland',
      isHero: true,
      x: 525,
      y: GROUND_Y + 6,
      vx: 185,
      vy: 0,
      hp: 680,
      maxHp: 680,
      ghostHp: 680,
      damage: 54,
      range: 74,
      attackCooldown: 0.7,
      attackTimer: 0,
      moveSpeed: 185,
      armor: 8,
      color: '#38bdf8',
      accentColor: '#fef08a',
      capeColor: '#dc2626',
      steedColor: '#f8fafc',
      isMounted: true,
      isRanged: false,
      isSiege: false,
      splashRadius: 0,
      actorScale: 1.32,
      helmStyle: 'plate',
      weaponStyle: 'sword',
      walkPhase: this.titlePanTime * 10.2 + 0.8,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.2,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    });

    // Opposing Full-Body Armored Cartoon Bosses galloping on right side of Home page
    this.drawActor(ctx, {
      id: 999,
      side: 'enemy',
      name: 'Boss Warlord',
      isFeaturedFace: true,
      bossPortraitUrl: BOSS_PORTRAIT_1,
      x: 865,
      y: GROUND_Y + 4,
      vx: -130,
      vy: 0,
      hp: 650,
      maxHp: 650,
      ghostHp: 650,
      damage: 55,
      range: 65,
      attackCooldown: 0.8,
      attackTimer: 0,
      moveSpeed: 130,
      armor: 6,
      color: '#334155',
      accentColor: '#fecaca',
      capeColor: '#1e293b',
      steedColor: '#1c1917',
      isMounted: true,
      isRanged: false,
      isSiege: false,
      splashRadius: 0,
      actorScale: 1.22,
      helmStyle: 'crown',
      weaponStyle: 'halberd',
      walkPhase: this.titlePanTime * 9.2 + 1.4,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.2,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    });

    this.drawActor(ctx, {
      id: 1000,
      side: 'enemy',
      name: 'Supreme Boss',
      isFeaturedFace: true,
      bossPortraitUrl: BOSS_PORTRAIT_2,
      x: 1015,
      y: GROUND_Y + 8,
      vx: -130,
      vy: 0,
      hp: 650,
      maxHp: 650,
      ghostHp: 650,
      damage: 55,
      range: 65,
      attackCooldown: 0.8,
      attackTimer: 0,
      moveSpeed: 130,
      armor: 6,
      color: '#1e293b',
      accentColor: '#fde047',
      capeColor: '#991b1b',
      steedColor: '#27272a',
      isMounted: true,
      isRanged: false,
      isSiege: false,
      splashRadius: 0,
      actorScale: 1.42,
      helmStyle: 'crown',
      weaponStyle: 'sword',
      walkPhase: this.titlePanTime * 9.8 + 0.5,
      swingAnim: 0,
      scaleX: 1,
      scaleY: 1,
      hitFlashTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      windupMax: 0.2,
      isCharging: false,
      shieldRaised: false,
      shieldCycleTimer: 0,
      koTimer: 0,
      koRotation: 0,
      targetGroundX: 0,
      goldDrop: 0,
      scoreValue: 0,
    });
  }

  private drawAttackTelegraphs(ctx: CanvasRenderingContext2D): void {
    for (const actor of this.actors) {
      if (actor.koTimer > 0 || actor.windupTimer <= 0) continue;
      const progress = 1 - actor.windupTimer / Math.max(0.1, actor.windupMax);

      if (actor.behaviorPolicy === 'siege_telegraph' && actor.targetGroundX > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.24)';
        ctx.lineWidth = 3;
        const radius = 58 * (1.15 - progress * 0.35);
        ctx.beginPath();
        ctx.ellipse(actor.targetGroundX, GROUND_Y - 2, radius, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (actor.behaviorPolicy === 'charger' || actor.side === 'enemy') {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(actor.x, actor.y - 95 * actor.actorScale, 5 + progress * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tactical Parry Indicator on Boss Windups
        if (actor.isFeaturedFace) {
          ctx.font = '900 10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#090a0f';
          ctx.lineWidth = 3;
          ctx.strokeText('! PARRY [Space]', actor.x, actor.y - 110 * actor.actorScale);
          ctx.fillText('! PARRY [Space]', actor.x, actor.y - 110 * actor.actorScale);
        }
        ctx.restore();
      }
    }
  }

  // Draws Allies & Enemies on Warhorses with Articulated Galloping Horse Legs (DrawAnimatedCavalryPro)
  private drawActor(ctx: CanvasRenderingContext2D, actor: CombatActor): void {
    ctx.save();
    ctx.translate(actor.x, actor.y);
    if (actor.koTimer > 0) {
      ctx.rotate(actor.koRotation);
      ctx.globalAlpha = Math.max(0, actor.koTimer / 0.36);
    }

    const s = actor.actorScale;
    ctx.scale(actor.scaleX * s, actor.scaleY * s);

    // Ground Shadow under Warhorse / Siege Carriage
    const strideShadowStretch = Math.sin(actor.walkPhase) * 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(
      0,
      2,
      (actor.isFeaturedFace ? 46 : 38) + strideShadowStretch,
      9,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Glowing Cyan Hero Aura Ring
    if (actor.isHero && actor.koTimer === 0) {
      const auraGrad = ctx.createRadialGradient(0, -45, 16, 0, -45, 68);
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      auraGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.25)');
      auraGrad.addColorStop(0.9, 'rgba(125, 211, 252, 0.65)');
      auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -45, 68, 0, Math.PI * 2);
      ctx.fill();
    }

    const bob = Math.abs(Math.sin(actor.walkPhase)) * 5.2;
    const swingTiltDeg = Math.sin(actor.swingAnim * Math.PI) * (actor.side === 'ally' ? 14 : -14);

    // Select the appropriate Raylib Texture2D & horizontal orientation
    let spriteTex: RLTexture2D = this.texKnight;
    let flipX = false;
    let spriteW = 148;
    let spriteH = 148;

    if (actor.isSiege) {
      spriteTex = this.texSiege;
      flipX = actor.side === 'enemy';
      spriteW = 152;
      spriteH = 136;
    } else if (actor.side === 'enemy') {
      if (actor.bossPortraitUrl === BOSS_PORTRAIT_2) {
        // boss_warlord_2.jpg (Supreme Boss) natively faces LEFT (<-)
        spriteTex = this.texBoss2;
        flipX = false;
        spriteW = actor.isFeaturedFace ? 168 : 142;
        spriteH = actor.isFeaturedFace ? 168 : 142;
      } else if (actor.bossPortraitUrl === BOSS_PORTRAIT_1 || actor.isFeaturedFace) {
        // boss_warlord_1.jpg (Boss Warlord) natively faces RIGHT (->), so flipX=true to march LEFT
        spriteTex = this.texBoss1;
        flipX = true;
        spriteW = actor.isFeaturedFace ? 166 : 142;
        spriteH = actor.isFeaturedFace ? 166 : 142;
      } else if (actor.isRanged) {
        spriteTex = this.texArcher;
        flipX = true;
        spriteW = 138;
        spriteH = 138;
      } else {
        spriteTex = this.texKnight;
        flipX = true;
        spriteW = 142;
        spriteH = 142;
      }
    } else {
      // Allied Mounted Units & Hero Commander
      if (actor.isRanged || actor.unitType === 'archer') {
        spriteTex = this.texArcher;
        flipX = false;
        spriteW = 140;
        spriteH = 140;
      } else {
        spriteTex = this.texKnight;
        flipX = false;
        spriteW = actor.isHero ? 162 : 144;
        spriteH = actor.isHero ? 162 : 144;
      }
    }

    const isMoving =
      this.gameState === 'title'
        ? true
        : actor.isHero
          ? Math.abs(actor.vx) > 5
          : actor.windupTimer <= 0 && actor.attackTimer <= 0 && actor.stunTimer <= 0;

    const drewSprite = actor.isSiege
      ? this.rl.DrawTexturePro(
          spriteTex,
          { x: 0, y: -bob * 0.4 + 14, width: spriteW, height: spriteH },
          { x: spriteW / 2, y: spriteH },
          swingTiltDeg,
          flipX,
          1
        )
      : this.rl.DrawAnimatedCavalryPro(
          spriteTex,
          { x: 0, y: 14, width: spriteW, height: spriteH },
          { x: spriteW / 2, y: spriteH },
          swingTiltDeg,
          flipX,
          actor.walkPhase,
          isMoving,
          1
        );

    if (!drewSprite) {
      // Instant fallback silhouette only during the first ~100ms before Image onload completes
      ctx.fillStyle = actor.side === 'ally' ? '#38bdf8' : '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -45 - bob, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Visual Shield Indicator when Shielded Enemy raises their bulwark
    if (actor.shieldRaised && actor.koTimer === 0) {
      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(actor.side === 'enemy' ? -24 : 24, -52, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Health Bar & Boss / Hero Nameplate
    if (actor.koTimer === 0 && this.gameState === 'playing') {
      const barW = actor.isHero ? 54 : actor.isFeaturedFace ? 56 : 40;
      const barH = actor.isHero || actor.isFeaturedFace ? 6 : 4.5;
      const barY = -spriteH + 6;

      ctx.fillStyle = '#090a0f';
      ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const ghostPct = Math.max(0, Math.min(1, actor.ghostHp / actor.maxHp));
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-barW / 2, barY, barW * ghostPct, barH);

      const hpPct = Math.max(0, Math.min(1, actor.hp / actor.maxHp));
      ctx.fillStyle = actor.side === 'ally' ? '#38bdf8' : actor.isFeaturedFace ? '#f97316' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

      if (actor.isFeaturedFace || actor.isHero) {
        ctx.font = '800 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = actor.isHero ? '#bae6fd' : '#fde047';
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 3.2;
        const label = actor.isHero ? actor.name : `★ BOSS: ${actor.name}`;
        ctx.strokeText(label, 0, barY - 6);
        ctx.fillText(label, 0, barY - 6);
      }
    }

    ctx.restore();
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const pr of this.projectiles) {
      if (!pr.active) continue;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      const angle = Math.atan2(pr.vy, pr.vx);
      ctx.rotate(angle);

      if (pr.kind === 'boulder' || pr.kind === 'meteor' || pr.kind === 'fireball') {
        ctx.fillStyle = pr.color;
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pr.kind === 'meteor' ? 11 : 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = pr.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(13, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Draws Swooping Winged Fire Dragon Raid across the sky with Articulated Flapping Wings (DrawAnimatedDragonPro)
  private drawDragon(ctx: CanvasRenderingContext2D, d: ActiveDragon): void {
    const hoverY = Math.sin(d.wingPhase) * 14;
    const isEnemy = d.side === 'enemy';

    const drewDragon = this.rl.DrawAnimatedDragonPro(
      this.texDragon,
      { x: d.x, y: d.y + hoverY, width: 290, height: 265 },
      { x: 145, y: 132 },
      isEnemy ? -6 : 6,
      isEnemy, // dragon_sprite.jpg faces right natively; flipX=true when flying left
      d.wingPhase,
      1
    );

    if (!drewDragon) {
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.gameState === 'playing' && d.x > PLAYER_CASTLE_X + 60 && d.x < ENEMY_CASTLE_X - 40) {
      ctx.save();
      ctx.translate(d.x, d.y + hoverY);
      ctx.scale(isEnemy ? -1 : 1, 1);
      const fireGrad = ctx.createLinearGradient(65, 10, 175, 125);
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.3, '#fef08a');
      fireGrad.addColorStop(0.7, '#f97316');
      fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.moveTo(62, 6);
      ctx.lineTo(185, 115);
      ctx.lineTo(125, 148);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawCallouts(ctx: CanvasRenderingContext2D): void {
    if (this.callouts.length === 0) return;
    ctx.save();
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (const c of this.callouts) {
      const alpha = Math.max(0, Math.min(1, c.life / c.maxLife));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#090a0f';
      ctx.lineWidth = 3.5;
      ctx.fillStyle = c.color;
      ctx.strokeText(c.text, c.x, c.y);
      ctx.fillText(c.text, c.x, c.y);
    }
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.globalAlpha = alpha * 0.32;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.85, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
