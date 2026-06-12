# Live Poker Tracker

Free, no-account Texas Hold'em chip tracker and tournament manager. Works offline as a PWA.

**Live at [livepokerchips.com](https://livepokerchips.com)**

---

## Features

### Single-player game tracker
- Up to 10 players with named stacks
- Auto-posts small/big blinds with heads-up exception
- `toAct`-based betting round logic — checks, bets, raises, calls, folds all handled correctly with BB option
- Street progression: preflop → flop → turn → river → showdown
- Dealer button rotates automatically after each hand
- Side pot computation for all-in scenarios
- Rebuy and player elimination between hands
- Session persists across page refresh (localStorage)
- Hand history log

### Tournament mode
- Configurable level timer (default 20 min/level)
- Blinds auto-escalate 1.5× on level-up, rounded to the nearest 5
- Timer survives page refresh — adjusts for elapsed offline time

### Bet sizing presets
- Min, ½ pot, ⅔ pot, pot, all-in

### Multiplayer (P2P)
- Host creates a room, shares a 6-character code
- Guests connect via `connect.html`, game state syncs in real time over WebRTC (PeerJS)
- No server required — works peer-to-peer

### PWA
- Installable on mobile and desktop ("Add to Home Screen")
- Full offline support via Service Worker

---

## Quick start

Play immediately at [livepokerchips.com](https://livepokerchips.com) — no installation, no account.

**Multiplayer:**
1. One player opens [livepokerchips.com/connect.html](https://livepokerchips.com/connect.html) and clicks **Host New Game**
2. Share the 6-character room code
3. Other players join with the same code

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Plain HTML / CSS / JavaScript (no frameworks, no build step) |
| Multiplayer | [PeerJS 1.5](https://peerjs.com/) — WebRTC via STUN |
| Hosting | GitHub Pages + custom domain (`CNAME`) |
| PWA | Service Worker (`sw.js`), Web App Manifest |
| Analytics | Google Analytics (gtag.js) |

---

## Project structure

```
index.html          — single-player game tracker
multiplayer.html    — multiplayer game room (PeerJS)
connect.html        — multiplayer lobby (create / join room)
about.html          — features, FAQ, affiliate products
guide.html          — Texas Hold'em rules and tutorial
blog.html           — strategy articles
styles.css          — shared stylesheet
sw.js               — Service Worker (cache: poker-tracker-v6)
manifest.json       — PWA manifest
sitemap.xml         — SEO sitemap
robots.txt          — crawler rules
favicon.svg         — SVG icon
icon-192.png        — PWA icon 192×192
icon-512.png        — PWA icon 512×512
apple-touch-icon.png
CNAME               — custom domain
```

---

## Local development

No build process — just serve the directory:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

**Testing multiplayer locally:** open two tabs, one hosts, one joins with the room code.

### Deploying

```bash
git add -f README.md   # .gitignore excludes *.md — force-add
git add <other files>
git commit -m "description"
git push origin main
```

GitHub Pages deploys to [livepokerchips.com](https://livepokerchips.com) within ~2 minutes.

### Updating the Service Worker cache

Increment `CACHE_NAME` in `sw.js` any time you change a cached file so returning visitors pick up the update:

```js
const CACHE_NAME = 'poker-tracker-v7'; // was v6
```

---

## Architecture notes

### Betting round model

Both `index.html` and `multiplayer.html` use a `toAct` collection (Set in single-player, Array in multiplayer for JSON-safe PeerJS sync). Every bet/raise rebuilds `toAct` excluding the aggressor so all other active, non-all-in players must respond. The round advances only when `toAct` is empty.

### Side pots

`computePots()` uses a level-slicing algorithm: for each unique all-in contribution level, it sums `min(handContrib, level) − min(handContrib, covered)` across all players. This correctly handles partial folded contributions and multiple all-ins at different stack sizes.

### State persistence

`serializeState()` converts `Set → Array` for JSON. On restore, `loadSavedState()` re-hydrates to `new Set()`. The tournament timer records `savedAt` on every save and subtracts elapsed time on restore.

### Multiplayer sync

- Host creates peer ID `poker-{roomCode}`; clients connect with the 6-char code
- All state changes broadcast via `syncState()` (50 ms debounce)
- `toAct` stored as Array throughout multiplayer to survive `JSON.stringify`

---

## Browser support

ES2020+, CSS custom properties. No IE. Service Worker requires HTTPS (GitHub Pages satisfies this; localhost also works).
