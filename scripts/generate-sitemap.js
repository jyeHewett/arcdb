import fs from 'fs/promises'
import path from 'path'

function slugify(name) {
  return name.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public')
  const dataPath = path.join(publicDir, 'data.json')
  
  let data
  try {
    const raw = await fs.readFile(dataPath, 'utf-8')
    data = JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read data.json from public/:', err.message)
    process.exitCode = 1
    return
  }

  const siteBase = 'https://www.arcdb.site'
  
  // Start building sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>${siteBase}/</loc>
    <priority>1.00</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${siteBase}/what-to-keep.html</loc>
    <priority>0.80</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${siteBase}/what-to-sell.html</loc>
    <priority>0.80</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${siteBase}/loot-guide.html</loc>
    <priority>0.80</priority>
    <changefreq>weekly</changefreq>
  </url>
  <!-- Item pages -->
`

  // Add all item pages
  for (const item of data) {
    const name = item.Name || 'item'
    const slug = slugify(name)
    sitemap += `  <url>
    <loc>${siteBase}/items/${slug}/</loc>
    <priority>0.60</priority>
    <changefreq>monthly</changefreq>
  </url>
`
  }

  sitemap += `</urlset>
`

  // Write the sitemap
  const sitemapPath = path.join(publicDir, 'sitemap.xml')
  await fs.writeFile(sitemapPath, sitemap, 'utf-8')
  
  console.log(`Generated sitemap with ${data.length} item pages`)
}

main().catch(err => { console.error(err); process.exitCode = 1 })
