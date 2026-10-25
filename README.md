# resume.rr2.dev

An interactive profile: the visitor signs in and follows a request through 15 slides of real work.

Working on this repo with an AI agent? Read [AGENTS.md](AGENTS.md) first.

## Layout

```
public/          what gets deployed
  index.html     the page (built from src/)
  app.js         slide animations, top bar, request status, analytics events
  favicon.ico    site icon
  land.js        world map outline for the Global traffic slide
src/             page.html (styles), body.html (markup), sprite.html (icons)
worker/index.js  Cloudflare Worker, serves public/
build.py         assembles public/index.html from src/
check.py         headless render at desktop and phone widths, saves screenshots to shots/
```

## Preview locally

```
python3 -m http.server 8000 -d public
```

## Edit and rebuild

Change copy in `src/body.html`, styles in `src/page.html`, behavior in `public/app.js`, then:

```
python3 build.py
```

## Deploy

```
npx wrangler deploy
```

`wrangler.jsonc` attaches the custom domain `resume.rr2.dev`, which works when rr2.dev's DNS is on Cloudflare.
To deploy on every push, connect this repo to the Worker in the Cloudflare dashboard.

## Notes

- d3 and topojson load from cdnjs; fonts from Google Fonts.
- Slides play when you land on them; one-shot scenes have a replay icon, and looping scenes run only while visible.
- `prefers-reduced-motion` turns animation off and shows each slide in its finished state.
- `build.py` adds Google Analytics to the live page only, and opens external links in a new tab.
- Book a call links to https://meet.rr2.dev (change in src/body.html, class "book").
