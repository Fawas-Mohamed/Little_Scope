import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const child = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, QA_MODE: 'dev', QA_PHASE: process.env.QA_PHASE || 'dev' },
  stdio: 'inherit',
});

child.on('exit', (code) => { process.exitCode = code ?? 1; });
