<script setup>
import { ref, onMounted, computed } from 'vue'

const BASE = import.meta.env.BASE_URL || '/'

// Theme: a simple dark-mode toggle persisted to localStorage.
const isDark = ref(false)
function applyTheme(enable) {
  try { document.documentElement.classList.toggle('dark', !!enable) } catch (e) { /* ignore */ }
}
function saveTheme(enable) {
  try { localStorage.setItem('theme', enable ? 'dark' : 'light') } catch (e) { }
}
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  saveTheme(isDark.value)
}

// Support both the original crafts.json shape and a compacted one.
// Compact form example:
// { "angled-grip-i": { "d": "Angled Grip I", "n": [["Plastic Parts",6],["Duct Tape",1]], "needed_in": [...] } }
function normalizeCrafts(raw) {
  const out = {}
  for (const [key, val] of Object.entries(raw || {})) {
    if (!val) { out[key] = val; continue }
    const obj = {}
    // display name: prefer full `display_name`, fall back to compact `d` or derive from key
    obj.display_name = val.display_name || val.d || key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    // needed_in may be present; keep as-is (support compact 'ni' too)
    obj.needed_in = val.needed_in || val.ni || val.neededIn || []
    // normalize 'needs' — support compact 'n' format (array of [name, qty])
    if (Array.isArray(val.n)) {
      obj.needs = val.n.map(it => Array.isArray(it) ? { name: it[0], quantity: it[1] } : it)
    } else {
      obj.needs = val.needs || []
    }
    out[key] = obj
  }
  return out
}

// Normalize data.json entries to the long form expected by the UI.
// Support compact keys:
// n -> Name, r -> Rarity, rt -> Recycles To, sp -> Sell Price, c -> Category,
// k -> Keep for Quests/Workshop, nf -> needed_for
function normalizeData(raw) {
  if (!Array.isArray(raw)) return raw
  return raw.map(item => {
    // if already long-form (has Name) return as-is
    if (item.Name) return item
    const out = {}
    out['Name'] = item.n || item.Name || ''
    if (item.r !== undefined) out['Rarity'] = item.r
    else if (item.Rarity !== undefined) out['Rarity'] = item.Rarity
    out['Recycles To'] = item.rt !== undefined ? item.rt : item['Recycles To']
    out['Sell Price'] = item.sp !== undefined ? item.sp : item['Sell Price']
    out['Category'] = item.c !== undefined ? item.c : item['Category']
    out['Keep for Quests/Workshop'] = item.k !== undefined ? item.k : item['Keep for Quests/Workshop']
    out['needed_for'] = item.nf !== undefined ? item.nf : item.needed_for || item.neededFor
    return out
  })
}

const items = ref([])
const columns = ref([])
const error = ref(null)
const searchTerm = ref('')

