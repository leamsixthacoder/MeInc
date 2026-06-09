import { INITIAL_DATA } from '../data/initialData.js'

const STORAGE_KEY = 'me_inc_v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(INITIAL_DATA)
    const parsed = JSON.parse(raw)
    // Merge with initial data to pick up any new keys added in updates
    return deepMerge(structuredClone(INITIAL_DATA), parsed)
  } catch {
    console.warn('localStorage read failed, using initial data')
    return structuredClone(INITIAL_DATA)
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded')
      throw new Error('Storage full. Please export and clear old data.')
    }
    throw e
  }
}

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `me-inc-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (!parsed.meta || !parsed.decisions) {
          reject(new Error('Invalid backup file: missing required fields'))
          return
        }
        resolve(parsed)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY)
}

// Shallow merge for top-level keys only — arrays from saved data take precedence
function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (Array.isArray(override[key])) {
      result[key] = override[key]
    } else if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key] ?? {}, override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}
