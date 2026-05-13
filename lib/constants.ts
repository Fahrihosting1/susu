export const GITHUB_CONFIG = {
  owner: process.env.GITHUB_OWNER || 'Fahrihosting1',
  repo: process.env.GITHUB_REPO || 'database-bot',
  branch: process.env.GITHUB_BRANCH || 'main',
  token: process.env.GITHUB_TOKEN || '',
  dataPath: 'data/database.json',
}

export const SESSION_COOKIE_NAME = 'sewa-bot-session'

export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-warning' },
  processing: { label: 'Processing', color: 'bg-primary' },
  completed: { label: 'Completed', color: 'bg-success' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive' },
} as const

// Product categories are now user-defined via ProductCategory entities
// No longer using static category list
