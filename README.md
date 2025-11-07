# arc-site

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


## Deployment & Production notes

Before publishing, update the canonical/OG URLs in `index.html` (replace `https://example.com/`).

- If deploying to GitHub Pages under `/repo-name/` set `base` in `vite.config.js` to `'/repo-name/'` and update `manifest.webmanifest` `start_url`.
- For Netlify or Vercel, deploy the `dist/` folder (build output) and set proper caching headers: long cache for hashed assets, short/no-cache for `data.json` if it changes often.

Quick verification after upgrading Node/npm and installing deps:

```powershell
cd arc-site
npm ci
npm run build
npm run preview  # optional; serves the built site locally
```

Robots and sitemap are available at `/robots.txt` and `/sitemap.xml` (update sitemap URLs). 

If you want, I can add a small GitHub Actions workflow that builds and deploys the site automatically on push.
