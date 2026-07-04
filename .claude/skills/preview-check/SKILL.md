---
name: preview-check
description: Screenshot the app at kiosk (1920x1080) and iPhone (390x844) viewports before committing UI changes. Use whenever a change touches JSX, CSS, Tailwind classes, or layout — BEFORE the commit, never by deploying and asking the user to look at their phone or TV. Triggers - "preview", "screenshot", "check the layout", overflow fixes, kiosk or admin UI changes.
---

# Preview Check

The history of this repo includes an 8-commit blind fix-chain on iOS input overflow and a "v2 badge" committed just to see a deploy land. This skill replaces that loop: render locally, screenshot both real targets, look, then commit.

## Steps

1. Ensure deps are installed (`npm ci` if `node_modules` is missing). Run the dev server — **without `.env.local` the app automatically uses mock data**, which is perfect for layout checks:
   ```bash
   npm run dev -- --port 5173 &
   ```
   For a final pre-commit check of the production bundle use `npm run build && npm run preview -- --port 5173 &` instead.
2. Screenshot with Playwright (Chromium preinstalled; do NOT run `playwright install`):
   ```js
   // scratchpad/shot.mjs
   import { chromium } from 'playwright';
   const browser = await chromium.launch();
   const targets = [
     ['kiosk-1920x1080', { width: 1920, height: 1080 }, 'http://localhost:5173/painel?desktop=1'],
     ['admin-iphone-390x844', { width: 390, height: 844 }, 'http://localhost:5173/editar'],
   ];
   for (const [name, viewport, url] of targets) {
     const page = await browser.newPage({ viewport });
     await page.goto(url, { waitUntil: 'networkidle' });
     await page.screenshot({ path: `${name}.png`, fullPage: true });
   }
   await browser.close();
   ```
   If `@playwright/test` isn't installed locally, launch with `executablePath: '/opt/pw-browsers/chromium'`.
3. Checklist while looking at the screenshots:
   - Kiosk: everything visible with no scroll at 1920x1080; text readable from 2-3 m (clock 48px+, events 16px+, routines 18px+); today-ring visible.
   - Admin at 390px: no horizontal overflow, inputs `font-size >= 16px` (iOS zoom prevention), touch targets adequate.
   - If dark mode is affected, re-shoot with the `.dark` class applied.
4. Send the PNGs to the user with `SendUserFile`, state what changed and what to look at.
5. Commit only after the screenshots are right.
