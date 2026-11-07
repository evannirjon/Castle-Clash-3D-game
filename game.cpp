// ============================================================================
// CASTLE CLASH: HEROES VS BOSSES — Complete Raylib C++ (game.cpp)
// Single-file complete game code with 20 levels, cavalry animations,
// dragon flight, cartoon boss commanders, and castle siege warfare.
//
// HOW TO COMPILE:
// ----------------------------------------------------------------------------
// Linux / Ubuntu:
//   g++ -O2 game.cpp -o game -lraylib -lGL -lm -lpthread -ldl -lrt -lX11
//
// macOS (Homebrew raylib):
//   clang++ -O2 game.cpp -o game -L/opt/homebrew/lib -I/opt/homebrew/include -lraylib -framework OpenGL -framework Cocoa -framework IOKit -framework CoreVideo
//
// Windows (w/ MinGW-w64):
//   g++ -O2 game.cpp -o game.exe -lraylib -lopengl32 -lgdi32 -lwinmm
// ============================================================================

#include "raylib.h"
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include <algorithm>

// ----------------------------------------------------------------------------
// Constants & World Layout
// ----------------------------------------------------------------------------
static const int SCREEN_WIDTH   = 1280;
static const int SCREEN_HEIGHT  = 720;
static const float GROUND_Y     = 575.0f;
static const float ALLY_CASTLE_X = 175.0f;
static const float ENEMY_CASTLE_X = 1105.0f;
static const int MAX_ACTORS     = 96;
static const int MAX_PARTICLES  = 256;

// ----------------------------------------------------------------------------
// Data Structures
// ----------------------------------------------------------------------------
enum UnitKind {
    UNIT_SQUIRE = 0,
    UNIT_ARCHER = 1,
    UNIT_PALADIN = 2,
    UNIT_CATAPULT = 3,
    UNIT_HERO = 4,
    UNIT_BOSS_WARLORD = 5,
    UNIT_SUPREME_BOSS = 6
};

struct Particle {
    bool active;
    float x, y;
    float vx, vy;
    float size;
    float life, maxLife;
    Color color;
};

struct Actor {
    bool active;
    bool isEnemy;
    bool isBoss;
    bool isHero;
    UnitKind kind;
    float x, y;
    float hp, maxHp;
    float damage;
    float range;
    float speed;
    float attackCooldown;
    float attackTimer;
    float scale;
    float walkPhase;
    float swingAnim;
    float hitFlash;
    std::string name;
};

struct ActiveDragon {
    bool active;
    bool isEnemy;
    float x, y;
    float vx;
    float wingPhase;
    float breathTimer;
};

struct LevelInfo {
    int level;
    const char* realmName;
    const char* bossName;
    float enemyCastleHp;
    float spawnInterval;
};

static const LevelInfo REALM_LEVELS[20] = {
    { 1,  "Borderwatch Outpost",    "Goblin Outrider",          940.0f,  3.6f },
    { 2,  "Silverbrook Crossing",   "Dark Marksman",           1040.0f,  3.4f },
    { 3,  "Whispering Fens",        "Ironpike Lancer",         1140.0f,  3.2f },
    { 4,  "Sunspire Watchtower",    "Sunbreaker Shieldman",    1240.0f,  3.0f },
    { 5,  "Highgate Bastion",       "Bloodfang Marauder",      1360.0f,  2.8f },
    { 6,  "Amberleaf Stronghold",   "Blackwood Horsebow",      1480.0f,  2.6f },
    { 7,  "Crow's Hollow Keep",     "Crow's Hollow Juggernaut",1620.0f,  2.5f },
    { 8,  "Redwater Ravine",        "Crimson Drake-Knight",    1750.0f,  2.4f },
    { 9,  "Windscar Plateau",       "Blight Catapult",         1880.0f,  2.3f },
    { 10, "Frostpeak Gatehouse",    "Frostpeak Reaver",        2020.0f,  2.2f },
    { 11, "Glacierhold Sanctum",    "Icebound Warlock",        2180.0f,  2.1f },
    { 12, "Winterbane Spire",       "Winterbane Colossus",     2340.0f,  2.0f },
    { 13, "Cinderfall Trenches",    "Cinderfall Hellknight",   2520.0f,  1.9f },
    { 14, "Molten Forge Keep",      "Molten Bombardier",       2700.0f,  1.8f },
    { 15, "Scorched Palisade",      "Scorched Arch-Cavalier",  2900.0f,  1.7f },
    { 16, "Bloodstone Redoubt",     "Bloodstone Executioner",  3120.0f,  1.6f },
    { 17, "Dreadmaw Caldera",       "Dreadmaw Necro-Lord",     3350.0f,  1.5f },
    { 18, "Nightfall Battlements",  "Nightfall Dreadnought",   3600.0f,  1.4f },
    { 19, "Throne of Cinders",      "Cinder War-Regent",       3880.0f,  1.3f },
    { 20, "Obsidian Dragon Citadel","Malgrim the Undying",     4200.0f,  1.2f }
};

