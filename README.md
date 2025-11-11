[README.md](https://github.com/user-attachments/files/23477236/README.md)
# Live Poker Tracker

A free, open-source Progressive Web App (PWA) for managing Texas Hold'em poker games. Track chips, manage blinds, and play with friends using real-time multiplayer synchronization.

**Live at:** [livepokerchips.com](https://livepokerchips.com)

## Features

- **Single-Player Mode** - Track your home game with up to 10 players
- **Multiplayer Sync** - Real-time peer-to-peer synchronization via PeerJS
- **Offline Support** - Works without an internet connection as a PWA
- **Blinds Management** - Automatic small/big blind posting
- **Chip Tracking** - Smooth animations and real-time stack updates
- **Texas Hold'em Rules** - Proper betting rounds, street progression, and dealer button rotation
- **Mobile-Friendly** - Responsive design for phones and tablets

## Quick Start

### Play Online

Visit [livepokerchips.com](https://livepokerchips.com) to start playing immediately. No installation required.

### Install as PWA

1. Visit the site in your mobile browser
2. Tap "Add to Home Screen" when prompted
3. Launch from your home screen like a native app

### Multiplayer Setup

1. **Host**: Click "Host Game" to create a room and get a 6-character code
2. **Players**: Click "Join Game" and enter the room code
3. All devices will stay synchronized automatically

## Tech Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Multiplayer**: [PeerJS](https://peerjs.com/) for WebRTC connections
- **Hosting**: GitHub Pages with custom domain
- **PWA**: Service Worker with offline caching
- **Analytics**: Google Analytics

## Development

### Local Testing

This is a static site with no build process. Use any local HTTP server:

```bash
# Python
python3 -m http.server 8000

# PHP
php -S localhost:8000

# Node.js
npx http-server -p 8000
```

Then visit `http://localhost:8000`

### Testing Multiplayer

1. Open two browser windows/tabs to the same localhost
2. One creates a room (host), the other joins with the code
3. Test state synchronization by making actions in both windows

### Deployment

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Pages automatically deploys changes to [livepokerchips.com](https://livepokerchips.com) within 1-2 minutes.

### Cache Updates

When modifying cached files, increment the cache version in `sw.js`:

```javascript
const CACHE_NAME = 'poker-tracker-v5';  // Increment version number
```

## Project Structure

```
.
├── index.html          # Single-player game tracker
├── multiplayer.html    # Multiplayer game room
├── connect.html        # Multiplayer lobby
├── about.html          # Features and FAQ
├── guide.html          # Texas Hold'em tutorial
├── blog.html           # Strategy articles
├── styles.css          # Shared styles
├── sw.js               # Service Worker
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap
├── CNAME               # Custom domain config
└── CLAUDE.md           # Development documentation
```

## Game Logic

### State Management

Each game maintains state for:
- Players (name, stack, bet, fold status, cards)
- Pot and current bet amounts
- Dealer button position
- Community cards (flop, turn, river)
- Current street (preflop → flop → turn → river → showdown)

### Betting Rounds

- Proper Texas Hold'em betting action tracking
- Minimum raise enforcement
- All-in handling with side pots (multiplayer mode)
- Automatic blind posting (configurable)

### Multiplayer Sync

- Host creates room with ID `poker-{roomCode}`
- Clients connect using 6-character room code
- State changes broadcast with 50ms debounce
- STUN servers for NAT traversal

## Browser Support

- Modern browsers with ES6+ JavaScript support
- CSS custom properties required
- Service Worker requires HTTPS (or localhost)
- No Internet Explorer support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Made with ❤️ for poker enthusiasts
