export const DEFAULT_SITE_ORIGIN = 'https://weekly-planner-krishnamahato704.krishnamahato704.chatgpt.site';

export function resolveSiteOrigin(value = DEFAULT_SITE_ORIGIN) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_SITE_URL must be an HTTPS origin without credentials, paths, query strings, or fragments.');
  }
  return url.origin;
}
