import { spawnSync } from 'child_process';

export async function spawn(command: string) {
  spawnSync(command, [], {
    shell: true,
    stdio: 'inherit'
  });
}