// ----------------------------------------------------------------------------
// Texture & Chroma-Key Loader
// ----------------------------------------------------------------------------
static Texture2D LoadSpriteChroma(const char *path) {
    if (!FileExists(path)) {
        // Return a 1x1 white dummy texture if asset is not present
        Image dummy = GenImageColor(64, 64, MAGENTA);
        Texture2D t = LoadTextureFromImage(dummy);
        UnloadImage(dummy);
        return t;
    }
    Image img = LoadImage(path);
    ImageFormat(&img, PIXELFORMAT_UNCOMPRESSED_R8G8B8A8);
    Color *pixels = LoadImageColors(img);
    int total = img.width * img.height;
    for (int i = 0; i < total; i++) {
        // Transparent chroma-keying for bright / white backgrounds
        if (pixels[i].r > 230 && pixels[i].g > 230 && pixels[i].b > 228) {
            pixels[i].a = 0;
        }
    }
    for (int y = 0; y < img.height; y++) {
        for (int x = 0; x < img.width; x++) {
            ImageDrawPixel(&img, x, y, pixels[y * img.width + x]);
        }
    }
    UnloadImageColors(pixels);
    Texture2D tex = LoadTextureFromImage(img);
    UnloadImage(img);
    return tex;
}

// ----------------------------------------------------------------------------
// Realistic Horse Gallop Rendering
// ----------------------------------------------------------------------------
static void DrawGallopingHorse(Texture2D tex, float x, float y, float w, float h, bool flipX, float walkPhase, bool isMoving) {
    float bob = isMoving ? fabsf(sinf(walkPhase * 2.0f)) * 4.5f : 0.0f;
    float bodyPitch = isMoving ? sinf(walkPhase) * 2.5f : 0.0f;

    // 1. Shadow underneath horse on the stone causeway
    DrawEllipse((int)x, (int)(y + 2.0f), (int)(w * 0.28f), (int)(h * 0.08f), ColorAlpha(BLACK, 0.45f));

    // 2. Base horse body
    Rectangle src = { 0.0f, 0.0f, flipX ? -(float)tex.width : (float)tex.width, (float)tex.height };
    Rectangle dst = { x, y - bob, w, h };
    Vector2 origin = { w * 0.5f, h };
    DrawTexturePro(tex, src, dst, origin, bodyPitch, WHITE);
}

// ----------------------------------------------------------------------------
// Flapping Dragon Flight Rendering
// ----------------------------------------------------------------------------
static void DrawFlappingDragon(Texture2D tex, float x, float y, float w, float h, bool flipX, float wingPhase) {
    float hoverY = sinf(wingPhase) * 12.0f;
    float wingAngle = sinf(wingPhase * 1.5f) * 18.0f;

    Rectangle src = { 0.0f, 0.0f, flipX ? -(float)tex.width : (float)tex.width, (float)tex.height };
    Rectangle dst = { x, y + hoverY, w, h };
    Vector2 origin = { w * 0.5f, h * 0.5f };
    DrawTexturePro(tex, src, dst, origin, wingAngle * 0.35f, WHITE);
}

