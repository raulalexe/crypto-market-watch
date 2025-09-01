const fs = require('fs');
const path = require('path');

function listDirectory(dir, prefix = '') {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        listDirectory(fullPath, prefix + '  ');
      } else {
        console.log(`${prefix}📄 ${item}`);
      }
    });
  } catch (error) {
    console.log(`${prefix}❌ Error reading ${dir}:`, error.message);
  }
}

console.log('🔍 Listing all files in deployment:');
listDirectory('.');
