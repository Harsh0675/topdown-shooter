# 🎮 Top Down Shooter

A lightweight browser shooter designed around **touch-first controls**. Move the ship by touching anywhere on the game canvas and keep holding to auto-fire.

> **Best on mobile:** the game uses the browser Pointer Events API, so touch and mouse input work through the same control path.

## ✨ Features

| Feature | Details |
|---|---|
| 🕹️ Touch movement | Point anywhere on the canvas to steer the ship |
| 🔫 Auto-fire | Holding a pointer continuously fires upward |
| 👾 Enemy waves | Enemies spawn from the top and move toward the player |
| 📈 Progressive difficulty | Enemy speed and spawn pressure increase with score |
| 🏆 High score | Best score is persisted with `localStorage` |
| ❤️ Lives | Missing enemies or player collisions cost a life |
| 💥 Collision system | Bullet/enemy and enemy/player hit detection |
| 🔊 Sound effects | Shooting, hits, and damage use Web Audio |
| 📱 Responsive canvas | The game scales to fit smaller screens |

## 🧩 How It Works

```text
Touch / Mouse Input
        ↓
Pointer Events → Target Position
        ↓
Animation Loop → Player Movement + Auto-Fire
        ↓
Enemy Spawning → Movement → Collision Checks
        ↓
Score / Lives / High Score
        ↓
Canvas Rendering + Web Audio
```

The game uses a fixed **240 × 360 logical canvas** and scales it visually with CSS. This keeps movement and collision calculations predictable across different screen sizes.

## 🛠️ Tech Stack

- **HTML5** — game shell and HUD
- **CSS3** — responsive layout and visual presentation
- **JavaScript (ES6+)** — game loop, input, physics and state
- **Canvas 2D API** — real-time rendering
- **Pointer Events API** — touch/mouse controls
- **Web Audio API** — lightweight procedural sound effects
- **Web Storage API** — persistent high score

No framework or build step is required.

## ▶️ Run Locally

Clone the repository and open `index.html` in a modern browser. For the most reliable browser behavior, serve the folder with any simple static HTTP server.

Example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## 🎯 Controls

- **Touch / press:** move toward the selected point and fire
- **Move while holding:** continuously update the target
- **Release:** stop movement targeting and firing
- **Retry:** start a fresh run after game over

## 📁 Project Structure

```text
.
├── index.html   # Game shell, HUD and start overlay
├── style.css    # Responsive game layout
├── game.js      # Game state, loop, input, collisions and audio
└── README.md
```

## 🔧 Implementation Highlights

- Uses `requestAnimationFrame` with a capped delta time for stable gameplay.
- Converts pointer coordinates from the responsive CSS canvas back into logical game coordinates.
- Uses squared-distance collision checks to avoid unnecessary square roots.
- Gradually increases enemy pressure instead of keeping the game difficulty static.
- Saves the best score locally without requiring an account or backend.
- Generates simple sounds procedurally, keeping the project dependency-free.

## 🔒 Privacy

The game has no backend and does not require an account. The only persisted application data is the local high score stored in the browser's `localStorage`.

## 🚀 Deployment

Because this is a static HTML/CSS/JavaScript project, it can be hosted on GitHub Pages or any static web host without a build pipeline.

## 📄 License

This project is available under the **MIT License**.

## 👤 Author

**Harsh** · GitHub: `@Harsh0675`
