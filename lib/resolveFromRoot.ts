import { resolve } from 'path';

export function resolveFromRoot(...path: string[]): string {
  const segments: string[] = path.filter(seg => seg !== '');
  return resolve(__dirname, '..', ...segments);
}