import http from 'node:http';

function testConnection(host, port, path = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('Testing API server on port 3001...');
    const apiResult = await testConnection('localhost', 3001, '/v1/reporting/overview?days=30');
    console.log('✓ API server responding:', apiResult);

    console.log('\nTesting web server on port 3002...');
    const webResult = await testConnection('localhost', 3002, '/');
    console.log('✓ Web server responding:', webResult);

    console.log('\n✓ Both servers are running and responding correctly!');
    console.log('  - API: http://localhost:3001');
    console.log('  - Web: http://localhost:3002');
  } catch (error) {
    console.error('✗ Connection test failed:', error.message);
    process.exit(1);
  }
}

main();
