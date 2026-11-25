const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const workerDir = path.resolve(__dirname, '..', 'apps', 'server', 'worker');
const environmentDir = path.join(workerDir, '.venv');
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const environmentPython = path.join(
  environmentDir,
  process.platform === 'win32' ? 'Scripts' : 'bin',
  process.platform === 'win32' ? 'python.exe' : 'python',
);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Unable to run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(environmentPython)) {
  run(python, ['-m', 'venv', environmentDir]);
}

const dependencyCheck = spawnSync(
  environmentPython,
  [
    '-c',
    "import importlib.util, ssl, sys; modules = 'requests pandas gspread oauth2client gspread_dataframe matplotlib numpy PIL PyPDF2 openpyxl cv2 pyzbar playwright'.split(); sys.exit(any(importlib.util.find_spec(name) is None for name in modules))",
  ],
  { stdio: 'ignore' },
);

if (dependencyCheck.error) {
  console.error(`Unable to check worker Python environment: ${dependencyCheck.error.message}`);
  run(python, ['-m', 'venv', '--clear', environmentDir]);
} else if (dependencyCheck.status === 0) {
  process.exit(0);
}

run(environmentPython, [
  '-m',
  'pip',
  'install',
  '-r',
  path.join(workerDir, 'requirements.txt'),
]);
