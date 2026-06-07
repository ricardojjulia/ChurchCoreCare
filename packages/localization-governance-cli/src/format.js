export function formatResult(result, json) {
  if (json) return JSON.stringify(result);
  if (result == null) return 'OK';
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
}
