// Lightweight asset loader for the public app (uses Vite import.meta.glob)
// Returns items for a category (female|male) and optional folder name. Accepts legacy names like 'girl'|'men'.
function slug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/[^a-z0-9\/-]+/g, '')
    .replace(/-{2,}/g, '-')
}

// Glob all image assets under the project's assets/ directory (project root ../.. from frontend/src).
// Eager + query:'?url' + import:'default' gives us a map filePath -> url string (new Vite syntax).
// Pattern intentionally broad to catch nested folders like 'ethnicity', 'hair-style', etc.
const modules = (import.meta.glob('../../assets/**/**/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) || {});

function buildItems() {
  return Object.entries(modules).map(([filePath, url]) => {
    const parts = filePath.split(/[\\/]+/g)
    // find category index (female or male) case-insensitive
    const catIndex = parts.findIndex(p => {
      const lp = String(p).toLowerCase()
      return lp === 'female' || lp === 'male'
    })
    const category = catIndex >= 0 ? String(parts[catIndex]).toLowerCase() : 'unknown'
    const filename = parts[parts.length - 1]
    const folderParts = catIndex >= 0 ? parts.slice(catIndex + 1, parts.length - 1) : []
    const folder = folderParts.join('/')
    const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const id = `${category}/${folder}/${filename}`
    return { id, name, url, category, folder }
  })
}

const allItems = buildItems()

export function getAssets(category, folder) {
  // normalize category strings to 'female' | 'male' (accept legacy values)
  const mapToCanonical = (s) => {
    const low = String(s || '').toLowerCase()
    if (['girl', 'girls', 'female', 'woman', 'women'].includes(low)) return 'female'
    if (['men', 'man', 'male', 'guys'].includes(low)) return 'male'
    return low
  }

  const cat = mapToCanonical(category)
  const items = allItems.filter(i => i.category === cat)
  if (!folder) return items
  const want = slug(folder)
  return items.filter(i => slug(i.folder) === want)
}

export default { getAssets }
