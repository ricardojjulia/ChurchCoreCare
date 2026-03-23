#!/usr/bin/env node

// Start both API and web servers
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start API server
const apiServer = spawn('node', ['apps/api/src/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});

console.log('API server started (PID:', apiServer.pid, ')');

// Wait a moment before starting web server
setTimeout(() => {
  const webServer = spawn('node', ['apps/web/server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '3002',
    },
  });
  
  console.log('Web server started on port 3002 (PID:', webServer.pid, ')');
  
  webServer.on('exit', (code) => {
    console.log('Web server exited with code', code);
    process.exit(code);
  });
}, 1000);

apiServer.on('exit', (code) => {
  console.log('API server exited with code', code);
});

process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  apiServer.kill();
  process.exit(0);
});
