<script setup>
import { ref, onMounted, computed } from 'vue'

const BASE = import.meta.env.BASE_URL || '/'

const items = ref([])
const columns = ref([])
const error = ref(null)
const searchTerm = ref('')

async function loadData() {
  try {
    // use Vite's runtime base so the request resolves correctly on GitHub Pages
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // add derived field "safe to sell/recycle" based on Keep for Quests/Workshop
    items.value = data.map(d => ({ ...d, "safe to sell/recycle": d["Keep for Quests/Workshop"] == null }))
    columns.value = items.value.length ? Object.keys(items.value[0]) : []
  } catch (err) {
    console.error(err)
    error.value = err.message || String(err)
  }
}

onMounted(loadData)

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
    <h1>ARC Items Database</h1>
    <p class="subtitle">Browse and search ARC items (rarity, recycle outputs, price, and quest/workshop notes).</p>

    <div v-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="!items.length" class="loading">Loading…</div>

    <div v-else>
      <div class="controls">
        <input v-model="searchTerm" type="search" placeholder="Search items (any column)..." aria-label="Search" />
        <div class="count">Showing {{ filteredItems.length }} of {{ items.length }}</div>
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
.subtitle { margin-top: 0; color: #555; }
.loading { color: #666; }
.error { color: #b00020; margin-bottom: 1rem; }
.table-wrap { overflow-x: auto; border: 1px solid #e6e6e6; border-radius: 6px; }
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; }
thead th { position: sticky; top: 0; background: #fafafa; z-index: 2; font-weight: 600; }
tr:nth-child(even) td { background: #fbfbfb; }
code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 4px; }
.tick { color: #1f8a3d; font-weight: 700; }
.cross { color: #b00020; font-weight: 700; }
.controls { display:flex; gap:1rem; align-items:center; margin: 1rem 0; }
.controls input[type="search"] { flex:1; padding:0.5rem 0.75rem; border:1px solid #dcdcdc; border-radius:6px; }
.count { color:#555; font-size:0.95rem }
th.sortable { cursor: pointer; user-select: none; }
.sort-indicator { margin-left: 0.35rem; color: #666; font-size: 0.9rem }

.clickable-row { cursor: pointer }
.row-link { color: inherit; text-decoration: none; display: block }


/* Responsive: transform table into vertical cards on small screens */
@media (max-width: 768px) {
  .controls { flex-direction: column; align-items: stretch; }
  table { min-width: 100%; border: 0; }
  thead { display: none; }
  tbody tr { display: block; margin: 0 0 12px 0; border: 1px solid #eee; border-radius: 8px; padding: 0.5rem; background: #fff; }
  tbody td { display: flex; justify-content: space-between; padding: 0.5rem 0; border: none; }
  tbody td + td { border-top: 1px solid #f2f2f2; }
  tbody td:before { content: attr(data-label); font-weight: 600; color: #333; margin-right: 0.5rem; flex: 0 0 55%; }
  tbody td span { flex: 1; text-align: right; color: #111; }
  .table-wrap { border: none; }
}
</style>
