# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex and others) working on this repo.

## What this is

`resume.rr2.dev` is Rahul Ravikumar's interactive profile. The visitor "signs in", and their request (`req 7f3a`) travels through 15 full-screen slides of his real work, grouped into four sections. It is a static site served by a Cloudflare Worker.

## Working rules

1. **Confirm before building.** Propose the change in plain words and wait for Rahul's go-ahead before editing files.
2. **The employer stays unnamed.** Never name the company, its internal tools (monitoring, abuse protection, cert or build systems), teams or colleagues.
3. **No real numbers** from work. Charts show shapes only. Experiments use the agreed 20% vs 37%.
4. **Deliberate details. Keep them as they are:**
   - "Sunnyvale, USA" on the Auth phone is an easter egg.
   - The incident region is `us-west-1`.
   - The outbound DNS example is `notify.service.example.com`.
5. **His words lead.** Each slide's "What I did" text is Rahul's own. Do not add extra sentences under titles.
6. **Calm motion.** Each slide has one main motion. Loops are slow, and nothing covers a scene's own animation.
7. **Accessibility stays at WCAG AA:**
   - text contrast at least 4.5:1
   - touch targets at least 24px
   - every control labelled
   - reduced motion shows finished states

   Check with axe-core after visual changes.
8. **External links:** write plain `<a href="https://…">`. `build.py` adds `target="_blank" rel="noopener"` and a screen-reader "(opens in a new tab)" automatically.
9. **Analytics:** Google Analytics (`G-811TD0J532`) is injected by `build.py` into the live page only.
   - It sends `slide_view`, `slide_time` and `link_click` events.
   - Visitors from the EEA, UK and Switzerland get no cookies.
   - Never add personal data to events.

## Keeping sensitive information out

This repo and the site are public. Before writing or committing anything, check that none of the following ends up in code, content, comments, commit messages, file names or `AGENTS.md` itself.

**Never include:**
- **Employer details:** the company's name, products, internal tools and systems, team names, project codenames, office or data-centre names, and internal URLs or hostnames. Describe work generically ("our monitoring", "the abuse protection plugin", "account recovery").
- **People:** colleagues', managers' or reviewers' names, usernames or handles. Testimonials are attributed by role only.
- **Real work data:** user counts other than the agreed "millions of daily users" and "about 5,000 users" in the scripted incident; real conversion rates, metrics or percentages; real dates of incidents; real IP addresses, hostnames or regions beyond the agreed `us-west-1` and `*.example.com`.
- **Security details:** how a vulnerability worked, audit report contents, exploit steps, or anything that would help an attacker. Say "closed audit findings on account takeover", never how.
- **Secrets:** API keys, tokens, passwords, private keys, `.env` files, analytics or Cloudflare credentials. Only the public GA measurement ID (`G-811TD0J532`) belongs in the code.
- **Personal data:** phone numbers, home address, personal emails, IDs. The only contact address is `rahul@rr2.dev`.

**Safe to use:**
- public product names (Splunk, Hive, HDFS, Looker, Chef, Ansible, Apache Traffic Server, Cursor, Claude Code)
- the agreed easter egg "Sunnyvale, USA"
- `example.com` addresses
- Rahul's public links (rr2.dev, notes.rr2.dev, GitHub, LinkedIn, the talk videos and posts)

**When source material is pasted in:** treat it as private. Pull out only what Rahul approves, rewrite it generically, and never copy it into the repo, even temporarily.

**If you're unsure** whether something is sensitive, leave it out and ask Rahul.

## Files

| Path | What it holds |
|---|---|
| `src/page.html` | `<head>` and all CSS |
| `src/body.html` | Top bar, the 15 slides, footer |
| `src/sprite.html` | SVG icons (`#i-…`) |
| `public/app.js` | All behaviour: slide modules (`S.<id>`), progress bars, the request status pill and marker dot, the Summary ring |
| `public/land.js` | World map data |
| `build.py` | Assembles `public/index.html` (and `preview/`), and adds a version tag to the script URLs |
| `check.py` | Headless screenshots |
| `wrangler.jsonc`, `worker/index.js` | Cloudflare Worker serving `public/` at `resume.rr2.dev` |

Build with `python3 build.py`. Preview with `python3 -m http.server 8000 -d public`. Deploy with `npx wrangler deploy`.

## Slides and their place on Slide 15 (Summary)

| # | Slide id | Title | Section | On the Summary ring |
|---|---|---|---|---|
| 1 | `start` | Rahul Ravikumar (sign in) | Shipping features | none (intro) |
| 2 | `auth` | Auth | Shipping features | Security & identity: Auth |
| 3 | `security` | Security | Shipping features | Security & identity: Threat modeling |
| 4 | `experiments` | Experiments | Shipping features | Building: Experiments |
| 5 | `data` | Data | Shipping features | Building: Data analysis; Reliability: Anomaly detection |
| 6 | `proxy` | Edge | Running infra | Edge (pill shared by Security and Infrastructure) |
| 7 | `infra` | Infra | Running infra | Infrastructure: Fleet upgrades |
| 8 | `traffic` | Global traffic | Running infra | Infrastructure: CI/CD |
| 9 | `oncall` | On-call | Handling outages | Reliability: On-call |
| 10 | `observability` | Observability | Handling outages | Reliability: Observability |
| 11 | `resilience` | Resilience | Handling outages | Reliability: Resilience |
| 12 | `ai` | Building with AI | Building and sharing | Building: Personal projects, AI |
| 13 | `talks` | Talks | Building and sharing | none, covered by "Also: talks, mentoring and hiring." |
| 14 | `notes` | Notes from teammates | Building and sharing | none (testimonials) |
| 15 | `summary` | One engineer, every layer | Building and sharing | the ring itself |

Cert rotation (Infrastructure) comes from the Edge slide.

## When a slide is added, removed, renamed or re-scoped

Do all of these in the same change:

1. **`src/body.html`**
   - Add, remove or rename the `<section class="stop" id="…" data-stop>` with its eyebrow (section name only) and `<h2>`.
   - Add, remove or rename the matching `<a class="hop" href="#…">` in the top bar, under the right `<span class="grp">` section.
   - Fix the `<a class="handoff">` next pill on the slide before it, and on the new slide.
2. **`public/app.js`**
   - Add or remove the slide module `S['<id>']` if it animates.
   - Add or remove its entry in the request status table (`const A={…}` in the "your request" block): the status text and the target for the marker dot.
3. **Slide 15 (Summary):**
   - Update the ring sectors (`const A=[{n:['Reliability'],…}]` in the summary block of `app.js`).
   - Update the legend in the summary section of `body.html`.
   - Update the "Also: …" line under the ring.
4. **This file:** update the slides table above.
5. **Ask Rahul how the change should appear on Slide 15** before finishing, and say what you'd suggest. Never leave a new slide off the Summary silently.

After any change, run `python3 build.py` and check that every slide still fits one screen at 1440×900, 1280×720 and 1024×768 (`check.py`).
