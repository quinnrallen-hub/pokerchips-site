# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Live Poker Tracker - A web-based poker chip and game state tracking application with single-device and multiplayer modes.

**Live URL:** https://livepokerchips.com (hosted on GitHub Pages)

## Architecture

### Three-Page System

1. **index.html** - Single-device mode (standalone, no networking)
2. **connect.html** - Multiplayer lobby (connection setup only)
3. **multiplayer.html** - Multiplayer game (full game with P2P sync)

### Critical Flow: Multiplayer Connection

The multiplayer architecture requires **peer connections to be created in multiplayer.html**, not in connect.html:

1. User visits `connect.html` and clicks "Host" or enters room code to "Join"
2. `connect.html` stores three values in sessionStorage:
   - `pokerRole`: 'host' or 'client'
   - `pokerRoomCode`: 6-character alphanumeric code (e.g., "ABC123")
   - `pokerPlayerName`: player's display name
3. `connect.html` immediately redirects to `multiplayer.html`
4. `multiplayer.html` reads sessionStorage and calls `initHost()` or `joinGame()` to create peer connections
5. If sessionStorage is missing, `multiplayer.html` redirects back to `connect.html`

**Critical:** Peer connections MUST be created in multiplayer.html because page redirects destroy peer objects. Do not create Peer instances in connect.html.

### PeerJS Integration

- Library: PeerJS 1.5.2 via `<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>`
- **Do NOT use `defer` attribute** on the PeerJS script tag (causes "Peer is not defined" errors)
- Server: Uses PeerJS default cloud server (DO NOT manually configure `0.peerjs.com` - it's unreliable)
- Room IDs: Prefixed with `'poker-'` (e.g., `'poker-ABC123'`)
- Connection options: `{reliable: true}` for data channels
- Debug mode: `debug: 2` is enabled for console logging
- **Important:** Use `new Peer('id', {debug: 2})` instead of manually specifying host/port/path

### State Synchronization

The `state` object is shared across all connected peers:

```javascript
state = {
    players: [],           // Array of {name, stack, bet, folded, cards}
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    roundActive: false,
    deck: [],
    communityCards: [],
    street: 'preflop',    // 'preflop', 'flop', 'turn', 'river', 'showdown'
    roundCount: 0,
    buttonPosition: 0
}
```

**Sync Flow:**
- Host receives `{type: 'join', playerName}` → adds player to state → broadcasts state to all clients
- Client modifies state locally → sends `{type: 'state', state}` to host → host broadcasts to all
- All state changes trigger `render()` to update DOM

**Debouncing:** State syncs use 50ms debounce via `syncTimeout` to reduce network traffic.

## Code Style & Patterns

- Self-contained HTML files with inline `<style>` and `<script>` (no external dependencies except PeerJS)
- Minified/compact CSS with CSS variables for theming
- Arrow functions and ES6+ syntax throughout
- `'use strict';` mode
- DOM element caching via `els` object: `const els = {pot: $('pot'), ...}`
- Helper: `const $ = (id) => document.getElementById(id)`

## Key Features

### Blinds System
- Auto-post blinds: Controlled by checkbox `#enableBlinds` (checked by default)
- Small blind/big blind amounts configurable via inputs
- Button position tracking with visual labels: (BTN), (SB), (BB)
- Manual button movement via "Move Button" control

### Digital Cards
- Checkbox `#showDigitalCards` toggles community cards display
- Cards rendered as styled `<div>` elements with rank and suit
- Red suits (♥ ♦) vs black suits (♠ ♣)

### Empty Pot Modal
- Award pot to specific player without running full hand
- Modal with player dropdown and pot amount display

## Common Issues & Solutions

### "Peer is not defined" Error
- Cause: `defer` attribute on PeerJS script tag
- Fix: Remove `defer`, load PeerJS synchronously in `<head>`

### "Room not found" / Connection Hangs
- Ensure host peer is fully created before client attempts to connect
- Check console for PeerJS debug messages (debug level 2 is enabled)
- Host timeout: 10 seconds
- Client timeout: 15 seconds with 2-second delay before connection attempt

### "Failed to connect to PeerJS server" Error
- Cause: Manually configured PeerJS server (`0.peerjs.com`) is down or unreliable
- Fix: Use default PeerJS cloud server by removing manual host/port/path config
- Use `new Peer('id', {debug: 2})` instead of specifying server details

### State Not Syncing Between Devices
- Verify data listener is set up BEFORE sending join message in client
- Ensure host broadcasts state after adding new player
- Check `broadcastState()` is called after state modifications

## Deployment

GitHub Pages automatically deploys from `main` branch:
- Custom domain: livepokerchips.com (configured in CNAME file)
- HTTPS enforced
- Changes pushed to main branch deploy automatically
- Typical deployment time: 1-2 minutes

## Content & SEO Structure

### Content Pages (Non-Application)
- **about.html** - Features, FAQs, technical details (3000+ words)
- **guide.html** - Complete Texas Hold'em rules tutorial (3000+ words)
- **blog.html** - Poker strategy articles (2000+ words)

### SEO Files
- **sitemap.xml** - All 6 pages indexed (ISO 8601 date format required)
- **robots.txt** - Allows all crawlers, points to sitemap
- **manifest.json** - PWA configuration for mobile install
- **sw.js** - Service worker for offline caching

### Important SEO Considerations
- All pages have unique meta descriptions and titles
- JSON-LD structured data on homepage only
- Canonical URLs prevent duplicate content issues
- Keep content pages updated monthly for SEO freshness

## File Loading Order

PeerJS must load before inline scripts execute. Current structure:
```html
<head>
    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
    <!-- NO defer attribute -->
</head>
<body>
    <!-- HTML content -->
    <script>
        // Peer is now defined and ready to use
    </script>
</body>
```

## Development Workflow

### Making Changes
1. Edit HTML/CSS directly (no build step required)
2. Test locally by opening HTML files in browser
3. For multiplayer testing, must use actual domain (WebRTC requires HTTPS)
4. Push to `main` branch to deploy

### Testing Multiplayer Locally
WebRTC P2P connections require HTTPS. Options:
- Use GitHub Pages deployment for testing
- Or use `ngrok` to tunnel localhost over HTTPS
- Cannot test P2P connections on `file://` protocol

### Updating Service Worker
When changing cached files, increment `CACHE_NAME` in `sw.js`:
```javascript
const CACHE_NAME = 'poker-tracker-v2'; // Increment version
```

## Reference Documents

- **SEO_OPTIMIZATION_REPORT.md** - Complete SEO strategy and implementation
- **PROMOTION_GUIDE.md** - Marketing templates and launch strategy
- **DAILY_CHECKLIST.md** - Day-by-day tracking for SEO progress
