# jackyyangjq.github.io

Source of my personal academic website: **https://jackyyangjq.github.io**

Built with [PRISM](https://github.com/xyjoey/PRISM) (MIT licence), a Next.js template for academic homepages, with my own additions:

- a research page for working papers, with design sketches instead of results while papers are under review
- project cards with figures and links
- CV downloads in the sidebar
- a visitor map and statistics page, fed by cookie-free analytics
- English and Chinese versions, light and dark themes

## Updating

Content lives in `content/` (English) and `content_zh/` (Chinese), as TOML and Markdown files. Pushing to `main` builds the site and deploys it to GitHub Pages; a daily scheduled run refreshes the visitor statistics.

```bash
npm ci
npm run dev      # local preview at http://localhost:3000
npm run build    # static export to out/
```

The world map outline in `public/data/world.json` is generated once with `node scripts/build-world-map.mjs` from [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth, public domain).

## Licence

The template code is MIT-licensed; see `LICENSE`. Text, photos, figures and CV files are © Jiaqi Yang and are not covered by that licence.
