import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS,
  HEROES,
  ENEMY_TIERS,
  BOSS_PORTRAIT_1,
  BOSS_PORTRAIT_2,
  getEnemyRosterForLevel,
  getLevelConfig,
  calculateBattleScore,
  calculateCoinReward,
  isNewHighScore,
  computeDamage,
  computeTacticalCounter,
  canDeployUnit,
  canPurchaseHero,
  purchaseHeroState,
  checkBattleOutcome,
  DEFAULT_SAVE_PROGRESS,
} from './rules';

test('20 progressively difficult campaign levels exist and each level adds a new powerful enemy face with boss cartoon portraits', () => {
  assert.equal(LEVELS.length, 20);
  assert.equal(ENEMY_TIERS.length, 20);
  assert.equal(BOSS_PORTRAIT_1, '/assets/aistudio/image_0f808666.png');
  assert.equal(BOSS_PORTRAIT_2, '/assets/aistudio/image_0f5dbb65.png');

  for (let lvl = 1; lvl <= 20; lvl++) {
    const cfg = getLevelConfig(lvl);
    const roster = getEnemyRosterForLevel(lvl);
    assert.equal(roster.length, lvl, `Level ${lvl} should include ${lvl} cumulative enemy tiers`);
    assert.equal(cfg.featuredEnemy.tier, lvl, `Level ${lvl} featured enemy should be tier ${lvl}`);
    const portraitsInLevel = new Set([
      cfg.featuredEnemy.bossPortraitUrl,
      cfg.coBossEnemy.bossPortraitUrl,
    ]);
    assert.equal(
      portraitsInLevel.has(BOSS_PORTRAIT_1) && portraitsInLevel.has(BOSS_PORTRAIT_2),
      true,
      `Level ${lvl} should include both cartoon boss portraits`
    );
    if (lvl > 1) {
      const prevCfg = getLevelConfig(lvl - 1);
      const prevFeatured = prevCfg.featuredEnemy;
      assert.notEqual(cfg.featuredEnemy.name, prevFeatured.name);
      assert.ok(
        cfg.featuredEnemy.maxHp + cfg.featuredEnemy.damage >
          prevFeatured.maxHp + prevFeatured.damage,
        `Tier ${lvl} enemy (${cfg.featuredEnemy.name}) should be stronger than Tier ${lvl - 1}`
      );
      assert.ok(
        cfg.castleDistance > prevCfg.castleDistance && cfg.battlefieldWidth > prevCfg.battlefieldWidth,
        `Level ${lvl} castle distance (${cfg.castleDistance}) should be greater than Level ${lvl - 1} (${prevCfg.castleDistance})`
      );
    }
  }
});

test('5 distinct mounted heroes and diverse enemy AI policies exist', () => {
  assert.equal(Object.keys(HEROES).length, 5);
  for (const h of Object.values(HEROES)) {
    assert.equal(h.isMounted, true);
  }
  const policies = new Set(ENEMY_TIERS.map((e) => e.behaviorPolicy));
  assert.ok(policies.size >= 5, 'Should have at least 5 distinct enemy AI policies');
});

test('faster kingdom captures earn significantly higher battle scores', () => {
  const fastScore = calculateBattleScore({
    victory: true,
    level: 3,
    clearTimeSeconds: 35,
    parTimeSeconds: 90,
    playerCastleHp: 1000,
    playerCastleMaxHp: 1000,
    enemiesDefeated: 12,
    damageDealtToCastle: 1200,
  });

  const slowScore = calculateBattleScore({
    victory: true,
    level: 3,
    clearTimeSeconds: 115,
    parTimeSeconds: 90,
    playerCastleHp: 1000,
    playerCastleMaxHp: 1000,
    enemiesDefeated: 12,
    damageDealtToCastle: 1200,
  });

  assert.ok(fastScore > slowScore, `Expected fastScore (${fastScore}) > slowScore (${slowScore})`);
});

test('high score detection triggers only when candidate beats previous record', () => {
  assert.equal(isNewHighScore(4500, 3200), true);
  assert.equal(isNewHighScore(3200, 3200), false);
  assert.equal(isNewHighScore(1800, 3200), false);
});

test('hero purchase deducts coins and unlocks hero', () => {
  const initialSave = { ...DEFAULT_SAVE_PROGRESS, coins: 500 };
  assert.equal(canPurchaseHero('lyra', initialSave), true);
  assert.equal(canPurchaseHero('malakor', initialSave), false);

  const updated = purchaseHeroState('lyra', initialSave);
  assert.equal(updated.unlockedHeroes.includes('lyra'), true);
  assert.equal(updated.selectedHero, 'lyra');
  assert.equal(updated.coins, 500 - HEROES.lyra.cost);
});

test('unit deployment checks gold and cooldowns accurately', () => {
  assert.equal(canDeployUnit('swordsman', 100, 0), true);
  assert.equal(canDeployUnit('swordsman', 20, 0), false);
  assert.equal(canDeployUnit('swordsman', 100, 1.2), false);
});

test('damage calculation respects armor and shielded front stance', () => {
  const unshielded = computeDamage(50, 4, false);
  const shielded = computeDamage(50, 4, true);
  assert.ok(unshielded > shielded);
  assert.ok(computeDamage(5, 50, true) >= 3);
});

test('tactical counter system rewards smart unit matchups, formation synergy, and Hero timed parries', () => {
  const heroParry = computeTacticalCounter({
    isHero: true,
    targetPolicy: 'charger',
    isTargetBoss: true,
    isTargetWindingUp: true,
  });
  assert.equal(heroParry.damageMultiplier, 2.0);
  assert.equal(heroParry.breaksShield, true);
  assert.ok(heroParry.stunSeconds >= 1.5);
  assert.equal(heroParry.bonusGold, 25);

  const knightShieldBreak = computeTacticalCounter({
    attackerUnitType: 'knight',
    targetPolicy: 'shielded',
  });
  assert.equal(knightShieldBreak.breaksShield, true);
  assert.ok(knightShieldBreak.damageMultiplier > 1.5);

  const archerSynergy = computeTacticalCounter({
    attackerUnitType: 'archer',
    targetPolicy: 'aerial',
    hasFrontlineEscort: true,
  });
  const archerSolo = computeTacticalCounter({
    attackerUnitType: 'archer',
    targetPolicy: 'aerial',
    hasFrontlineEscort: false,
  });
  assert.ok(archerSynergy.damageMultiplier > archerSolo.damageMultiplier);
});

test('battle outcome and coin reward calculations work properly', () => {
  assert.equal(checkBattleOutcome(500, 0), 'victory');
  assert.equal(checkBattleOutcome(0, 400), 'defeat');
  assert.equal(checkBattleOutcome(500, 400), 'ongoing');

  const lvl1 = getLevelConfig(1);
  const winCoins = calculateCoinReward({
    victory: true,
    levelConfig: lvl1,
    stars: 3,
    enemiesDefeated: 10,
  });
  const lossCoins = calculateCoinReward({
    victory: false,
    levelConfig: lvl1,
    stars: 0,
    enemiesDefeated: 4,
  });
  assert.ok(winCoins > lossCoins);
});
