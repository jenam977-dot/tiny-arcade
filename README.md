# Tiny Arcade

Free mini games that run entirely in the browser. No build step, no dependencies,
no accounts. Plain HTML + CSS + JavaScript.

## Games (v1, 2026-11-13)

| Game | File | Controls |
|---|---|---|
| Fruit Slice | `games/fruit-slice.html` + `js/fruit-slice.js` | Swipe / drag to slice; avoid bombs |
| Snake | `games/snake.html` + `js/snake.js` | Arrows / WASD / D-pad / swipe |
| Brick Breaker | `games/breaker.html` + `js/breaker.js` | Mouse / touch / arrow keys, Space to launch |
| Memory Match | `games/memory.html` + `js/memory.js` | Tap / click cards |

Best scores are stored in the visitor's own browser (`localStorage`) only.

## Pages

`index.html` (game grid), `about.html`, `privacy.html`, `terms.html`,
`contact.html`, plus `robots.txt` and `sitemap.xml` for search engines.

## Run locally

```sh
cd arcade
python3 -m http.server 8000
# open http://localhost:8000/
```

## Deploy

GitHub Pages, repo `jenam977-dot/tiny-arcade`, branch `main`, root folder.
Push this directory's contents to the repo root, then enable Pages in the
repo's Settings → Pages (deploy from branch `main` / root). Live URL:
https://jenam977-dot.github.io/tiny-arcade/

## Add a game

1. Write `js/<game>.js` (plain JS, no dependencies; guard `localStorage` with
   try/catch; support touch via pointer events or touch handlers).
2. Write `games/<game>.html` following the existing shells (same header, HUD,
   overlay, footer; unique `<title>` and meta description).
3. Add a card to `index.html` and a URL to `sitemap.xml`.
4. Syntax-check: `node --check js/<game>.js`, then play-test in a browser.

## Monetization (the money setup)

Status 2026-11-13: site built and AdSense-ready in structure (real content
pages, privacy/terms/contact, sitemap, no copied assets). AdSense itself is
NOT applied for — that step needs Manas:

1. The site must be live and reachable (done via GitHub Pages).
2. Manas applies at adsense.google.com with his Google account, adds the site,
   and pastes the verification/ad code into the pages (Muse can add the code
   once Google issues it).
3. Google reviews the site (days to weeks; new/thin sites are often rejected
   first time — more games + more content + some traffic improves the odds).
4. Payment setup (address, bank/tax details) is his step, in his own account.

Traffic is what turns ads into money. The site has share links (WhatsApp,
Telegram, Facebook) and search-engine basics; sustained traffic comes from
sharing, Shorts/Reels pointing at the site, and new games over time.