// ----------------------------------------------------------------------------
// Particle Manager
// ----------------------------------------------------------------------------
static Particle g_particles[MAX_PARTICLES] = {0};

static void SpawnBurst(float x, float y, int count, Color col) {
    int spawned = 0;
    for (int i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        if (!g_particles[i].active) {
            float angle = ((float)rand() / (float)RAND_MAX) * 6.28318f;
            float speed = 40.0f + ((float)rand() / (float)RAND_MAX) * 160.0f;
            g_particles[i].active = true;
            g_particles[i].x = x;
            g_particles[i].y = y;
            g_particles[i].vx = cosf(angle) * speed;
            g_particles[i].vy = sinf(angle) * speed - 35.0f;
            g_particles[i].size = 3.0f + ((float)rand() / (float)RAND_MAX) * 4.0f;
            g_particles[i].life = 0.4f + ((float)rand() / (float)RAND_MAX) * 0.35f;
            g_particles[i].maxLife = g_particles[i].life;
            g_particles[i].color = col;
            spawned++;
        }
    }
}

static void UpdateAndDrawParticles(float dt) {
    for (int i = 0; i < MAX_PARTICLES; i++) {
        if (!g_particles[i].active) continue;
        g_particles[i].x += g_particles[i].vx * dt;
        g_particles[i].y += g_particles[i].vy * dt;
        g_particles[i].vy += 180.0f * dt; // gravity
        g_particles[i].life -= dt;
        if (g_particles[i].life <= 0.0f) {
            g_particles[i].active = false;
            continue;
        }
        float alpha = g_particles[i].life / g_particles[i].maxLife;
        DrawCircle((int)g_particles[i].x, (int)g_particles[i].y, g_particles[i].size * alpha, ColorAlpha(g_particles[i].color, alpha));
    }
}

