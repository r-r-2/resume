// Phase 1: everything is static, so the Worker only hands requests to the asset server.
// Phase 2 (concierge): answer POST /api/ask here before falling through to assets.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
