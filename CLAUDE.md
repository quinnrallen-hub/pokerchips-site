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
- Server: `0.peerjs.com` (explicitly configured with host/port/path)
- Room IDs: Prefixed with `'poker-'` (e.g., `'poker-ABC123'`)
- Connection options: `{reliable: true}` for data channels
- Debug mode: `debug: 2` is enabled for console logging

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

### State Not Syncing Between Devices
- Verify data listener is set up BEFORE sending join message in client
- Ensure host broadcasts state after adding new player
- Check `broadcastState()` is called after state modifications

## Deployment

GitHub Pages automatically deploys from `main` branch:
- Custom domain: livepokerchips.com (configured in CNAME file)
- HTTPS enforced
- Changes pushed to main branch deploy automatically

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
