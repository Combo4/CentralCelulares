// Analytics and admin reporting have been removed from the public site.
// These stubs remain so any leftover imports won't break the build.

export async function trackEvent() {
  return;
}

export function useAnalyticsSummary() {
  return { data: null, isLoading: false } as const;
}

export function useTopPhones() {
  return { data: [], isLoading: false } as const;
}
