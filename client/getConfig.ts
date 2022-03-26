import { ClientStageDefinition } from '../bin/buildClient';
import json from './config.json';

export const config = json.stages.find(stage => stage.stage === process.env.NEXT_PUBLIC_STAGE) as ClientStageDefinition;