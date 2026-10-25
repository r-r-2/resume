import hashlib, pathlib as _pl
VER={n:hashlib.sha1((_pl.Path(__file__).parent/'public'/n).read_bytes()).hexdigest()[:8] for n in ('app.js','land.js')}
"""Assemble the page.

public/index.html   full document, deployed by the Cloudflare Worker
preview/index.html  fragment for the claude.ai preview (it adds its own doctype and head)
"""
from pathlib import Path

ROOT = Path(__file__).parent
src = ROOT / "src"
head = (src / "page.html").read_text()
sprite = (src / "sprite.html").read_text()
avatar = (ROOT / "avatar_symbol.txt").read_text()
body = (src / "body.html").read_text()
import re as _re
# every off-site link opens in a new tab and says so to screen readers
def _ext(m):
    tag, inner = m.group(1), m.group(2)
    if 'target=' not in tag:
        tag = tag[:-1] + ' target="_blank" rel="noopener">'
    return tag + inner + '<span class="sr"> (opens in a new tab)</span></a>'
body = _re.sub(r'(<a\b[^>]*href="(?:https?:)?//[^"]*"[^>]*>)(.*?)</a>', _ext, body, flags=_re.S)

scripts = (
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>\n'
    f'<script src="land.js?v={VER["land.js"]}"></script>\n'
    f'<script src="app.js?v={VER["app.js"]}"></script>\n'
)

GA_ID = "G-811TD0J532"
# Google Analytics, live site only. Privacy setup: no cookies by default in the EEA, UK and Switzerland
# (cookieless pings), normal analytics elsewhere, ad features and Google signals off.
analytics = f"""<script>
window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}
gtag('consent','default',{{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',
  region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH']}});
gtag('consent','default',{{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'}});
gtag('js',new Date());
gtag('config','{GA_ID}',{{allow_google_signals:false,allow_ad_personalization_signals:false}});
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
"""

fragment = f"{head}\n{sprite}\n{avatar}\n{body}\n{scripts}"
full = (
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    f"{analytics}{head}\n</head>\n<body>\n{sprite}\n{avatar}\n{body}\n{scripts}</body>\n</html>\n"
)

(ROOT / "public" / "index.html").write_text(full)
pv = ROOT / "preview"
pv.mkdir(exist_ok=True)
(pv / "index.html").write_text(fragment)
for name in ("app.js", "land.js"):
    (pv / name).write_text((ROOT / "public" / name).read_text())
(pv / "favicon.ico").write_bytes((ROOT / "public" / "favicon.ico").read_bytes())
print("built", len(full), "bytes")