async function loadData() {
  try {
    // use Vite's runtime base so the request resolves correctly on GitHub Pages
    const base = import.meta.env.BASE_URL || '/'

  // load main items data
  const res = await fetch(`${base}data.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const rawData = await res.json()
  const data = normalizeData(rawData)

    // crafts.json is no longer required at runtime — `needed_for` is baked into data.json at build time.
    // Keep `crafts` empty so the client falls back to generating display names from craft keys.
    const crafts = {}

    // build a lookup: normalized item name -> array of parent display names
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
    const craftMap = {}
    // also build a simple mapping from craft key -> display name (used when data.json contains needed_for)
    const craftDisplay = {}
    for (const [key, val] of Object.entries(crafts || {})) {
      const display = (val && val.display_name) || key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      craftDisplay[key] = display
      // val.needed_in is an array of parent keys (slugs); map those to display names
      const parents = (val && val.needed_in) || []
      const parentNames = parents.map(pk => {
        const p = crafts[pk]
        return (p && p.display_name) || pk.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      })
      craftMap[norm(display)] = parentNames
    }

    // add derived fields: "safe to sell/recycle" and "Needed For"
    items.value = data.map(d => {
      const name = d.Name || d.name || ''
      // prefer explicit `needed_for` on the data.json item (an array of craft keys)
      const neededKeys = d.needed_for || d.neededFor || []
      let neededNames = []
      if (Array.isArray(neededKeys) && neededKeys.length) {
        neededNames = neededKeys.map(k => craftDisplay[k] || String(k).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      } else {
        // Fallback: use the old heuristic of normalizing this item's name and looking up crafts that list it
        neededNames = craftMap[norm(name)] || []
      }

      // clone the original object so we can safely remove raw keys later
      const out = { ...d }
      // add UI-friendly fields
      out['safe to sell/recycle'] = d['Keep for Quests/Workshop'] == null
      out['Needed For'] = neededNames.length ? neededNames.join(', ') : ''
      return out
    })

    // Ensure any raw relation fields from data.json don't create duplicate columns.
    for (const it of items.value) {
      if (it.hasOwnProperty('needed_for')) delete it.needed_for
      if (it.hasOwnProperty('neededFor')) delete it.neededFor
    }

    columns.value = items.value.length ? Object.keys(items.value[0]) : []
  } catch (err) {
    console.error(err)
    error.value = err.message || String(err)
  }
}

onMounted(() => {
  // load content
  loadData()
  // synchronize theme with stored preference (preflight script sets class early to avoid flash)
  try {
    const stored = localStorage.getItem('theme')
    if (stored) isDark.value = stored === 'dark'
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDark.value = true
  } catch (e) {}
  applyTheme(isDark.value)
})

const filteredItems = computed(() => {
  if (!searchTerm.value) return items.value
  const q = searchTerm.value.trim().toLowerCase()
  return items.value.filter(item => {
    return Object.values(item).some(v => {
      if (v === null || v === undefined) return false
      return String(v).toLowerCase().includes(q)
    })
  })
})

// sorting state and logic
const sortColumn = ref(null)
const sortDir = ref('asc') // 'asc' or 'desc'

function toggleSort(col) {
  if (sortColumn.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDir.value = 'asc'
  }
}

const sortedItems = computed(() => {
  const list = filteredItems.value.slice()
  const col = sortColumn.value
  if (!col) return list
  list.sort((a, b) => {
    const va = a[col]
    const vb = b[col]
    // handle null/undefined
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1

    // booleans
    if (typeof va === 'boolean' || typeof vb === 'boolean') {
      const na = va === true ? 1 : 0
      const nb = vb === true ? 1 : 0
      return na - nb
    }

    // numbers
    if (typeof va === 'number' && typeof vb === 'number') return va - vb

    // attempt numeric compare for numeric-looking strings
    const na = Number(va)
    const nb = Number(vb)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb

    // fallback to string compare
    return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' })
  })
  if (sortDir.value === 'desc') list.reverse()
  return list
})

function formatValue(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? '✓' : '✗'
  if (typeof val === 'number') return val.toLocaleString()
  return String(val)
}

function slugify(name) {
  return name.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function openItem(item) {
  const slug = slugify(item.Name || item.name || 'item')
  // navigate to the static item page we generated
  window.location.href = BASE + 'items/' + slug + '/'
}
</script>

<template>
  <div class="container">
    <div class="site-header">
      <div>
        <h1>ARC Items Database</h1>
        <p class="subtitle">Browse and search ARC items (rarity, recycle outputs, price, and quest/workshop notes).</p>
      </div>
      <div class="header-actions">
        <a class="donate-btn" href="https://paypal.me/JyeHewett" target="_blank" rel="noopener noreferrer">Help with running costs without running ads</a>
      </div>
    </div>

    <div v-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="!items.length" class="loading">Loading…</div>

    <div v-else>
      <div class="controls">
        <input v-model="searchTerm" type="search" placeholder="Search items (any column)..." aria-label="Search" />
        <div class="count">Showing {{ filteredItems.length }} of {{ items.length }}</div>
        <button class="theme-toggle" @click="toggleTheme" :aria-pressed="isDark" :title="isDark ? 'Switch to light' : 'Switch to dark'">{{ isDark ? '☀️' : '🌙' }}</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="col in columns" :key="col" @click="toggleSort(col)" :class="{ sortable: true, sorted: sortColumn === col }">
                {{ col }}
                <span class="sort-indicator">{{ sortColumn === col ? (sortDir === 'asc' ? '▲' : '▼') : '' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in sortedItems" :key="idx" @click="openItem(item)" class="clickable-row" tabindex="0" @keydown.enter="openItem(item)">
              <td v-for="col in columns" :key="col" :data-label="col">
                <a :href="BASE + 'items/' + slugify(item.Name || item.name || 'item') + '/'" class="row-link">
                  <span :class="{ tick: item[col] === true, cross: item[col] === false }">{{ formatValue(item[col]) }}</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  padding-top: 1rem;
}
.subtitle { margin-top: 0; color: var(--muted); }
.loading { color: var(--muted); }
.error { color: var(--cross); margin-bottom: 1rem; }
.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 6px; }
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
thead th { position: sticky; top: 0; background: var(--header-bg); z-index: 2; font-weight: 600; }
tr:nth-child(even) td { background: var(--row-alt-bg); }
code { background: var(--code-bg); padding: 0.1rem 0.35rem; border-radius: 4px; }
.tick { color: var(--tick); font-weight: 700; }
.cross { color: var(--cross); font-weight: 700; }
.controls { display:flex; gap:1rem; align-items:center; margin: 1rem 0; }
.controls input[type="search"] { flex:1; padding:0.5rem 0.75rem; border:1px solid var(--input-border); border-radius:6px; background: var(--input-bg); color: var(--text); }
.count { color:var(--muted); font-size:0.95rem }
th.sortable { cursor: pointer; user-select: none; }
.sort-indicator { margin-left: 0.35rem; color: var(--muted); font-size: 0.9rem }

.clickable-row { cursor: pointer }
.row-link { color: var(--link); text-decoration: none; display: block }

.theme-toggle { margin-left: 0.25rem }

/* Responsive: transform table into vertical cards on small screens */
@media (max-width: 768px) {
  .controls { flex-direction: column; align-items: stretch; }
  table { min-width: 100%; border: 0; }
  thead { display: none; }
  tbody tr { display: block; margin: 0 0 12px 0; border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem; background: var(--table-bg); }
  tbody td { display: flex; justify-content: space-between; padding: 0.5rem 0; border: none; }
  tbody td + td { border-top: 1px solid rgba(0,0,0,0.04); }
  tbody td:before { content: attr(data-label); font-weight: 600; color: var(--text); margin-right: 0.5rem; flex: 0 0 55%; }
  tbody td span { flex: 1; text-align: right; color: var(--text); }
  .table-wrap { border: none; }
}
</style>
 
