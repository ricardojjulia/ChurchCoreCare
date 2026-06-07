import { applyDemoDataset, closeDemoDatasetPool, toBoundedDemoResult } from './common.mjs';
import { assertDemoEnvironment } from '../deployment/demo-guard.mjs';

try {
  assertDemoEnvironment();
  const result = await applyDemoDataset();
  console.log(JSON.stringify({
    action: 'demo-dataset-finalize',
    ...toBoundedDemoResult(result),
  }, null, 2));
  await closeDemoDatasetPool();
} catch (error) {
  await closeDemoDatasetPool();
  console.error(error.message || error);
  process.exit(1);
}
