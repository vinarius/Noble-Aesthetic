import { ClientConfig, ClientStageDefinition } from '../bin/buildClient';
import clientConfigJson from './clientConfig.json';

const stage = process.env.NEXT_PUBLIC_STAGE ?? 'dev';
const clientConfig: ClientConfig = clientConfigJson;
export const config: ClientStageDefinition = stage in clientConfig ? clientConfig[stage] : clientConfig.dev;