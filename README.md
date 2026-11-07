# Castle Clash: Heroes vs Bosses

A polished 2D medieval strategy & kingdom siege game featuring cavalry animations, flying dragons, castle warfare, and cartoon boss commanders.

---

## 🎮 Play in Browser

[![Play Game Online](https://img.shields.io/badge/PLAY-GAME%20ONLINE-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white)](https://evannirjon.github.io/Castle-Clash-3D-game/)

👉 **Direct Click-to-Play Link**: [https://evannirjon.github.io/Castle-Clash-3D-game/](https://evannirjon.github.io/Castle-Clash-3D-game/)

---

### 🕹️ Controls:
- **`A` / `D` or `←` / `→`**: Move Hero Commander along the causeway
- **`Space`**: Timed Hero Strike / Parry (stun bosses on windup, deal 2.0x damage, bonus gold)
- **`1`**: Deploy Mounted Squire (Melee vanguard)
- **`2`**: Deploy Horse Archer (Ranged volley support)
- **`3`**: Deploy Royal Paladin (Heavy armor & shield breaker)
- **`4`**: Deploy Siege Catapult (Long-range castle breaker)
- **`5` / `6`**: Fortify Castle Walls & Cannons
- **`Q`**: Hero Ultimate Power
- **`E`**: Summon Mighty Sky Dragon (Aerial flame raid)

---

## 💻 Native C++ Raylib Implementation (`game.cpp`)

To compile and run the single-file C++ game natively:

```bash
# Linux
g++ -O2 game.cpp -o game -lraylib -lGL -lm -lpthread -ldl -lrt -lX11 && ./game

# Windows (MinGW)
g++ -O2 game.cpp -o game.exe -lraylib -lopengl32 -lgdi32 -lwinmm && game.exe

# macOS
clang++ -O2 game.cpp -o game -L/opt/homebrew/lib -I/opt/homebrew/include -lraylib -framework OpenGL -framework Cocoa -framework IOKit -framework CoreVideo && ./game
```
