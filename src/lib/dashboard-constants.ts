/**
 * Executive / analytics dashboard defaults.
 * v1: 60s auto-refresh; increase or wire to system_config / env later without changing call sites.
 */
export const DASHBOARD_AUTO_REFRESH_MS = 60_000

/** Reserved for future: NEXT_PUBLIC_DASHBOARD_REFRESH_MS or system_config */
export function getDashboardRefreshIntervalMs(): number {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DASHBOARD_REFRESH_MS) {
    const n = parseInt(process.env.NEXT_PUBLIC_DASHBOARD_REFRESH_MS, 10)
    if (!Number.isNaN(n) && n >= 10_000) return n
  }
  return DASHBOARD_AUTO_REFRESH_MS
}
