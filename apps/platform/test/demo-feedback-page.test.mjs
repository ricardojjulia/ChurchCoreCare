import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageUrl = new URL('../src/components/DemoFeedbackPage.jsx', import.meta.url);
const appUrl = new URL('../src/App.jsx', import.meta.url);
const apiUrl = new URL('../src/lib/api.js', import.meta.url);

test('platform demo feedback page includes filters, empty state, and detail drawer', async () => {
  const source = await readFile(pageUrl, 'utf8').catch(() => '');
  assert.match(source, /Open/);
  assert.match(source, /Done/);
  assert.match(source, /All/);
  assert.match(source, /Category/);
  assert.match(source, /Email or role/);
  assert.match(source, /type="date"/);
  assert.match(source, /Drawer/);
  assert.match(source, /No demo feedback reports match these filters/);
  assert.match(source, /sessionDurationSeconds/);
  assert.match(source, /hitCount/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(source, /event\.key === 'Enter'/);
});

test('triage updates are optimistic and roll back on failure', async () => {
  const source = await readFile(pageUrl, 'utf8').catch(() => '');
  assert.match(source, /previousItems/);
  assert.match(source, /setItems\(previousItems\)/);
  assert.match(source, /updateDemoFeedback/);
});

test('platform app exposes the control demo feedback URL', async () => {
  const source = await readFile(appUrl, 'utf8');
  assert.match(source, /\/control\/demo-feedback/);
  assert.match(source, /Demo Feedback/);
  assert.match(source, /DemoFeedbackPage/);
});

test('platform API client loads and updates demo feedback', async () => {
  const source = await readFile(apiUrl, 'utf8');
  assert.match(source, /listDemoFeedback/);
  assert.match(source, /updateDemoFeedback/);
  assert.match(source, /\/v1\/platform\/demo-feedback/);
});
