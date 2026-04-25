import { spawn } from 'node:child_process';

function run(name, cmd, args) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exit(code || 1);
    }
  });

  return child;
}

const server = run('api', 'npm', ['run', 'dev:server']);
const client = run('web', 'npm', ['run', 'dev:client']);

function shutdown() {
  server.kill('SIGINT');
  client.kill('SIGINT');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
