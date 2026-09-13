# Agents.md – Guide to Building Texas‑Themed Online Casino Games  

*Designed for VS Code development workflow.*

---

## 1. Overview  

This guide walks you through creating a **client‑side** casino game that:

* Looks like the popular slot/roulette/River Sweep games you see on NolimitCoins, Chumba, Juwa, etc.  
* Is **Texas‑themed** (e.g., cowboy hats, chili pepper icons, Lone Star background).  
* Uses only open‑source tools so it can be uploaded to any web host.

---

## 2. Prerequisites  

| Tool | Version (minimum) | How to install |
|------|-------------------|----------------|
| **Node.js** | v14+ | `nvm install` or download from <https://nodejs.org> |
| **npm** (comes with Node) | — | — |
| **Git** (optional, for repo tracking) | — | https://git-scm.com/downloads |
| **VS Code** | 1.68+ | https://code.visualstudio.com/ |

---

## 3. Project Structure  

casino-game/
│
├─ assets/                # All PNG/SVG icons, fonts, background textures
│   ├─ texas/             # Custom graphics (cowboy hats, chili peppers, etc.)
│   └─ bg/
│        └─ lone_star.png
│
├─ src/
│   ├─ game.js            # Main entry point – creates the game loop
│   ├─ slot.js            # Slot‑machine logic (reels, paylines)
│   ├─ roulette.js        # Texas Roulette wheel & bets
│   ├─ river_sweep.js     | River Sweep mechanics
│   └─ ui.js              | UI components + state handling
│
├─ public/                # Served assets at /public
│   ├─ index.html         # Landing page (placeholder)
│   └─ style.css          # Global styling, responsive breakpoints
│
├─ package.json           | npm dependencies & scripts
└─ README.md

Copy

---

## 4. Setting Up the Project  

1. **Create folder**  
   ```bash
   mkdir casino-game && cd casino-game
Initialize npm

Copy
bash
npm init -y
Install core libraries (all open source):

Copy
bash
npm install lodash moment three  # Three.js for canvas, LODASH for helpers
Add a simple script in package.json

Copy
json
{
  "scripts": {
    "start": "http-server -c-1 -p 8080",
    "dev": "npm run start & npm-run-all --parallel browser-sync,eslint"
  }
},
Create a minimal HTML – public/index.html

Copy
html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Texas Casino Game</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/game.js"></script>
</body>
</html>
Open the folder in VS Code – you’ll see live reload when npm run dev runs.

5. Core Game Mechanics (per section)
5.1 Slot Machine (src/slot.js)
Copy
js
// src/slot.js
import * as THREE from 'three';

export function initSlot() {
  // Canvas element will be injected by game.js
  const canvas = document.getElementById('game-container');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor('#1a1a1a'); // dark Texas night

  const slot = {
    reels: [
      {width:8,height:6},
      {width:8,height:6},
      {width:8,height:2}
    ],
    symbols: [],               // [{x,y,texture}]
    paylines: [ /* array of strings (e.g. "1-2-3") */],
    spin: false,
    startSpin() {
      this.stopAllAnim();
      setTimeout(() => this.startSpin(), 50); // stagger reels
    },
    stopAllAnim() { /* reset animation timers */ }
  };
  return slot;
}
5.2 Texas Roulette (src/roulette.js)
Copy
js
// src/roulette.js
export function initRoulette() {
  const canvas = document.getElementById('game-container');
  // Draw wheel as a circle + inner numbers using Three.js
  // Bets are handled via UI (ui.js)
}
5.3 River Sweep (src/river_sweep.js)
Copy
js
// src/river_sweep.js
export function initRiverSweep() {
  const game = new Game();
  game.startRiver(); // opens a mini‑stream of cards/symbols
}
5.4 UI & State (src/ui.js)
Copy
js
// src/ui.js – very lightweight, just for demo
export class GameUI {
  static init() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'ui-overlay';
    document.body.appendChild(overlay);
  }
}
6. Putting It All Together – src/game.js
Copy
js
// src/game.js
import { initSlot } from './slot.js';
import { initRoulette } from './roulette.js';
import { initRiverSweep } from './river_sweep.js';
import { GameUI } from './ui.js';

const slot = initSlot();
GameUI.init();

function start() {
  // Slot runs continuously in background
  slot.startSpin();

  // Optional: rotate wheel after 10s
  setTimeout(() => initRoulette(), 10_000);
}

// Launch when module is ready
if (import.meta.url === 'file:///path/to/casino-game/src/game.js') {
  start();
}
7. Styling (public/style.css)
Copy
css
body,html {margin:0; padding:0; overflow:hidden; background:#111;}
#game-container {position:absolute;top:0;left:0;width:100%;height:100%;}
.ui-overlay {
  position:fixed; inset:0;
  background:rgba(255,255,255,.4);
  display:flex;
  align-items:center; justify-content:center;
  font-family:sans-serif;
  color:#333;
}
8. Running Locally
Copy
bash
npm run dev      # Starts http-server + (optional) browser‑sync
# Open <http://localhost:8080> in a browser
You should see the dark canvas with a spinning slot machine.

9. Adding Texas Theme Assets
Place any PNG/SVG in assets/texas/ – e.g., cowboy_hat.png.
Reference them from style.css or inject via JS:
Copy
css
#game-container::before{
  content:"";
  position:absolute; top:-50%; left:50%;
  transform:translate(-50%,-50%);
  width:120px;height:120px;
  background:url('assets/texas/cowboy_hat.png') no-repeat center/contain;
}
Update icons inside slot.js or roulette.js using the same URL pattern.
10. Testing & Debugging
Console – Check console.log statements in any module.
Three.js Debugger – Install three-addons-loader (optional) for visual debugging.
Responsive – Use viewport meta tag; adjust slot reels via CSS media queries.
11. Deploying to a Web Host
Commit the repo (git commit -am "initial").
Push to GitHub / GitLab (private or public).
In your hosting panel, set File type = web and root folder = casino-game.
The http-server script will serve everything automatically.
12. Next Steps & Enhancements
Idea	Why it matters
Sound effects – add Web Audio API for spins, wins	Adds immersion (like real casino sites)
Responsive UI – mobile‑friendly reels layout	Users play on phones/tablets
Data integration – expose a REST endpoint (/win) to send payouts via API	Allows backend to calculate credits
Analytics – use gtag.js or Plausible for usage stats	Helps measure player engagement
13. Quick Reference Cheat‑Sheet
Copy
bash
# Development
npm run dev            # live reload + hot module replacement

# Production build (optional)
npm install --save-dev rollup
npx rollup -c           # output static files to /public/build/