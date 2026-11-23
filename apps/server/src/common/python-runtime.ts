import { existsSync } from 'fs';
import { join } from 'path';

/** Resolve the Python used by the bundled worker scripts. */
export function getPythonExecutable(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

  const localVenv = join(
    process.cwd(),
    'worker',
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python',
  );
  if (existsSync(localVenv)) return localVenv;

  const imageVenv = '/opt/worker-venv/bin/python';
  if (existsSync(imageVenv)) return imageVenv;

  return process.platform === 'win32' ? 'python' : 'python3';
}
