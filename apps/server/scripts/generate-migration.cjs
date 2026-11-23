const path = require('node:path');
const { spawnSync } = require('node:child_process');

const [requestedName, ...extraArgs] = process.argv.slice(2);
const migrationPath = requestedName
  ? requestedName.startsWith('src/')
    ? requestedName
    : path.join('src', 'database', 'migrations', requestedName)
  : path.join('src', 'database', 'migrations', 'SchemaUpdate');
const typeormCli = path.join(path.dirname(require.resolve('typeorm')), 'cli.js');

const result = spawnSync(
  process.execPath,
  [
    '-r',
    'ts-node/register',
    typeormCli,
    'migration:generate',
    migrationPath,
    '-d',
    'src/database/data-source.ts',
    ...extraArgs,
  ],
  { cwd: process.cwd(), env: process.env, stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
