import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public', { recursive: true })

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f172a"/>
  <rect x="112" y="144" width="288" height="256" rx="24" fill="#fff"/>
  <rect x="112" y="144" width="288" height="56" rx="24" fill="#0f172a"/>
  <circle cx="176" cy="124" r="16" fill="#0f172a"/>
  <circle cx="336" cy="124" r="16" fill="#0f172a"/>
  <text x="256" y="320" font-family="system-ui, sans-serif" font-size="120" font-weight="700" text-anchor="middle" fill="#0f172a">P</text>
</svg>`

const sizes = [192, 512]
for (const size of sizes) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon-${size}.png`)
  console.log(`icon-${size}.png done`)
}
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('public/icon-512-maskable.png')
console.log('maskable done')
await sharp(Buffer.from(svg)).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('apple done')
