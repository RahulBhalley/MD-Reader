const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const prefix = `${year}.${month}`;

let newVersion;
if (pkg.version.startsWith(prefix + '.')) {
  const parts = pkg.version.split('.');
  const lastPart = parts[parts.length - 1];
  const increment = parseInt(lastPart, 10) + 1;
  newVersion = `${prefix}.${increment}`;
} else {
  newVersion = `${prefix}.1`;
}

pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped: ${newVersion}`);
