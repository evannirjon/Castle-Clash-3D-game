// ============================================================================
// CASTLE CLASH: HEROES VS BOSSES — Complete Raylib (C99) Implementation
// Compile (Linux/macOS): gcc public/raylib_kingdom_invaders.c -o kingdom_invaders -lraylib -lm
// Compile (Windows MinGW): gcc public/raylib_kingdom_invaders.c -o kingdom_invaders.exe -lraylib -lopengl32 -lgdi32 -lwinmm
// ============================================================================

#include "raylib.h"
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define SCREEN_WIDTH 1440
#define SCREEN_HEIGHT 820
#define GROUND_Y 595.0f
#define PLAYER_CASTLE_X 175.0f
#define ENEMY_CASTLE_X 1265.0f
#define MAX_ACTORS 64

typedef struct {
    bool active;
    bool isEnemy;
    bool isBoss;
    bool isHero;
    int spriteKind; // 0: knight, 1: archer, 2: siege, 3: boss1, 4: boss2
    float x, y;
    float hp, maxHp;
    float damage, range, speed;
    float attackTimer, attackCooldown;
    float scale;
    float walkPhase;
    const char *name;
} Actor;

static Texture2D LoadSpriteChroma(const char *path) {
    Image img = LoadImage(path);
    ImageFormat(&img, PIXELFORMAT_UNCOMPRESSED_R8G8B8A8);
    Color *pixels = LoadImageColors(img);
    for (int i = 0; i < img.width * img.height; i++) {
        if (pixels[i].r > 232 && pixels[i].g > 232 && pixels[i].b > 230) {
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

static void DrawSprite(Texture2D tex, float cx, float bottomY, float drawW, float drawH, bool flipX) {
    Rectangle src = { 0.0f, 0.0f, flipX ? -(float)tex.width : (float)tex.width, (float)tex.height };
    Rectangle dst = { cx - drawW * 0.5f, bottomY - drawH, drawW, drawH };
    DrawTexturePro(tex, src, dst, (Vector2){0, 0}, 0.0f, WHITE);
}

int main(void) {
    InitWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Castle Clash: Heroes vs Bosses (Raylib 2D)");
    SetTargetFPS(60);

    Texture2D texBg          = LoadTexture("public/assets/sprites/battlefield_bg.jpg");
    Texture2D texCastleAlly  = LoadSpriteChroma("public/assets/sprites/castle_ally.jpg");
    Texture2D texCastleEnemy = LoadSpriteChroma("public/assets/sprites/castle_enemy.jpg");
    Texture2D texDragon      = LoadSpriteChroma("public/assets/sprites/dragon_sprite.jpg");
    Texture2D texKnight      = LoadSpriteChroma("public/assets/sprites/cavalry_knight.jpg");
    Texture2D texArcher      = LoadSpriteChroma("public/assets/sprites/cavalry_archer.jpg");
    Texture2D texSiege       = LoadSpriteChroma("public/assets/sprites/siege_catapult.jpg");
    Texture2D texBoss1       = LoadSpriteChroma("public/assets/sprites/boss_warlord_1.jpg");
    Texture2D texBoss2       = LoadSpriteChroma("public/assets/sprites/boss_warlord_2.jpg");

    float playerCastleHp = 1200.0f, playerCastleMaxHp = 1200.0f;
    float enemyCastleHp  = 1400.0f, enemyCastleMaxHp  = 1400.0f;
    float gold = 180.0f;
    int level = 1;
    float spawnTimer = 2.5f;
    bool dragonActive = false;
    float dragonX = -200.0f, dragonCooldown = 0.0f;

    Actor actors[MAX_ACTORS] = {0};
    actors[0] = (Actor){ true, false, false, true, 0, PLAYER_CASTLE_X + 180, GROUND_Y, 680, 680, 54, 75, 185, 0, 0.7f, 1.15f, 0, "Sir Roland" };
    actors[1] = (Actor){ true, true,  true,  false, 3, ENEMY_CASTLE_X - 180, GROUND_Y, 520, 520, 42, 72, 118, 0, 0.85f, 1.25f, 0, "Boss Warlord" };
    actors[2] = (Actor){ true, true,  true,  false, 4, ENEMY_CASTLE_X - 95,  GROUND_Y, 560, 560, 46, 72, 115, 0, 0.85f, 1.25f, 1.2f, "Supreme Boss" };

    while (!WindowShouldClose()) {
        float dt = GetFrameTime();
        gold += 14.0f * dt;
        if (dragonCooldown > 0) dragonCooldown -= dt;

        if (actors[0].active) {
            if (IsKeyDown(KEY_A) || IsKeyDown(KEY_LEFT))  actors[0].x -= actors[0].speed * dt;
            if (IsKeyDown(KEY_D) || IsKeyDown(KEY_RIGHT)) actors[0].x += actors[0].speed * dt;
            actors[0].walkPhase += dt * 6.0f;
        }

        if (IsKeyPressed(KEY_ONE) && gold >= 45) {
            gold -= 45;
            for (int i = 1; i < MAX_ACTORS; i++) if (!actors[i].active) {
                actors[i] = (Actor){ true, false, false, false, 0, PLAYER_CASTLE_X + 110, GROUND_Y, 260, 260, 28, 65, 130, 0, 0.8f, 0.95f, 0, "Royal Knight" };
                break;
            }
        }
        if (IsKeyPressed(KEY_TWO) && gold >= 70) {
            gold -= 70;
            for (int i = 1; i < MAX_ACTORS; i++) if (!actors[i].active) {
                actors[i] = (Actor){ true, false, false, false, 1, PLAYER_CASTLE_X + 95, GROUND_Y, 175, 175, 32, 250, 115, 0, 0.9f, 0.92f, 0, "Horse Archer" };
                break;
            }
        }
        if (IsKeyPressed(KEY_THREE) && gold >= 150) {
            gold -= 150;
            for (int i = 1; i < MAX_ACTORS; i++) if (!actors[i].active) {
                actors[i] = (Actor){ true, false, false, false, 2, PLAYER_CASTLE_X + 85, GROUND_Y, 360, 360, 95, 360, 68, 0, 2.0f, 1.0f, 0, "Siege Catapult" };
                break;
            }
        }
        if (IsKeyPressed(KEY_E) && !dragonActive && dragonCooldown <= 0.0f) {
            dragonActive = true;
            dragonX = 280.0f;
            dragonCooldown = 20.0f;
        }

        if (dragonActive) {
            dragonX += 320.0f * dt;
            for (int i = 0; i < MAX_ACTORS; i++) {
                if (actors[i].active && actors[i].isEnemy && fabsf(actors[i].x - (dragonX + 90)) < 95.0f) {
                    actors[i].hp -= 120.0f * dt;
                    if (actors[i].hp <= 0) actors[i].active = false;
                }
            }
            if (dragonX > SCREEN_WIDTH + 200) dragonActive = false;
        }

        spawnTimer -= dt;
        if (spawnTimer <= 0.0f) {
            spawnTimer = 3.2f;
            for (int i = 1; i < MAX_ACTORS; i++) if (!actors[i].active) {
                int kind = (rand() % 2 == 0) ? 3 : 4;
                actors[i] = (Actor){ true, true, true, false, kind, ENEMY_CASTLE_X - 100, GROUND_Y, 480 + level * 60, 480 + level * 60, 38 + level * 6, 70, 115, 0, 0.85f, 1.2f, 0, kind == 3 ? "Boss Warlord" : "Supreme Boss" };
                break;
            }
        }

        BeginDrawing();
        ClearBackground(BLACK);

        DrawTexturePro(texBg, (Rectangle){0, 0, (float)texBg.width, (float)texBg.height},
                       (Rectangle){0, 0, SCREEN_WIDTH, SCREEN_HEIGHT}, (Vector2){0, 0}, 0.0f, WHITE);

        DrawSprite(texCastleAlly,  PLAYER_CASTLE_X, GROUND_Y + 25, 360, 390, false);
        DrawSprite(texCastleEnemy, ENEMY_CASTLE_X,  GROUND_Y + 25, 370, 400, false);

        for (int i = 0; i < MAX_ACTORS; i++) {
            if (!actors[i].active) continue;
            Actor *a = &actors[i];
            float bob = fabsf(sinf(a->walkPhase)) * 5.0f;
            Texture2D spr = texKnight;
            bool flip = false;
            if (a->spriteKind == 0) { spr = texKnight; flip = a->isEnemy; }
            else if (a->spriteKind == 1) { spr = texArcher; flip = a->isEnemy; }
            else if (a->spriteKind == 2) { spr = texSiege;  flip = a->isEnemy; }
            else if (a->spriteKind == 3) { spr = texBoss1;  flip = true; }
            else if (a->spriteKind == 4) { spr = texBoss2;  flip = false; }

            float sz = 148.0f * a->scale;
            DrawSprite(spr, a->x, a->y - bob + 12, sz, sz, flip);
        }

        if (dragonActive) {
            DrawSprite(texDragon, dragonX, 290.0f + sinf(dragonX * 0.03f) * 14.0f, 290, 260, false);
        }

        EndDrawing();
    }

    CloseWindow();
    return 0;
}