// ----------------------------------------------------------------------------
// Main Game Engine Loop
// ----------------------------------------------------------------------------
int main(void) {
    InitWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Castle Clash: Heroes vs Bosses (Single-File Raylib C++)");
    SetTargetFPS(60);

    // Load High-Fidelity Textures
    Texture2D texBg          = LoadSpriteChroma("public/assets/sprites/battlefield_bg.jpg");
    Texture2D texCastleAlly  = LoadSpriteChroma("public/assets/sprites/castle_ally.jpg");
    Texture2D texCastleEnemy = LoadSpriteChroma("public/assets/sprites/castle_enemy.jpg");
    Texture2D texDragon      = LoadSpriteChroma("public/assets/sprites/dragon_sprite.jpg");
    Texture2D texKnight      = LoadSpriteChroma("public/assets/sprites/cavalry_knight.jpg");
    Texture2D texArcher      = LoadSpriteChroma("public/assets/sprites/cavalry_archer.jpg");
    Texture2D texSiege       = LoadSpriteChroma("public/assets/sprites/siege_catapult.jpg");
    Texture2D texBoss1       = LoadSpriteChroma("public/assets/sprites/boss_warlord_1.jpg");
    Texture2D texBoss2       = LoadSpriteChroma("public/assets/sprites/boss_warlord_2.jpg");

    int currentLevel = 1;
    float allyCastleHp = 1120.0f, allyCastleMaxHp = 1120.0f;
    float enemyCastleHp = REALM_LEVELS[0].enemyCastleHp, enemyCastleMaxHp = REALM_LEVELS[0].enemyCastleHp;
    float gold = 200.0f;
    int score = 0;
    int highScore = 8523;

    float spawnTimer = 2.0f;
    float dragonCooldown = 6.0f;
    ActiveDragon dragon = { false, false, -200.0f, 185.0f, 300.0f, 0.0f, 0.0f };

    Actor actors[MAX_ACTORS] = {0};

    // Hero Commander
    actors[0] = { true, false, false, true, UNIT_HERO, ALLY_CASTLE_X + 90.0f, GROUND_Y, 820.0f, 820.0f, 56.0f, 80.0f, 190.0f, 0.65f, 0.0f, 1.15f, 0.0f, 0.0f, 0.0f, "Sir Roland" };

    // Initial Boss Vanguard (Firmly on land at GROUND_Y)
    actors[1] = { true, true, true, false, UNIT_BOSS_WARLORD, ENEMY_CASTLE_X - 160.0f, GROUND_Y, 780.0f, 780.0f, 44.0f, 75.0f, 110.0f, 0.85f, 0.0f, 1.25f, 0.0f, 0.0f, 0.0f, "Boss Warlord" };
    actors[2] = { true, true, true, false, UNIT_SUPREME_BOSS, ENEMY_CASTLE_X - 70.0f,  GROUND_Y, 860.0f, 860.0f, 48.0f, 75.0f, 105.0f, 0.85f, 0.0f, 1.25f, 0.0f, 0.0f, 0.0f, "Supreme Boss" };

    bool isGameOver = false;
    bool isVictory = false;

    while (!WindowShouldClose()) {
        float dt = GetFrameTime();
        if (dt > 0.05f) dt = 0.05f; // Clamp delta

        if (!isGameOver) {
            gold += 14.0f * dt;
            score += (int)(8.0f * dt);
            if (dragonCooldown > 0.0f) dragonCooldown -= dt;

            // ----------------------------------------------------------------
            // 1. Player Input & Unit Deployment
            // ----------------------------------------------------------------
            // Hero manual movement (A / D)
            if (actors[0].active) {
                bool moved = false;
                if (IsKeyDown(KEY_A) || IsKeyDown(KEY_LEFT)) {
                    actors[0].x -= actors[0].speed * dt;
                    moved = true;
                }
                if (IsKeyDown(KEY_D) || IsKeyDown(KEY_RIGHT)) {
                    actors[0].x += actors[0].speed * dt;
                    moved = true;
                }
                if (actors[0].x < ALLY_CASTLE_X + 40.0f) actors[0].x = ALLY_CASTLE_X + 40.0f;
                if (actors[0].x > ENEMY_CASTLE_X - 80.0f) actors[0].x = ENEMY_CASTLE_X - 80.0f;
                if (moved) actors[0].walkPhase += dt * 8.0f;
            }

            // Timed Hero Parry / Strike [Space]
            if (IsKeyPressed(KEY_SPACE) && actors[0].active && actors[0].attackTimer <= 0.0f) {
                actors[0].attackTimer = actors[0].attackCooldown;
                actors[0].swingAnim = 1.0f;
                SpawnBurst(actors[0].x + 35.0f, GROUND_Y - 35.0f, 12, GOLD);
                // Hit nearest enemy
                for (int i = 1; i < MAX_ACTORS; i++) {
                    if (actors[i].active && actors[i].isEnemy && fabsf(actors[i].x - actors[i].x) < actors[0].range + 20.0f) {
                        actors[i].hp -= actors[0].damage * 1.5f;
                        actors[i].hitFlash = 0.25f;
                        if (actors[i].hp <= 0.0f) {
                            actors[i].active = false;
                            gold += 35.0f;
                            SpawnBurst(actors[i].x, GROUND_Y - 40.0f, 20, ORANGE);
                        }
                        break;
                    }
                }
            }

            // Deploy [1] Mounted Squire (40 Gold)
            if (IsKeyPressed(KEY_ONE) && gold >= 40.0f) {
                gold -= 40.0f;
                for (int i = 3; i < MAX_ACTORS; i++) if (!actors[i].active) {
                    actors[i] = { true, false, false, false, UNIT_SQUIRE, ALLY_CASTLE_X + 75.0f, GROUND_Y, 260.0f, 260.0f, 32.0f, 65.0f, 130.0f, 0.8f, 0.0f, 0.95f, 0.0f, 0.0f, 0.0f, "Squire" };
                    break;
                }
            }

            // Deploy [2] Horse Archer (65 Gold)
            if (IsKeyPressed(KEY_TWO) && gold >= 65.0f) {
                gold -= 65.0f;
                for (int i = 3; i < MAX_ACTORS; i++) if (!actors[i].active) {
                    actors[i] = { true, false, false, false, UNIT_ARCHER, ALLY_CASTLE_X + 65.0f, GROUND_Y, 185.0f, 185.0f, 36.0f, 240.0f, 115.0f, 1.1f, 0.0f, 0.92f, 0.0f, 0.0f, 0.0f, "Archer" };
                    break;
                }
            }

            // Deploy [3] Royal Paladin (110 Gold)
            if (IsKeyPressed(KEY_THREE) && gold >= 110.0f) {
                gold -= 110.0f;
                for (int i = 3; i < MAX_ACTORS; i++) if (!actors[i].active) {
                    actors[i] = { true, false, false, false, UNIT_PALADIN, ALLY_CASTLE_X + 85.0f, GROUND_Y, 480.0f, 480.0f, 44.0f, 70.0f, 120.0f, 0.85f, 0.0f, 1.05f, 0.0f, 0.0f, 0.0f, "Paladin" };
                    break;
                }
            }

            // Deploy [4] Siege Catapult (165 Gold)
            if (IsKeyPressed(KEY_FOUR) && gold >= 165.0f) {
                gold -= 165.0f;
                for (int i = 3; i < MAX_ACTORS; i++) if (!actors[i].active) {
                    actors[i] = { true, false, false, false, UNIT_CATAPULT, ALLY_CASTLE_X + 50.0f, GROUND_Y, 340.0f, 340.0f, 95.0f, 360.0f, 65.0f, 2.2f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, "Catapult" };
                    break;
                }
            }

            // Summon Sky Dragon [E]
            if (IsKeyPressed(KEY_E) && !dragon.active && dragonCooldown <= 0.0f) {
                dragon.active = true;
                dragon.isEnemy = false;
                dragon.x = ALLY_CASTLE_X + 50.0f;
                dragon.y = 185.0f;
                dragon.vx = 280.0f;
                dragonCooldown = 24.0f;
            }

            // ----------------------------------------------------------------
            // 2. Dragon Sky Raid Update
            // ----------------------------------------------------------------
            if (dragon.active) {
                dragon.x += dragon.vx * dt;
                dragon.wingPhase += dt * 11.2f;
                dragon.breathTimer -= dt;
                if (dragon.breathTimer <= 0.0f) {
                    dragon.breathTimer = 0.08f;
                    SpawnBurst(dragon.x + 85.0f, dragon.y + 20.0f, 4, ORANGE);
                    // Area breath damage
                    for (int i = 0; i < MAX_ACTORS; i++) {
                        if (actors[i].active && actors[i].isEnemy && fabsf(actors[i].x - (dragon.x + 85.0f)) < 95.0f) {
                            actors[i].hp -= 50.0f;
                            actors[i].hitFlash = 0.2f;
                            if (actors[i].hp <= 0.0f) {
                                actors[i].active = false;
                                gold += 25.0f;
                            }
                        }
                    }
                    if (fabsf(ENEMY_CASTLE_X - (dragon.x + 85.0f)) < 110.0f) {
                        enemyCastleHp -= 60.0f;
                    }
                }
                if (dragon.x > ENEMY_CASTLE_X + 180.0f) dragon.active = false;
            }

            // ----------------------------------------------------------------
            // 3. Enemy Reinforcements & Periodic Boss Waves (On Land!)
            // ----------------------------------------------------------------
            spawnTimer -= dt;
            if (spawnTimer <= 0.0f) {
                spawnTimer = REALM_LEVELS[currentLevel - 1].spawnInterval;
                for (int i = 3; i < MAX_ACTORS; i++) if (!actors[i].active) {
                    int pick = rand() % 3;
                    if (pick == 0) {
                        actors[i] = { true, true, false, false, UNIT_SQUIRE, ENEMY_CASTLE_X - 60.0f, GROUND_Y, 240.0f + currentLevel * 20.0f, 240.0f + currentLevel * 20.0f, 26.0f + currentLevel * 3.0f, 65.0f, 115.0f, 0.9f, 0.0f, 0.95f, 0.0f, 0.0f, 0.0f, "Raider" };
                    } else if (pick == 1) {
                        actors[i] = { true, true, false, false, UNIT_ARCHER, ENEMY_CASTLE_X - 80.0f, GROUND_Y, 180.0f + currentLevel * 18.0f, 180.0f + currentLevel * 18.0f, 28.0f + currentLevel * 3.0f, 230.0f, 105.0f, 1.15f, 0.0f, 0.92f, 0.0f, 0.0f, 0.0f, "Marksman" };
                    } else {
                        actors[i] = { true, true, true, false, UNIT_BOSS_WARLORD, ENEMY_CASTLE_X - 50.0f, GROUND_Y, 520.0f + currentLevel * 45.0f, 520.0f + currentLevel * 45.0f, 38.0f + currentLevel * 4.0f, 70.0f, 105.0f, 0.85f, 0.0f, 1.2f, 0.0f, 0.0f, 0.0f, REALM_LEVELS[currentLevel - 1].bossName };
                    }
                    break;
                }
            }

            // ----------------------------------------------------------------
            // 4. Combat Simulation on the Causeway
            // ----------------------------------------------------------------
            for (int i = 0; i < MAX_ACTORS; i++) {
                if (!actors[i].active) continue;
                Actor* a = &actors[i];
                if (a->attackTimer > 0.0f) a->attackTimer -= dt;
                if (a->swingAnim > 0.0f) a->swingAnim -= dt * 3.5f;
                if (a->hitFlash > 0.0f) a->hitFlash -= dt;

                float dir = a->isEnemy ? -1.0f : 1.0f;
                int targetIdx = -1;
                float bestDist = 99999.0f;

                for (int j = 0; j < MAX_ACTORS; j++) {
                    if (!actors[j].active || actors[j].isEnemy == a->isEnemy) continue;
                    float d = (actors[j].x - a->x) * dir;
                    if (d >= -15.0f && d < bestDist) {
                        bestDist = d;
                        targetIdx = j;
                    }
                }

                float castleDist = a->isEnemy ? (a->x - (ALLY_CASTLE_X + 65.0f)) : ((ENEMY_CASTLE_X - 65.0f) - a->x);
                float effDist = (bestDist < castleDist) ? bestDist : castleDist;

                if (effDist <= a->range) {
                    // In attack range
                    if (a->attackTimer <= 0.0f) {
                        a->attackTimer = a->attackCooldown;
                        a->swingAnim = 1.0f;
                        if (targetIdx >= 0 && bestDist <= a->range) {
                            actors[targetIdx].hp -= a->damage;
                            actors[targetIdx].hitFlash = 0.2f;
                            SpawnBurst(actors[targetIdx].x, GROUND_Y - 30.0f, 6, RED);
                            if (actors[targetIdx].hp <= 0.0f) {
                                actors[targetIdx].active = false;
                                if (a->isEnemy == false) gold += 28.0f;
                            }
                        } else if (castleDist <= a->range) {
                            if (a->isEnemy) allyCastleHp -= a->damage;
                            else enemyCastleHp -= a->damage;
                            SpawnBurst(a->isEnemy ? ALLY_CASTLE_X + 50.0f : ENEMY_CASTLE_X - 50.0f, GROUND_Y - 50.0f, 10, ORANGE);
                        }
                    }
                } else if (!a->isHero) {
                    // March forward on the land
                    a->x += dir * a->speed * dt;
                    a->walkPhase += dt * 8.5f;
                }
            }

            // Check Battle End
            if (enemyCastleHp <= 0.0f) {
                enemyCastleHp = 0.0f;
                isGameOver = true;
                isVictory = true;
                if (score > highScore) highScore = score;
                SpawnBurst(ENEMY_CASTLE_X, GROUND_Y - 120.0f, 60, GOLD);
            } else if (allyCastleHp <= 0.0f) {
                allyCastleHp = 0.0f;
                isGameOver = true;
                isVictory = false;
                SpawnBurst(ALLY_CASTLE_X, GROUND_Y - 120.0f, 50, RED);
            }
        } else {
            // Restart or advance level
            if (IsKeyPressed(KEY_ENTER) || IsKeyPressed(KEY_SPACE)) {
                if (isVictory && currentLevel < 20) currentLevel++;
                allyCastleHp = allyCastleMaxHp;
                enemyCastleHp = REALM_LEVELS[currentLevel - 1].enemyCastleHp;
                enemyCastleMaxHp = enemyCastleHp;
                gold = 200.0f;
                isGameOver = false;
                for (int i = 1; i < MAX_ACTORS; i++) actors[i].active = false;
                actors[0].x = ALLY_CASTLE_X + 90.0f;
                actors[0].hp = actors[0].maxHp;
            }
        }

        // --------------------------------------------------------------------
        // Rendering
        // --------------------------------------------------------------------
        BeginDrawing();
        ClearBackground(GetColor(0x0f172a));

        // 1. Battlefield Illustrated Background
        DrawTexturePro(texBg, { 0, 0, (float)texBg.width, (float)texBg.height },
                       { 0, 0, (float)SCREEN_WIDTH, (float)SCREEN_HEIGHT }, { 0, 0 }, 0.0f, WHITE);

        // 2. Castles
        DrawGallopingHorse(texCastleAlly,  ALLY_CASTLE_X,  GROUND_Y + 34.0f, 350.0f, 380.0f, false, 0.0f, false);
        DrawGallopingHorse(texCastleEnemy, ENEMY_CASTLE_X, GROUND_Y + 34.0f, 360.0f, 390.0f, false, 0.0f, false);

        // 3. Characters, Heroes & Bosses (ALL FIRMLY ON LAND)
        for (int i = 0; i < MAX_ACTORS; i++) {
            if (!actors[i].active) continue;
            Actor* a = &actors[i];
            Texture2D spr = texKnight;
            bool flip = a->isEnemy;

            if (a->kind == UNIT_ARCHER) spr = texArcher;
            else if (a->kind == UNIT_CATAPULT) spr = texSiege;
            else if (a->kind == UNIT_BOSS_WARLORD) { spr = texBoss1; flip = true; } // faces right natively
            else if (a->kind == UNIT_SUPREME_BOSS) { spr = texBoss2; flip = false; } // faces left natively

            float drawSz = 144.0f * a->scale;
            bool isMoving = !a->isHero || (IsKeyDown(KEY_A) || IsKeyDown(KEY_D));
            DrawGallopingHorse(spr, a->x, a->y, drawSz, drawSz, flip, a->walkPhase, isMoving);

            // Health bar & Nameplate
            float barW = a->isBoss || a->isHero ? 58.0f : 42.0f;
            float barH = 5.0f;
            float barY = a->y - drawSz + 8.0f;
            DrawRectangle((int)(a->x - barW * 0.5f - 1), (int)barY - 1, (int)barW + 2, (int)barH + 2, BLACK);
            float hpPct = a->hp / a->maxHp;
            if (hpPct < 0.0f) hpPct = 0.0f;
            DrawRectangle((int)(a->x - barW * 0.5f), (int)barY, (int)(barW * hpPct), (int)barH, a->isEnemy ? RED : SKYBLUE);
            DrawText(a->name.c_str(), (int)(a->x - barW * 0.5f), (int)barY - 14, 10, a->isBoss ? GOLD : RAYWHITE);
        }

        // 4. Flying Dragon in the Sky
        if (dragon.active) {
            DrawFlappingDragon(texDragon, dragon.x, dragon.y, 280.0f, 250.0f, dragon.isEnemy, dragon.wingPhase);
        }

        // 5. Particles
        UpdateAndDrawParticles(dt);

        // 6. Top HUD
        DrawRectangle(14, 12, 340, 52, ColorAlpha(GetColor(0x090a0f), 0.88f));
        DrawRectangleLines(14, 12, 340, 52, ColorAlpha(SKYBLUE, 0.6f));
        DrawText("CASTLE OF GAZA", 24, 18, 14, SKYBLUE);
        char allyHpBuf[32]; snprintf(allyHpBuf, sizeof(allyHpBuf), "HP: %.0f / %.0f", allyCastleHp, allyCastleMaxHp);
        DrawText(allyHpBuf, 24, 38, 12, RAYWHITE);

        DrawRectangle(SCREEN_WIDTH - 354, 12, 340, 52, ColorAlpha(GetColor(0x090a0f), 0.88f));
        DrawRectangleLines(SCREEN_WIDTH - 354, 12, 340, 52, ColorAlpha(RED, 0.6f));
        DrawText("CASTLE OF EPSTEIN", SCREEN_WIDTH - 344, 18, 14, RED);
        char enemyHpBuf[32]; snprintf(enemyHpBuf, sizeof(enemyHpBuf), "HP: %.0f / %.0f", enemyCastleHp, enemyCastleMaxHp);
        DrawText(enemyHpBuf, SCREEN_WIDTH - 344, 38, 12, RAYWHITE);

        // Center Realm Info
        DrawRectangle(440, 12, 400, 52, ColorAlpha(GetColor(0x090a0f), 0.88f));
        DrawRectangleLines(440, 12, 400, 52, ColorAlpha(GOLD, 0.6f));
        char realmBuf[64]; snprintf(realmBuf, sizeof(realmBuf), "REALM %d: %s", currentLevel, REALM_LEVELS[currentLevel - 1].realmName);
        DrawText(realmBuf, 452, 18, 13, GOLD);
        char goldBuf[64]; snprintf(goldBuf, sizeof(goldBuf), "Gold: %.0f (+14/s)  Score: %d  Best: %d", gold, score, highScore);
        DrawText(goldBuf, 452, 38, 11, RAYWHITE);

        // Bottom Controls HUD
        DrawRectangle(160, SCREEN_HEIGHT - 60, SCREEN_WIDTH - 320, 48, ColorAlpha(GetColor(0x090a0f), 0.92f));
        DrawRectangleLines(160, SCREEN_HEIGHT - 60, SCREEN_WIDTH - 320, 48, ColorAlpha(GetColor(0x334155), 0.8f));
        DrawText("[1] Squire (40g)   [2] Archer (65g)   [3] Paladin (110g)   [4] Catapult (165g)   [Space] Strike   [E] Dragon", 175, SCREEN_HEIGHT - 44, 13, RAYWHITE);

        // Victory / Defeat Modal
        if (isGameOver) {
            DrawRectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, ColorAlpha(BLACK, 0.75f));
            DrawRectangle(SCREEN_WIDTH / 2 - 250, SCREEN_HEIGHT / 2 - 140, 500, 260, ColorAlpha(GetColor(0x0f172a), 0.95f));
            DrawRectangleLines(SCREEN_WIDTH / 2 - 250, SCREEN_HEIGHT / 2 - 140, 500, 260, isVictory ? GOLD : RED);
            if (isVictory) {
                DrawText("CASTLE CAPTURED! VICTORY!", SCREEN_WIDTH / 2 - 190, SCREEN_HEIGHT / 2 - 95, 24, GOLD);
                DrawText("Press [ENTER] to Advance to Next Realm", SCREEN_WIDTH / 2 - 180, SCREEN_HEIGHT / 2 + 10, 16, RAYWHITE);
            } else {
                DrawText("DEFEAT — CASTLE BREACHED", SCREEN_WIDTH / 2 - 185, SCREEN_HEIGHT / 2 - 95, 24, RED);
                DrawText("Press [ENTER] to Retry Realm", SCREEN_WIDTH / 2 - 140, SCREEN_HEIGHT / 2 + 10, 16, RAYWHITE);
            }
        }

        EndDrawing();
    }

    // Cleanup Textures
    UnloadTexture(texBg);
    UnloadTexture(texCastleAlly);
    UnloadTexture(texCastleEnemy);
    UnloadTexture(texDragon);
    UnloadTexture(texKnight);
    UnloadTexture(texArcher);
    UnloadTexture(texSiege);
    UnloadTexture(texBoss1);
    UnloadTexture(texBoss2);

    CloseWindow();
    return 0;
}
