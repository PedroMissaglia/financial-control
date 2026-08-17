export function getApiUrl() {
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}
