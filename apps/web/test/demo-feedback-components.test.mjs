import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const componentUrl = new URL('../src/components/DemoFeedbackButton.jsx', import.meta.url);
const contextUrl = new URL('../src/lib/demoFeedbackContext.jsx', import.meta.url);
const boundaryUrl = new URL('../src/components/DemoSurfaceErrorBoundary.jsx', import.meta.url);
const entryUrl = new URL('../src/index.jsx', import.meta.url);
const appUrl = new URL('../src/App.jsx', import.meta.url);

test('global demo feedback button is inert when demo mode is disabled', async () => {
  const source = await readFile(componentUrl, 'utf8').catch(() => '');
  assert.match(source, /if \(!enabled\) return null/);
  assert.match(source, /BUG/);
  assert.match(source, /UNEXPECTED_RESULT/);
  assert.match(source, /maxLength=\{2000\}/);
});

test('demo provider owns session context and submission', async () => {
  const source = await readFile(contextUrl, 'utf8').catch(() => '');
  assert.match(source, /createDemoSessionController/);
  assert.match(source, /VITE_DEMO_ENVIRONMENT/);
  assert.match(source, /buildDemoFeedbackPayload/);
  assert.match(source, /submitDemoFeedback/);
});

test('surface error boundary reports only a safe message and keeps a local fallback', async () => {
  const source = await readFile(boundaryUrl, 'utf8').catch(() => '');
  assert.match(source, /extends Component/);
  assert.match(source, /if \(!demoSession\.enabled\) return props\.children/);
  assert.match(source, /componentDidCatch/);
  assert.match(source, /error\?\.message/);
  assert.doesNotMatch(source, /componentStack/);
  assert.doesNotMatch(source, /error\?\.stack/);
});

test('entrypoint and application wire the global button and local surface boundary', async () => {
  const [entry, app] = await Promise.all([
    readFile(entryUrl, 'utf8'),
    readFile(appUrl, 'utf8'),
  ]);
  assert.match(entry, /DemoSessionProvider/);
  assert.match(entry, /DemoFeedbackButton/);
  assert.match(app, /DemoSurfaceErrorBoundary/);
  assert.match(app, /recordRoute\(currentView\)/);
});
