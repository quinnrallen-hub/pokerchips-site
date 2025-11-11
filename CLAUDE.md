# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Live Poker Tracker** is a free, open-source Progressive Web App (PWA) for managing Texas Hold'em poker games. It's a static website hosted on GitHub Pages with the custom domain `livepokerchips.com`. The application provides chip tracking, blinds management, and real-time multiplayer synchronization using peer-to-peer connections.

### Documentation Files

- **README.md** - User-facing project documentation for GitHub repository
  - Quick start guide for players
  - Development setup instructions
  - Deployment guidelines
  - Feature overview and tech stack
- **CLAUDE.md** - Developer guidance for AI assistance (this file)
  - Detailed architecture and implementation notes
  - Code conventions and patterns
  - Common modification workflows

### Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks or build tools)
- **Multiplayer**: PeerJS library (CDN: unpkg.com)
- **Hosting**: GitHub Pages with custom CNAME
- **PWA**: Service Worker (sw.js) with offline caching
- **Analytics**: Google Analytics + Google AdSense integration

## Architecture

### Page Structure

The site consists of 6 main HTML pages, each self-contained with inline JavaScript and CSS:

1. **index.html** - Single-player poker game tracker (core application)
2. **multiplayer.html** - Multiplayer poker room with PeerJS sync
3. **connect.html** - Multiplayer lobby (room creation/joining)
4. **about.html** - Feature descriptions, FAQ, affiliate product links
5. **guide.html** - Texas Hold'em rules and tutorial
6. **blog.html** - Poker strategy articles

### State Management

**Single-player (index.html):**
```javascript
state = {
  players: [],           // Array of {name, stack, bet, folded, cards}
  pot: 0,
  currentBet: 0,
  currentPlayerIndex: 0,
  roundActive: false,
  deck: [],             // Shuffled card deck
  communityCards: [],   // Flop, turn, river
  street: 'preflop',    // preflop|flop|turn|river|showdown
  roundCount: 0,
  buttonPosition: 0,    // Dealer button index
  lastAggressor: -1,
  minRaise: 0
}
```

**Multiplayer (multiplayer.html):**
- Extends single-player state with `sidePots: []` for all-in scenarios
- Uses PeerJS for state synchronization between connected devices
- Host creates room with ID `poker-{roomCode}`, clients connect via 6-char code
- `syncState()` broadcasts state changes with 50ms debounce (CONFIG.SYNC_DEBOUNCE)

### Game Logic Flow

**Texas Hold'em Implementation:**
1. **Blinds Posting**: Small blind (BTN+1) and big blind (BTN+2) auto-post when enabled
   - Heads-up exception: Button posts SB, other posts BB
2. **Betting Rounds**: Action tracked via `actionCount` counter
   - Round completes when all active players have equal bets and have acted
