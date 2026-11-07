import React, { useState } from 'react';

export const RAYLIB_C_SOURCE = `// ============================================================================
// CASTLE CLASH: HEROES VS BOSSES — Complete Raylib (C99) Implementation
// Compile (Linux/macOS): gcc raylib_kingdom_invaders.c -o kingdom_invaders -lraylib -lm
// Compile (Windows MinGW): gcc raylib_kingdom_invaders.c -o kingdom_invaders.exe -lraylib -lopengl32 -lgdi32 -lwinmm
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
    // Spawn Player Mounted Hero + Initial Boss War-Party
    actors[0] = (Actor){ true, false, false, true, 0, PLAYER_CASTLE_X + 180, GROUND_Y, 680, 680, 54, 75, 185, 0, 0.7f, 1.15f, 0, "Sir Roland" };
    actors[1] = (Actor){ true, true,  true,  false, 3, ENEMY_CASTLE_X - 180, GROUND_Y, 520, 520, 42, 72, 118, 0, 0.85f, 1.25f, 0, "Boss Warlord" };
    actors[2] = (Actor){ true, true,  true,  false, 4, ENEMY_CASTLE_X - 95,  GROUND_Y, 560, 560, 46, 72, 115, 0, 0.85f, 1.25f, 1.2f, "Supreme Boss" };

    while (!WindowShouldClose()) {
        float dt = GetFrameTime();
        gold += 14.0f * dt;
        if (dragonCooldown > 0) dragonCooldown -= dt;

        // Hero Movement (A / D)
        if (actors[0].active) {
            if (IsKeyDown(KEY_A) || IsKeyDown(KEY_LEFT))  actors[0].x -= actors[0].speed * dt;
            if (IsKeyDown(KEY_D) || IsKeyDown(KEY_RIGHT)) actors[0].x += actors[0].speed * dt;
            actors[0].walkPhase += dt * 6.0f;
        }

        // Deploy Cavalry & Siege (Keys 1-3) & Summon Dragon (Key E)
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

        // Periodic Boss Wave Spawn
        spawnTimer -= dt;
        if (spawnTimer <= 0.0f) {
            spawnTimer = 3.2f;
            for (int i = 1; i < MAX_ACTORS; i++) if (!actors[i].active) {
                int kind = (rand() % 2 == 0) ? 3 : 4;
                actors[i] = (Actor){ true, true, true, false, kind, ENEMY_CASTLE_X - 100, GROUND_Y, 480 + level * 60, 480 + level * 60, 38 + level * 6, 70, 115, 0, 0.85f, 1.2f, 0, kind == 3 ? "Boss Warlord" : "Supreme Boss" };
                break;
            }
        }

        // Update Combat
        for (int i = 0; i < MAX_ACTORS; i++) {
            if (!actors[i].active) continue;
            Actor *a = &actors[i];
            if (a->attackTimer > 0) a->attackTimer -= dt;
            float dir = a->isEnemy ? -1.0f : 1.0f;
            int targetIdx = -1;
            float bestDist = 9999.0f;

            for (int j = 0; j < MAX_ACTORS; j++) {
                if (!actors[j].active || actors[j].isEnemy == a->isEnemy) continue;
                float d = (actors[j].x - a->x) * dir;
                if (d >= -20.0f && d < bestDist) { bestDist = d; targetIdx = j; }
            }
            float castleDist = a->isEnemy ? (a->x - (PLAYER_CASTLE_X + 70)) : ((ENEMY_CASTLE_X - 70) - a->x);
            float effDist = (bestDist < castleDist) ? bestDist : castleDist;

            if (effDist <= a->range) {
                if (a->attackTimer <= 0.0f) {
                    a->attackTimer = a->attackCooldown;
                    if (targetIdx >= 0 && bestDist <= a->range) {
                        actors[targetIdx].hp -= a->damage;
                        if (actors[targetIdx].hp <= 0) { actors[targetIdx].active = false; gold += 35.0f; }
                    } else if (castleDist <= a->range) {
                        if (a->isEnemy) playerCastleHp -= a->damage;
                        else enemyCastleHp -= a->damage;
                    }
                }
            } else if (!a->isHero) {
                a->x += dir * a->speed * dt;
                a->walkPhase += dt * 6.0f;
            }
        }

        BeginDrawing();
        ClearBackground(BLACK);

        // 1. Draw Illustrated Battlefield Background
        DrawTexturePro(texBg, (Rectangle){0, 0, (float)texBg.width, (float)texBg.height},
                       (Rectangle){0, 0, SCREEN_WIDTH, SCREEN_HEIGHT}, (Vector2){0, 0}, 0.0f, WHITE);

        // 2. Draw Left & Right Castles
        DrawSprite(texCastleAlly,  PLAYER_CASTLE_X, GROUND_Y + 25, 360, 390, false);
        DrawSprite(texCastleEnemy, ENEMY_CASTLE_X,  GROUND_Y + 25, 370, 400, false);

        // 3. Draw Units & Cartoon Boss Commanders on Warhorses
        for (int i = 0; i < MAX_ACTORS; i++) {
            if (!actors[i].active) continue;
            Actor *a = &actors[i];
            float bob = fabsf(sinf(a->walkPhase)) * 5.0f;
            Texture2D spr = texKnight;
            bool flip = false;
            if (a->spriteKind == 0) { spr = texKnight; flip = a->isEnemy; }
            else if (a->spriteKind == 1) { spr = texArcher; flip = a->isEnemy; }
            else if (a->spriteKind == 2) { spr = texSiege;  flip = a->isEnemy; }
            else if (a->spriteKind == 3) { spr = texBoss1;  flip = true; }  // boss_warlord_1 faces right natively, flip to march left
            else if (a->spriteKind == 4) { spr = texBoss2;  flip = false; } // boss_warlord_2 faces left natively

            float sz = 148.0f * a->scale;
            DrawSprite(spr, a->x, a->y - bob + 12, sz, sz, flip);

            // Health bar
            DrawRectangle((int)(a->x - 28), (int)(a->y - sz - 8), 56, 7, BLACK);
            DrawRectangle((int)(a->x - 27), (int)(a->y - sz - 7), (int)(54 * (a->hp / a->maxHp)), 5, a->isEnemy ? RED : SKYBLUE);
            DrawText(a->name, (int)(a->x - 36), (int)(a->y - sz - 22), 12, GOLD);
        }

        // 4. Draw Winged Fire Dragon
        if (dragonActive) {
            DrawSprite(texDragon, dragonX, 290.0f + sinf(dragonX * 0.03f) * 14.0f, 290, 260, false);
        }

        EndDrawing();
    }

    CloseWindow();
    return 0;
}
`;

interface RaylibCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaylibCodeModal: React.FC<RaylibCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(RAYLIB_C_SOURCE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      style={{ backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-4xl max-h-[86vh] rounded-xl bg-[#0f172a] border-2 border-amber-400/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div className="px-5 py-3.5 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-amber-300 tracking-wider uppercase">
              Raylib 2D C Source Code (raylib_kingdom_invaders.c)
            </h2>
            <p className="text-xs text-slate-300">
              Uses the exact high-resolution generated sprites &amp; Boss Warlord textures in Raylib C99
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {copied ? 'Copied C Code!' : 'Copy C Code'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-auto leading-relaxed select-all bg-[#090d16]">
          {RAYLIB_C_SOURCE}
        </pre>
      </div>
    </div>
  );
};
