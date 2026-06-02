// Icon-Generator: rendert SVG via Playwright zu PNG
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#c2763a"/>
      <stop offset="100%" stop-color="#6b2d0e"/>
    </linearGradient>
  </defs>

  <!-- Hintergrund -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Pfotenabdruck – modern, geometrisch, leicht gedreht -->
  <g transform="translate(256,268) rotate(-12)">
    <!-- Hauptballen -->
    <ellipse cx="0" cy="55" rx="72" ry="58" fill="white" opacity="0.95"/>

    <!-- Zehenballen – oben links -->
    <ellipse cx="-82" cy="-28" rx="33" ry="28" fill="white" opacity="0.95"/>
    <!-- Zehenballen – oben mittig links -->
    <ellipse cx="-28" cy="-72" rx="33" ry="28" fill="white" opacity="0.95"/>
    <!-- Zehenballen – oben mittig rechts -->
    <ellipse cx="38" cy="-75" rx="33" ry="28" fill="white" opacity="0.95"/>
    <!-- Zehenballen – oben rechts -->
    <ellipse cx="88" cy="-33" rx="33" ry="28" fill="white" opacity="0.95"/>
  </g>
</svg>`

const html = (size) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  svg { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>${svgIcon}</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(html(size), { waitUntil: 'domcontentloaded' })
  const buffer = await page.screenshot({ type: 'png', omitBackground: false })
  const path = join(publicDir, name)
  writeFileSync(path, buffer)
  console.log(`✓ ${name} (${size}×${size}px)`)
}

await browser.close()
console.log('Icons generiert.')
