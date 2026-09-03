# ⚡ NEON STRIKE

A mobile-first **top-down arcade shooter** rebuilt with vanilla JavaScript, Canvas 2D and Web Audio. Drag to pilot your ship, hold to auto-fire, dash through danger, survive escalating enemy waves and defeat the Overlord boss.

## 🎮 Game Features

| System | Included |
|---|---|
| 🕹️ Touch-first controls | Pointer Events with mouse + mobile touch support |
| 🔫 Auto-fire | Hold/drag anywhere on the battlefield |
| ⚡ Dash | Swipe a long distance to dash with a cooldown |
| 👾 Enemy variety | Drone, swarm, tank, shooter and chaser behaviors |
| 📈 Wave progression | Enemy pressure scales as waves increase |
| 👑 Boss battles | Overlord appears on milestone waves with a dedicated HP bar |
| 🛡️ Combat stats | HP, rechargeable shield, damage and fire-rate upgrades |
| 🔥 Combo system | Consecutive kills build a multiplier up to x12 |
| ✨ Game juice | Particles, glow, hit effects, screen shake and procedural audio |
| 🚀 Ship loadout | Interceptor, Blaster and Phantom handling profiles |
| 🧬 Upgrades | Fire rate, damage, armor, shield, multi-shot and speed |
| 🏆 Persistence | Best score and sound preference stored locally |
| 📱 Responsive UI | Arcade HUD and menus scale for mobile screens |

## 🧩 Game Loop

```text
MAIN MENU
   ↓
SHIP LOADOUT
   ↓
MISSION
   ├─ Move + Auto-fire
   ├─ Enemy AI + Projectiles
   ├─ Combos + Particles
   └─ Dash + Shield
   ↓
WAVE CLEAR
   ↓
CHOOSE UPGRADE
   ↓
NEXT WAVE → BOSS → REPEAT
   ↓
GAME OVER → REDEPLOY
```

## 🧱 Architecture

The project deliberately stays dependency-free so the gameplay engine is easy to inspect and deploy:

```text
index.html
   │
   ├── HUD / menus / upgrade UI
   │
style.css
   │
   └── responsive neon arcade presentation
   │
game.js
   ├── game state + progression
   ├── pointer input + dash
   ├── player / bullets / enemies / boss
   ├── collisions + damage
   ├── particles + screen shake
   ├── Canvas renderer
   ├── Web Audio effects
   └── localStorage persistence
```

## 🛠️ Technology

- **HTML5** — semantic game shell and UI
- **CSS3** — responsive arcade interface, glass panels and HUD
- **JavaScript ES6+** — game engine, AI, progression and state
- **Canvas 2D API** — real-time rendering
- **Pointer Events API** — unified touch/mouse controls
- **Web Audio API** — procedural sound effects
- **Web Storage API** — best score and preferences

No framework, bundler or external asset dependency is required.

## 🎯 Controls

### Mobile
- **Drag / hold:** move the ship and continuously fire
- **Swipe:** dash in the swipe direction when ready
- Release to stop firing

### Desktop
- Mouse press/drag provides the same control path.

The game converts pointer coordinates from the responsive CSS canvas into the fixed **480 × 800 logical playfield**, keeping gameplay consistent across screen sizes.

## 👾 Enemy Design

Different enemies create different threats:

- **Drone** — basic forward attacker
- **Swarm** — small and fast
- **Tank** — slower, high-health target
- **Shooter** — launches aimed projectiles
- **Chaser** — steers toward the player
- **Overlord** — boss with high health, movement patterns and projectile attacks

Enemy selection expands as the wave number increases.

## 🧬 Upgrade System

After clearing a wave, three randomized upgrades are offered:

- **OVERDRIVE** — faster fire rate
- **PLASMA CORE** — more damage
- **NANO ARMOR** — restore health
- **VOID SHIELD** — increase shield capacity
- **MULTI SHOT** — additional projectiles
- **THRUSTERS** — faster movement

This creates a lightweight roguelite progression loop without requiring a server or account system.

## ▶️ Run Locally

Serve the repository with any static HTTP server:

```bash
python -m http.server 8080
```

Open `http://localhost:8080` in a modern browser.

## 📁 Project Structure

```text
.
├── index.html   # Game shell, HUD, menus and upgrade screen
├── style.css    # Responsive neon arcade UI
├── game.js      # Complete gameplay engine
└── README.md
```

## 🔒 Privacy

NEON STRIKE has no backend and requires no account. Best score and sound preference are stored only in the browser's `localStorage`. No gameplay data is sent to a server.

## 🚀 Deployment

The game is a static site and can be deployed directly to **GitHub Pages** or any static hosting provider. No build command is required.

## 📌 Portfolio Highlights

This project demonstrates more than a simple canvas animation: real-time game-loop timing, responsive coordinate mapping, enemy behavior, collision handling, procedural audio, persistent state, progression design, mobile interaction and a complete game UI are implemented without a game framework.

## 📄 License

MIT License.

## 👤 Author

**Harsh** · `@Harsh0675`
