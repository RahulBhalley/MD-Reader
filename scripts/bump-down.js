const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const currentVersion = pkg.version;
const parts = currentVersion.split('.');

if (parts.length < 3) {
  console.error(`Error: Current version "${currentVersion}" does not follow YYYY.MM.increment format.`);
  process.exit(1);
}

const year = parts[0];
const month = parts[1];
const increment = parseInt(parts[2], 10);

if (isNaN(increment)) {
  console.error(`Error: Current version "${currentVersion}" has an invalid increment.`);
  process.exit(1);
}

if (increment <= 1) {
    console.error(`Error: Cannot bump down version "${currentVersion}". Increment is already at 1.`);
    process.exit(1);
}

const newVersion = `${year}.${month}.${increment - 1}`;
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped down: ${newVersion}`);
