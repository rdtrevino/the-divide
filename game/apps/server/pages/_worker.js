// thedivide.pages.dev: the site's public address. Cloudflare Pages runs this tiny Worker, which hands
// every request (pages, the game tables' live connections, the stats API) to the game server Worker
// "the-divide" through the GAME service binding set on the Pages project.
export default {
  fetch(request, env) {
    return env.GAME.fetch(request);
  },
};
