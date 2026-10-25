"""Render the page headlessly at desktop and phone widths, collect errors and screenshots."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "shots"
OUT.mkdir(exist_ok=True, parents=True)
url = (ROOT / "public" / "index.html").as_uri()
stops = ["start", "auth", "experiments", "traffic", "oncall", "observability", "resilience",
         "proxy", "infra", "projects", "ai", "talks", "talks-internal", "summary"]

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in (("desktop", {"width": 1280, "height": 900}), ("phone", {"width": 390, "height": 844})):
        ctx = b.new_context(viewport=vp, device_scale_factor=1 if name == "desktop" else 2)
        def cdn(route):
            u = route.request.url
            f = ROOT / "node_modules" / ("d3/dist/d3.min.js" if "d3" in u else "topojson-client/dist/topojson-client.min.js")
            route.fulfill(path=str(f), content_type="application/javascript")
        ctx.route("https://cdnjs.cloudflare.com/**", cdn)
        ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(url, wait_until="networkidle")
        sw = pg.evaluate("document.documentElement.scrollWidth")
        print(name, "scrollWidth", sw, "viewport", vp["width"])
        wide = pg.evaluate("""() => [...document.querySelectorAll('main *')].filter(e => {
            const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && !e.closest('.idx');
          }).slice(0, 8).map(e => e.tagName + '.' + (e.className.baseVal ?? e.className) + '#' + e.id + ' ' + Math.round(e.getBoundingClientRect().right))""")
        if wide:
            print("  overflowing:", wide)
        for s in stops:
            pg.evaluate(f"document.getElementById('{s}').scrollIntoView()")
            pg.wait_for_timeout(5200 if s in ("traffic", "oncall", "infra", "ai") else 2600)
            pg.locator(f"#{s}").screenshot(path=str(OUT / f"{name}-{s}.png"))
        print("  errors:", errs or "none")
        ctx.close()
    b.close()
