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

    const title = `${name} - ARC Raiders Item | Database & Guide`
    const description = `${name} in ARC Raiders: complete item details including rarity, recycling value, sell price, crafting uses, and quest/workshop requirements. Part of the ARC Raiders items database.`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': name,
      'description': description,
      'identifier': slug,
      'brand': {
        '@type': 'Brand',
        'name': 'ARC Raiders'
      },
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
    <meta name="keywords" content="arc raiders ${escapeHtml(name.toLowerCase())}, arc raiders items, ${escapeHtml(slug)}, arc raiders database" />
  <link rel="canonical" href="https://www.arcdb.site${siteBase}items/${slug}/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="https://www.arcdb.site${siteBase}items/${slug}/" />
    <meta property="og:image" content="https://www.arcdb.site/icon.svg" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <link rel="icon" href="/icon.svg" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="stylesheet" href="/dark-mode.css" />
  <script defer src="/dark-mode.js"></script>
    <style>body{font-family:system-ui,Arial,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem}h1{margin:0 0.5rem}table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{padding:.5rem;border:1px solid #ddd;text-align:left}.breadcrumb{margin-bottom:1rem;font-size:0.9rem}.breadcrumb a{color:#0066cc;text-decoration:none}.breadcrumb a:hover{text-decoration:underline}.item-nav{margin-top:2rem;padding-top:1rem;border-top:1px solid #ddd}.item-nav a{display:inline-block;margin-right:1rem;color:#0066cc;text-decoration:none}.item-nav a:hover{text-decoration:underline}</style>
  </head>
  <body>
    <div class="breadcrumb">
      <a href="/">ARC Raiders Database</a> &gt; 
      <a href="/">Items</a> &gt; 
      <span>${escapeHtml(name)}</span>
    </div>
    <h1>${escapeHtml(name)} - ARC Raiders Item</h1>
    <p>${escapeHtml(description)}</p>
    <table>
      <tbody>
${Object.keys(item).map(k => `        <tr><th>${escapeHtml(k)}</th><td>${escapeHtml(item[k])}</td></tr>`).join('\n')}
      </tbody>
    </table>
    <div class="item-nav">
      <a href="/">← Back to ARC Raiders Items Database</a>
      <a href="/what-to-keep.html">What to Keep Guide</a>
      <a href="/what-to-sell.html">What to Sell Guide</a>
      <a href="/loot-guide.html">Loot Farming Guide</a>
    </div>
  </body>
</html>`

    const outFile = path.join(outDir, 'index.html')
    await fs.writeFile(outFile, html, 'utf-8')
  }

  console.log(`Generated ${data.length} item pages under public/items/`)
}

main().catch(err => { console.error(err); process.exitCode = 1 })
