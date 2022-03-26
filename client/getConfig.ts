import { ClientStageDefinition } from '../bin/buildClient';
import clientConfig from './clientConfig.json';

export const config = clientConfig.stages.find(stage => stage.stage === process.env.NEXT_PUBLIC_STAGE) as ClientStageDefinition;