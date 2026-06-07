import { handleTenantAwareRequest } from '../apps/api/src/index.js';

export default async function handler(request, response) {
  const originalUrl = request.url || '/';
  request.url = originalUrl === '/api'
    ? '/'
    : originalUrl.replace(/^\/api(?=\/|\?)/, '');
  return handleTenantAwareRequest(request, response);
}
