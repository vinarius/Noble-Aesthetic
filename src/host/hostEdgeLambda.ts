import { LoggerFactory } from '../../lib/loggerFactory';
import { cfBasicResponse, cfEventRequest } from './models/cloudfront';

const logger = LoggerFactory.getLogger();

export async function handler(event: cfEventRequest): Promise<cfBasicResponse> {
  logger.debug('Event:', JSON.stringify(event));


  return {
    status: 200,
    body: 'Hello World!'
  };
}
