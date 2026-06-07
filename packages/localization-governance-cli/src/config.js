import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadConfigFile(configPath = 'localization-governance.config.mjs') {
  const absolute = path.resolve(configPath);
  const module = await import(pathToFileURL(absolute).href);
  const config = module.default ?? module.config;
  if (!config?.service) throw new Error('Configuration must export a service.');
  return config;
}
