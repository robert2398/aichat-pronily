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
    // detect category token inside the path (female | male | trans) even if nested inside folder names
    let category = 'unknown'
    let catIndex = -1
    for (let i = 0; i < parts.length; i++) {
      const lp = String(parts[i]).toLowerCase()
      if (['female', 'male', 'trans'].includes(lp)) {
        category = lp
        catIndex = i
        break
      }
      // some folders may include 'female' or 'male' as part of a multi-word folder like 'real female'
      if (lp.includes('female')) {
        category = 'female'
        catIndex = i
        break
      }
      if (lp.includes('male')) {
        category = 'male'
        catIndex = i
        break
      }
      if (lp.includes('trans')) {
        category = 'trans'
        catIndex = i
        break
      }
    }
    const filename = parts[parts.length - 1]
    // folder path should be what's after the detected category token up to the filename
    const folderParts = catIndex >= 0 ? parts.slice(catIndex + 1, parts.length - 1) : []
    // normalize folder to use forward slashes
    const folder = folderParts.join('/')
    const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  // use the original filePath as the id to ensure uniqueness (avoids collisions when files share the same name)
  const id = filePath
  return { id, name, url, category, folder }
  })
}

const allItems = buildItems()

export function getAssets(category, folder) {
  // normalize category strings to 'female' | 'male' | 'trans' (accept legacy values)
  const mapToCanonical = (s) => {
    const low = String(s || '').toLowerCase()
    if (['girl', 'girls', 'female', 'woman', 'women'].includes(low)) return 'female'
    if (['men', 'man', 'male', 'guys'].includes(low)) return 'male'
    if (['trans', 'transgender', 'trans woman', 'trans man', 'transfemale', 'transmale'].includes(low)) return 'trans'
    return low
  }

  // if category is falsy, return items across all categories
  const cat = category ? mapToCanonical(category) : null
  const items = cat ? allItems.filter(i => i.category === cat) : allItems.slice()

  if (!folder) return items
  const want = slug(folder)
  // try exact folder match first, otherwise match folder token inside the file path/id (use slug of id)
  return items.filter(i => {
    try {
      if (slug(i.folder) === want) return true
      const slugId = slug(i.id || '')
      if (slugId.includes(`/${want}/`) || slugId.includes(`-${want}-`) || slugId.includes(`/${want}-`) || slugId.includes(`-${want}/`)) return true
    } catch (e) {}
    return false
  })
}

export default { getAssets }
