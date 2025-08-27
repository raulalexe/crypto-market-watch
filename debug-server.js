#!/usr/bin/env node

// Start the server with debugging
console.log('🔧 Starting server with debugging...');
console.log('📝 To debug:');
console.log('1. Open Chrome and go to chrome://inspect');
console.log('2. Click "Open dedicated DevTools for Node"');
console.log('3. Set breakpoints in your code');
console.log('4. The debugger will pause execution at breakpoints');

// Start the server
require('./server/index.js');
