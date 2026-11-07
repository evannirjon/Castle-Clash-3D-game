# Castle Clash: Heroes vs Bosses

A complete 2D medieval strategy & tower defense game built with Raylib and React/TypeScript.

---

## 🎮 How to Play in Browser
The web version is fully playable in any browser via `index.html`.
- Run the dev server:
  ```bash
  npm run dev
  ```
- Or build for production:
  ```bash
  npm run build
  ```

### Controls:
- **`A` / `D` or `←` / `→`**: Move your Hero Commander along the causeway.
- **`Space`**: Timed Hero Strike / Parry (stun bosses during windup and earn bonus gold).
- **`1`**: Deploy Mounted Squire (Melee vanguard).
- **`2`**: Deploy Horse Archer (Ranged volley support).
- **`3`**: Deploy Royal Paladin (Heavy armor & shield breaker).
- **`4`**: Deploy Siege Catapult (Long-range castle breaker).
- **`5` / `6`**: Fortify Castle Walls & Cannons.
- **`Q`**: Hero Ultimate Power.
- **`E`**: Summon Mighty Sky Dragon (Aerial flame raid).

---

## 💻 How to Compile the Native C++ Game (`game.cpp`)

The standalone native C++ version is self-contained in `game.cpp` using [Raylib](https://www.raylib.com/).

### Prerequisites:
Install Raylib for your operating system:
- **Ubuntu / Debian**:
  ```bash
  sudo apt-get install libraylib-dev libgl1-mesa-dev xorg-dev
  ```
- **macOS**:
  ```bash
  brew install raylib
  ```
- **Windows**:
  Install MinGW-w64 and Raylib or use MSYS2 (`pacman -S mingw-w64-x86_64-raylib`).

### Compilation Commands:
- **Linux:**
  ```bash
  g++ -O2 game.cpp -o game -lraylib -lGL -lm -lpthread -ldl -lrt -lX11
  ./game
  ```

- **macOS:**
  ```bash
  clang++ -O2 game.cpp -o game -L/opt/homebrew/lib -I/opt/homebrew/include -lraylib -framework OpenGL -framework Cocoa -framework IOKit -framework CoreVideo
  ./game
  ```

- **Windows (MinGW):**
  ```cmd
  g++ -O2 game.cpp -o game.exe -lraylib -lopengl32 -lgdi32 -lwinmm
  game.exe
  ```

---

## 📂 Key Files Overview
- **`game.cpp`**: Standalone single-file C++ Raylib implementation (all 20 levels, cavalry animations, sky dragon, cartoon boss enemies on land).
- **`index.html`**: HTML web entry point for browser play.
- **`README.md`**: Guide, compile commands, and gameplay controls.
- **`public/assets/sprites/`**: Sprites and textures used by both the C++ and browser versions.
