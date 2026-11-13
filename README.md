# Tiny Arcade

Free mini games that run entirely in the browser. No build step, no dependencies,
no accounts, no tracking. Plain HTML + CSS + JavaScript.

## Games (v2, 2026-11-13)

| Game | File | Controls |
|---|---|---|
| Fruit Slice | `games/fruit-slice.html` + `js/fruit-slice.js` | Swipe / drag to slice; avoid bombs |
| Snake | `games/snake.html` + `js/snake.js` | Arrows / WASD / D-pad / swipe |
| Brick Breaker | `games/breaker.html` + `js/breaker.js` | Mouse / touch / arrow keys, Space to launch |
| Memory Match | `games/memory.html` + `js/memory.js` | Tap / click cards |

Every game page has: start / pause / resume / game-over overlays, a
level-complete overlay (Brick Breaker), fullscreen on the game stage,
collapsible instructions, and a best score saved in the visitor's own browser
(`localStorage`). Pause with the Pause button, `P`, or `Esc`; games also pause
when the tab is hidden.

## More games (extra/, 2026-11-13)

Ten more games live in `extra/` as one single-page app (`extra/index.html` +
`extra/app.js` + `extra/style.css`): Stack Snap, Orbit Switch, Gravity Flip,
Memory Pulse, Perfect Pour, Gatekeeper, Maze Dash, Echo Hunt, Color Rule and
One-Second Hero. They are kept separate from the four games above so the
expansion can be maintained independently. The homepage links each game by
hash (`extra/#stack`, ...); the app opens the hashed game on load, clears the
hash when returning to its own home view, and records plays in the shared
recently-played list under `extra-<id>` slugs. Best scores use separate
`tinyArcadeExtra.best.*` keys. Homepage search, filters, favourites and
recently-played cover both grids (`#gameGrid` and `#moreGrid`).

## Site features

- `index.html`: hero, search + category filters (working), recently played,
  favourites, about section. Search and filters act on the real game cards —
  no invented games, no fake statistics.
- `js/arcade.js`: shared behaviour — theme toggle (dark/light, persisted),
  mobile nav, favourites, recently played, fullscreen, share links. All state
  stays in the visitor's browser.
- `styles.css`: the whole design system (dark-first + light theme,
  responsive, reduced-motion support, visible focus states).
- Game artwork is inline SVG drawn for this site. No external images.

## Pages

`index.html` (game grid), `about.html`, `privacy.html`, `terms.html`,
`contact.html`, plus `robots.txt`, `sitemap.xml`, and `CNAME` (custom domain).
`extra/` holds the More Games app (see above).

## Run locally

```sh
cd arcade
python3 -m http.server 8000
# open http://localhost:8000/
```

## Deploy

GitHub Pages, repo `jenam977-dot/tiny-arcade`, branch `main`, root folder.
Push this directory's contents to the repo root. Custom domain
`arcade.manasonroads.cv` via the `CNAME` file + a Cloudflare DNS CNAME record
`arcade` → `jenam977-dot.github.io` (DNS only, not proxied). Live URL:
https://arcade.manasonroads.cv/ (the github.io address redirects to it).

## Add a game

1. Write `js/<game>.js` (plain JS, no dependencies; guard `localStorage` with
   try/catch; support touch via pointer events or touch handlers; include
   pause via the `pauseBtn` / `pauseOverlay` / `resumeBtn` / `pauseRestartBtn`
   ids).
2. Write `games/<game>.html` following the existing shells (same nav, HUD,
   overlays, details panel, footer; unique `<title>` and meta description;
   `data-game="<slug>"` on `<main>` for recently-played tracking).
3. Add a card to `index.html` (with `data-slug`, `data-category`,
   `data-title`, `data-desc` and a fav button) and a URL to `sitemap.xml`.
4. Syntax-check: `node --check js/<game>.js`, then play-test in a browser.

## Monetization (the money setup)

Status 2026-11-13: site built and AdSense-ready in structure (real content
pages, privacy/terms/contact, sitemap, no copied assets). AdSense itself is
NOT yet applied for — the upgrade application for the existing AdSense
account on jenam977@gmail.com (a hosted AdSense-for-YouTube account,
pub-3175371468463396) is in progress, and the site will be submitted as
arcade.manasonroads.cv once its DNS record exists. No ad code has been issued
yet; when Google issues a snippet, add it to the pages and push.

Traffic is what turns ads into money. The site has share links (WhatsApp,
Telegram, Facebook) and search-engine basics; sustained traffic comes from
sharing, Shorts/Reels pointing at the site, and new games over time.
