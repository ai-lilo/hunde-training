import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'

const svg = readFileSync('./public/icon.svg', 'utf8')

for (const size of [192, 512, 180]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  const name = size === 180 ? 'apple-touch-icon' : `icon-${size}`
  writeFileSync(`./public/${name}.png`, png)
  console.log(`✓ ${name}.png (${size}×${size})`)
}
