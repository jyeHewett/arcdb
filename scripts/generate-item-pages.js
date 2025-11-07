import fs from 'fs/promises'
import path from 'path'

function slugify(name) {
  return name.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

  const outBase = path.join(publicDir, 'items')
  await ensureDir(outBase)

  const siteBase = '/' // repo base; keep in sync with vite.config.js

  for (const item of data) {
    const name = item.Name || 'item'
    const slug = slugify(name)
    const outDir = path.join(outBase, slug)
    await ensureDir(outDir)

    const title = `${name} — ARC Items Database`
    const description = `Details for ${name}: rarity, recycling, sell price, and quest/workshop notes.`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': name,
      'description': description,
      'identifier': slug,
      'additionalProperty': Object.keys(item).map(k => ({
        '@type': 'PropertyValue',
        'name': k,
        'value': item[k]
      }))
    }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="https://www.arcdb.site${siteBase}items/${slug}/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="https://www.arcdb.site${siteBase}items/${slug}/" />
  <meta property="og:image" content="https://www.arcdb.site/icon.svg" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <link rel="icon" href="/icon.svg" />
  <link rel="manifest" href="/manifest.webmanifest" />
    <style>body{font-family:system-ui,Arial,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem}h1{margin:0 0.5rem}table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{padding:.5rem;border:1px solid #ddd;text-align:left}</style>
  </head>
  <body>
  <a href="/">← Back to ARC Items Database</a>
    <h1>${escapeHtml(name)}</h1>
    <p>${escapeHtml(description)}</p>
    <table>
      <tbody>
${Object.keys(item).map(k => `        <tr><th>${escapeHtml(k)}</th><td>${escapeHtml(item[k])}</td></tr>`).join('\n')}
      </tbody>
    </table>
  </body>
</html>`

    const outFile = path.join(outDir, 'index.html')
    await fs.writeFile(outFile, html, 'utf-8')
  }

  console.log(`Generated ${data.length} item pages under public/items/`)
}

main().catch(err => { console.error(err); process.exitCode = 1 })
