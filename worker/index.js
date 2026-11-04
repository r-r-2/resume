// Phase 1: everything is static, so the Worker hands requests to the asset server.
// Phase 2 (concierge): answer POST /api/ask here before falling through to assets.
//
// Static assets ignore Range requests, but video players (link-preview players
// included) fetch in pieces and give up on a 200 carrying the whole file.
// So .mp4 files get proper 206 Partial Content replies. wrangler.jsonc runs the
// Worker first for *.mp4 only; every other file is served by assets directly.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.endsWith('.mp4')) return env.ASSETS.fetch(request);

    // Always fetch the asset with GET so a HEAD request still knows the size.
    const res = await env.ASSETS.fetch(new Request(url, { method: 'GET', headers: request.headers }));
    if (!res.ok) return res; // 304, 404 and so on pass straight through

    const headers = new Headers(res.headers);
    headers.set('Accept-Ranges', 'bytes');
    const head = request.method === 'HEAD';

    const range = parseRange(request.headers.get('Range'));
    if (!range) return new Response(head ? null : res.body, { status: 200, headers });

    const body = await res.arrayBuffer();
    const size = body.byteLength;
    const { start, end } = range(size);
    if (start >= size || start > end) {
      headers.set('Content-Range', `bytes */${size}`);
      headers.delete('Content-Length');
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(head ? null : body.slice(start, end + 1), { status: 206, headers });
  },
};

// Single ranges only: "bytes=0-15", "bytes=100-", "bytes=-500".
// Multi-range requests are rare; they get the full file, which the spec allows.
function parseRange(value) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(value || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  const [, a, b] = m;
  return (size) =>
    a === ''
      ? { start: Math.max(0, size - Number(b)), end: size - 1 } // last N bytes
      : { start: Number(a), end: b === '' ? size - 1 : Math.min(Number(b), size - 1) };
}
