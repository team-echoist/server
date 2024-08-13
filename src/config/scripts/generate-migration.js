const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const kstDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
const year = new Date(kstDate).getFullYear();
const month = ('0' + (new Date(kstDate).getMonth() + 1)).slice(-2);

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

const migrationDir = path.join('src/migrations', year.toString(), month);

if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

const dataSourcePath = path.resolve('src/config/dataSourceCli.ts');

try {
  execSync(
    `npx ts-node ./node_modules/typeorm/cli.js migration:generate ${migrationDir}/${migrationName} -d ${dataSourcePath}`,
    { stdio: 'inherit' },
  );
} catch (error) {
  console.error('Error during migration generation:', error);
  process.exit(1);
}
