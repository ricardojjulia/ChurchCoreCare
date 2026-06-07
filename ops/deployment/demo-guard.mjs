export function assertDemoEnvironment(env = process.env) {
  if (env.DEMO_ENVIRONMENT !== 'true') {
    throw new Error('Synthetic seeding requires DEMO_ENVIRONMENT=true.');
  }
  return true;
}
