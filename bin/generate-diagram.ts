import { resolve } from 'path';
import { exec } from '../lib/utils';

const dotBinaryLocation = resolve(__dirname, '..');
const docsLocation = resolve(__dirname, '..', 'docs');

process.env.PATH = `${process.env.PATH}:${dotBinaryLocation}`;

async function generateDiagram(): Promise<void> {
  await exec(`npm run cdk-dia -- --target ${docsLocation}/architecture-diagram.png`);
  await exec(`rm ${docsLocation}/architecture-diagram.dot`);
}

generateDiagram();