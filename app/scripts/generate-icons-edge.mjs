// Icon-Generator via Edge (kein Playwright-Browser-Download nötig)
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
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256,268) rotate(-12)">
    <ellipse cx="0" cy="55" rx="72" ry="58" fill="white" opacity="0.95"/>
    <ellipse cx="-82" cy="-28" rx="33" ry="28" fill="white" opacity="0.95"/>
    <ellipse cx="-28" cy="-72" rx="33" ry="28" fill="white" opacity="0.95"/>
    <ellipse cx="38" cy="-75" rx="33" ry="28" fill="white" opacity="0.95"/>
    <ellipse cx="88" cy="-33" rx="33" ry="28" fill="white" opacity="0.95"/>
  </g>
</svg>`

const html = (size) => `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; }
</style></head><body>${svgIcon.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const browser = await chromium.launch({
  executablePath: edgePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage({ deviceScaleFactor: 1 })

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(html(size), { waitUntil: 'domcontentloaded' })
  const buffer = await page.screenshot({ type: 'png' })
  writeFileSync(join(publicDir, name), buffer)
  console.log(`✓ ${name} (${size}×${size}px)`)
}

await browser.close()
console.log('Icons fertig.')