3. **Street Progression**: Auto-advances through preflop → flop → turn → river → showdown
   - Burns one card before dealing community cards (Texas Hold'em rule)
4. **Winner Determination**: Manual via "Empty Pot" modal, assigns chips to selected player

### Key Functions (Shared Pattern)

Both `index.html` and `multiplayer.html` implement identical game logic:

- `addPlayer()` - Validates name/stack, adds to state.players (max 10)
- `startRound()` - Posts blinds, shuffles deck, resets round state
- `bet/raise/call/check/fold()` - Player actions with validation
- `nextPlayer()` - Advances to next non-folded player, checks round completion
- `advanceRound()` - Moves to next street (burns card, deals community cards)
- `moveButton()` - Rotates dealer button clockwise
- `resetTable()` - Clears pot, bets, community cards (preserves player stacks)
- `render()` - Updates DOM with animations (chip counts, cards, player states)

**Critical Implementation Details:**
- `isBettingRoundComplete()` checks if all active players have equal bets AND actionCount >= active players
- Minimum raise enforcement: stores previous bet size in `state.minRaise`
- Animation system: Uses `animateNumber()` with threshold (100 chips) for smooth transitions
- Card animations: CSS classes `.new-card` with staggered delays

## Development Commands

### Testing Changes Locally

Since this is a static site with no build process:

```bash
# Option 1: Python HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000

# Option 2: PHP built-in server
php -S localhost:8000

# Option 3: Node.js http-server (if installed)
npx http-server -p 8000
```

**Testing Multiplayer:**
- Open two browser windows/tabs to same localhost
- One acts as host, other joins with room code
- Use browser DevTools Network tab → "Offline" to test PWA offline mode

### Deployment

```bash
# Commit and push to GitHub (auto-deploys to GitHub Pages)
git add .
git commit -m "Description of changes"
git push origin main

# Site updates at https://livepokerchips.com within 1-2 minutes
```

### Service Worker Cache Updates

When modifying cached files, increment the cache version:

```javascript
// sw.js - Change version to bust cache
const CACHE_NAME = 'poker-tracker-v6';  // Current: v5, increment when changing cached files
```

**Version History:**
- v1-v3: Initial implementations
- v4: Added error handling improvements
- v5: Added AdSense ad placements (current)

Cached files list in `sw.js`:
- All HTML pages (/, /index.html, /connect.html, /multiplayer.html, /guide.html, /blog.html, /about.html)
- /styles.css, /favicon.svg, /icon-192.png, /icon-512.png, /apple-touch-icon.png

## Code Conventions

### Inline JavaScript Pattern

All game logic is embedded in `<script>` tags at the bottom of each HTML file. This deliberate choice:
- Eliminates build step complexity
- Ensures single-file portability
- Simplifies GitHub Pages deployment

### CSS Architecture

- **styles.css**: Shared styles for all pages (game table, cards, buttons, animations)
- **Inline `<style>`**: Page-specific layouts (blog-container, guide-container, connect-box)
- **CSS Variables**: Theming via `:root` custom properties (--primary, --bg-dark, --text-muted, etc.)

### JavaScript Patterns

**Configuration Constants:**
```javascript
const CONFIG = {
  DEFAULT_STACK: 1000,
  DEFAULT_SB: 5,
  DEFAULT_BB: 10,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MAX_NAME_LENGTH: 20,
  ANIMATION_THRESHOLD: 100,
  ANIMATION_DURATION: 300,
  CARD_ANIMATION_CLEANUP_DELAY: 500
};
```

**Error Handling:**
- All critical functions wrapped in try-catch
- Null checks before DOM manipulation (`if(!el)return;`)
- User-facing alerts for validation errors
- Console logging for debugging (`console.error()`)

**Element Access:**
```javascript
const $=(id)=>document.getElementById(id);  // Shorthand helper
const els = {  // Cached element references
  playerName: $('playerName'),
  pot: $('pot'),
  // ... etc
};
```

## Multiplayer Architecture

### PeerJS Connection Flow

**Host (connect.html → multiplayer.html):**
1. Generates 6-character room code (uppercase alphanumeric)
2. Creates peer with ID `poker-{roomCode}`
3. Stores role/code/name in `sessionStorage`
4. Listens for incoming connections
5. Broadcasts state changes via `broadcastState()`

**Client (connect.html → multiplayer.html):**
1. Prompts for name and room code
2. Creates anonymous peer
3. Connects to `poker-{roomCode}`
4. Sends `{type:'join', playerName}` on connection
5. Receives state updates from host

**State Sync:**
- Host → Clients: `{type:'state', state}` on every game action
- Client → Host: `{type:'state', state}` for their actions
- Host rebroadcasts client state to all other clients

### STUN Servers
```javascript
config: {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
}
```

## SEO & Analytics

### Meta Tags Pattern

Every page includes:
- Open Graph tags (og:title, og:description, og:url)
- Twitter Card tags
- Structured data (JSON-LD) for WebApplication schema (index.html only)
- Canonical URLs pointing to livepokerchips.com

### Google Services

**Analytics (gtag.js):**
- ID: G-0J9PC4FRSB
- Preconnect hints for performance

**AdSense:**
- Account: ca-pub-6367769242716376
- Async script loading with crossorigin="anonymous"
- **10 strategic ad placements** across content pages:
  - **about.html**: 3 ads (top of content, mid-page, before FAQ)
  - **blog.html**: 4 ads (before first article, between each article)
  - **guide.html**: 3 ads (after TOC, mid-guide, after actions section)
- Responsive auto format with `data-full-width-responsive="true"`
- Max-width: 728px for optimal desktop/mobile display
- Placements follow natural content breaks for better CTR

**Ad Placement Strategy:**
```html
<div style="text-align:center; margin:40px auto; max-width:728px;">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-6367769242716376"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>
       (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
```

### Affiliate Links

Amazon Associates tag: `quinnstech-20`
- Used in about.html product recommendations (poker chips, cards, tables, books)
- Links include `rel="nofollow noopener"`
- Commission rate: 4-10% per sale

## Common Modifications

### Adding AdSense Ad Units

**Best Locations for New Ads:**
1. Between content sections (natural reading breaks)
2. After user commits (e.g., after table of contents)
3. Mid-page on long articles (50% scroll depth)
4. Before high-value content (FAQ, tutorials)

**Ad Placement Guidelines:**
- Max 3-4 ads per page for optimal CTR
- Use 40px margin for breathing room
- Avoid placing ads directly after headers
- Test placement after 2 weeks and optimize

**Current Ad Inventory:**
- about.html: 3 placements (room for 1 more after "How to Use" section)
- blog.html: 4 placements (optimal, don't add more)
- guide.html: 3 placements (could add 1 after "Tournament vs Cash Game")
- index.html: NO ADS (game experience should be ad-free)
- connect.html: NO ADS (UX priority)
- multiplayer.html: NO ADS (UX priority)

### Adding a New Page

1. Create `newpage.html` with standard header structure (copy from blog.html)
2. Include AdSense script in `<head>` section
3. Add 2-3 strategic ad placements if content-heavy
4. Add to `sw.js` urlsToCache array
5. Update `sitemap.xml` with new URL
6. Increment service worker cache version
7. Add navigation links in other pages
8. Update README.md if the page significantly changes functionality

### Project File Structure

The repository includes the following key files:

**HTML Pages:**
- `index.html` - Single-player game tracker
- `multiplayer.html` - Multiplayer game room
- `connect.html` - Multiplayer lobby
- `about.html` - Features and FAQ
- `guide.html` - Texas Hold'em tutorial
- `blog.html` - Strategy articles

**Assets & Configuration:**
- `styles.css` - Shared stylesheet
- `sw.js` - Service Worker for PWA
- `manifest.json` - PWA manifest
- `favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` - Icons
- `sitemap.xml` - SEO sitemap
- `CNAME` - Custom domain configuration

**Documentation:**
- `README.md` - Public project documentation (user-facing)
- `CLAUDE.md` - AI development guidance (this file)
- `.gitignore` - Git ignore rules (currently ignores `*.md` - use `git add -f` for markdown files)

### Modifying Game Rules

**Blind Structure:**
- Edit `startRound()` function in index.html:629 and multiplayer.html:418
- Heads-up logic: lines 391-401 (index.html)

**Betting Rules:**
- Minimum raise validation: `raise()` function, checks `state.minRaise`
- All-in handling: `call()` uses `Math.min(toCall, p.stack)`

**Card Dealing:**
- Burn card logic: `autoAdvanceStreet()`, line 336
- Community card counts: `cardsToAdd` object (flop:3, turn:1, river:1)

### Styling Changes

**Theme Colors:**
```css
:root {
  --primary: #ffd166;        /* Yellow accent */
  --bg-dark: #0a0e17;        /* Dark background */
  --bg-card: rgba(20, 32, 42, 0.6);
  --text: #e6eef8;
  --text-muted: #9fb0c5;
}
```

**Animation Customization:**
- Card slide-in: `.new-card` animation at styles.css:477
- Chip pulse: `.chip-update` animation at styles.css:537
- Active player glow: `.player.active` at styles.css:218

## Revenue Optimization

### Current Monetization Stack

1. **Google AdSense** (Primary)
   - 10 ad units across 3 pages
   - Expected RPM: $3-8 (with traffic)
   - Pages with ads: about.html, blog.html, guide.html
   - Pages without ads: index.html, connect.html, multiplayer.html (UX priority)

2. **Amazon Affiliate** (Secondary)
   - Tag: quinnstech-20
   - 6 product links in about.html
   - Commission: 4-10% per sale
   - Products: Poker chips, cards, shufflers, tables, dealer buttons, books

3. **Buy Me a Coffee** (Donations)
   - Links on all content pages
   - Username: quinn_dose_tech

### Traffic to Revenue Estimates

| Daily Visitors | Monthly Earnings (AdSense) | + Amazon Affiliate | Total Est. |
|----------------|---------------------------|-------------------|------------|
| 100-500 | $10-120 | $5-30 | $15-150 |
| 500-1,000 | $45-240 | $20-80 | $65-320 |
| 1,000-5,000 | $90-1,200 | $50-200 | $140-1,400 |
| 5,000-10,000 | $450-2,400 | $100-500 | $550-2,900 |

**To increase revenue:**
1. Drive more traffic (SEO, social media, poker forums)
2. Create more content pages (more ad inventory)
3. Add more Amazon affiliate products
4. Monitor AdSense analytics and optimize low-performing ads
5. Consider adding poker strategy ebooks/courses later

## Important Notes

### Browser Compatibility
- Requires modern JavaScript (ES6+)
- Uses CSS custom properties (no IE11 support)
- Service Worker requires HTTPS (works on localhost and GitHub Pages)

### Session Storage Usage
Multiplayer pages use `sessionStorage` for room info:
- `pokerRole`: 'host' or 'client'
- `pokerRoomCode`: 6-character room ID
- `pokerPlayerName`: User's display name

### Known Limitations
- No hand evaluation (winner determined manually)
- No betting history/log
- No player elimination tracking
- Multiplayer requires manual resync if disconnected
- Service Worker doesn't cache external resources (Google Analytics, PeerJS CDN, AdSense)
- AdSense ads may show "Test Ads" until Google reviews site (1-3 days for new placements)

## Recent Updates

### November 2025 - AdSense Optimization
- Added 10 strategic ad placements across content pages
- Optimized for CTR with responsive auto format
- Service Worker updated to v5
- Expected revenue increase: 3-5x vs auto-ads only

### November 2025 - Bug Fixes & Performance
- Enhanced error handling in JavaScript (try-catch blocks, null checks)
- Improved Service Worker error logging
- Added focus-visible states for accessibility
- Fixed PWA manifest background color
- Added resource hints (preconnect, dns-prefetch) for faster loading
