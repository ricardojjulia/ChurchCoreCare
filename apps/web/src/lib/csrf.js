/**
 * Read the csrf_token cookie set by the web server and return it.
 * Returns an empty string if the cookie is not present.
 */
export function getCsrfToken() {
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? match.trim().slice('csrf_token='.length) : '';
}

/**
 * Return headers for a mutating fetch request, including the CSRF token.
 */
export function csrfHeaders(extra = {}) {
  return {
    'content-type': 'application/json',
    'x-csrf-token': getCsrfToken(),
    ...extra,
  };
}
