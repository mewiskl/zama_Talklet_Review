#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const HARDHAT_NODE_URL = 'http://127.0.0.1:8545';

function checkHardhatNode() {
  return new Promise((resolve) => {
    const req = http.request(
      HARDHAT_NODE_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => {
      resolve(false);
    });

    req.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'net_version',
      params: [],
      id: 1,
    }));

    req.end();
  });
}

(async () => {
  const isRunning = await checkHardhatNode();
  
  if (!isRunning) {
    console.error('❌ Hardhat node is not running on http://127.0.0.1:8545');
    console.error('   Please start it with: npx hardhat node');
    process.exit(1);
  }
  
  console.log('✅ Hardhat node is running');
})();

