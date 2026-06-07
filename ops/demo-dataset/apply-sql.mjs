import { applyDemoDataset, closeDemoDatasetPool, toBoundedDemoResult } from './common.mjs';
import { assertDemoEnvironment } from '../deployment/demo-guard.mjs';

try {
  assertDemoEnvironment();
  const result = await applyDemoDataset();
  console.log(JSON.stringify({
    action: 'demo-dataset-apply-sql',
    implementation: 'postgres-adapter',
    ...toBoundedDemoResult(result),
  }, null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await closeDemoDatasetPool();
}
